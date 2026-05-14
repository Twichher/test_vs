"""
Verification Worker — фоновый процесс проверки фото через DeepFace.

Запуск:
    python verification_worker.py

Улучшенная версия:
    - Модель: ArcFace (512-мерный embedding, точнее Facenet)
    - Детекторы: retinaface → mtcnn → opencv (fallback)
    - Retry для скачивания фото
    - Очистка памяти TensorFlow после каждой записи
"""

import os
import sys
import gc
import time
import json
import shutil
import requests
import numpy as np
from tqdm import tqdm
from deepface import DeepFace
import psycopg
from psycopg.rows import dict_row

from important_info import DSN

# ── Настройки ──────────────────────────────────────────────────────────────
MODEL_NAME = "ArcFace"                 # 512-мерный, точнее Facenet
SAME_PERSON_THRESHOLD = 0.75           # cosine distance — мягкий порог для "один и тот же человек"
DUPLICATE_THRESHOLD = 0.4              # cosine distance — строгий порог для дубликатов
CHECK_INTERVAL = 30                    # секунд между проверками
DOWNLOAD_RETRIES = 3
DETECTOR_BACKENDS = ["yunet", "mtcnn", "opencv"]
# Порядок: сначала самый точный, потом fallback'и

# ── Загрузка фото с retry ─────────────────────────────────────────────────
def download_photo(url: str, local_path: str) -> None:
    last_err = None
    for attempt in range(1, DOWNLOAD_RETRIES + 1):
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            with open(local_path, "wb") as f:
                f.write(response.content)
            return
        except Exception as e:
            last_err = e
            print(f"     ⚠️  Скачивание {url} — попытка {attempt}/{DOWNLOAD_RETRIES} неудача: {e}")
            time.sleep(1)
    raise last_err


# ── Детекция лица с fallback ──────────────────────────────────────────────
def detect_face(img_path: str):
    """
    Пробует найти лицо на фото через несколько детекторов.
    Возвращает (faces, used_backend) или выбрасывает исключение.
    """
    last_err = None
    for backend in DETECTOR_BACKENDS:
        try:
            faces = DeepFace.extract_faces(
                img_path,
                detector_backend=backend,
                enforce_detection=True,
            )
            return faces, backend
        except Exception as e:
            last_err = e
            continue
    raise last_err


# ── Embedding ─────────────────────────────────────────────────────────────
def get_embedding(img_path: str) -> list[float]:
    """
    Вычисляет embedding с fallback по детекторам.
    align=True выравнивает лицо — помогает при сильных ракурсах (профиль).
    """
    last_err = None
    for backend in DETECTOR_BACKENDS:
        try:
            result = DeepFace.represent(
                img_path=img_path,
                model_name=MODEL_NAME,
                detector_backend=backend,
                enforce_detection=True,
                align=True,
            )
            return result[0]["embedding"]
        except Exception as e:
            last_err = e
            print(f"     ⚠️  Embedding с {backend} не удался: {e}")
            continue
    raise last_err


# ── Verify двух фото ──────────────────────────────────────────────────────
def verify_same_person(img1: str, img2: str) -> tuple[bool, float]:
    """
    Возвращает (verified, distance).
    Пробует разные детекторы, если основной не справился.
    """
    last_err = None
    for backend in DETECTOR_BACKENDS:
        try:
            result = DeepFace.verify(
                img1,
                img2,
                model_name=MODEL_NAME,
                detector_backend=backend,
                enforce_detection=True,
            )
            return result["verified"], result.get("distance", -1)
        except Exception as e:
            last_err = e
            continue
    raise last_err


# ── Cosine distance ───────────────────────────────────────────────────────
def cosine_distance(emb1: list[float], emb2: list[float]) -> float:
    a = np.array(emb1, dtype=np.float32)
    b = np.array(emb2, dtype=np.float32)
    if a.shape != b.shape:
        print(f"     ⚠️  Размерности embedding не совпадают: {a.shape} vs {b.shape} — пропускаем")
        return 1.0  # максимальная дистанция = "не дубликат"
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 1.0
    return 1.0 - (dot / (norm_a * norm_b))


# ── Очистка памяти TensorFlow ─────────────────────────────────────────────
def clear_tf_memory():
    """Очищает кэш TensorFlow/Keras, чтобы не текла память."""
    try:
        import tensorflow as tf
        tf.keras.backend.clear_session()
    except Exception:
        pass
    gc.collect()


# ── Утилиты: approve / reject ─────────────────────────────────────────────
def _create_user_notification(conn, cur, notif_type: str, text: str, user_id: int):
    """Создаёт уведомление в таблицах 4 и 5."""
    cur.execute(
        """
        INSERT INTO notifications_table_4 (meeting_id, notification_type, notification_text)
        VALUES (NULL, %s, %s)
        RETURNING notification_id
        """,
        (notif_type, text),
    )
    notification_id = cur.fetchone()["notification_id"]
    cur.execute(
        """
        INSERT INTO user_notifications_table_5 (notification_id, user_id, status)
        VALUES (%s, %s, 'unread')
        """,
        (notification_id, user_id),
    )


def reject_verification(conn, cur, verification_id: int, user_id: int, answer_ai: str) -> None:
    cur.execute(
        """
        UPDATE verification_table_16
        SET status = 'rejected',
            status_changed_at = NOW(),
            answer_ai = %s
        WHERE verification_id = %s
        """,
        (answer_ai, verification_id),
    )
    _create_user_notification(
        conn, cur, "результат верификации", answer_ai, user_id
    )
    conn.commit()
    print(f"  ❌ REJECTED: verification_id={verification_id}")
    print(f"     Причина: {answer_ai}")


def approve_verification(
    conn, cur, verification_id: int, user_id: int, embedding: list[float]
) -> None:
    cur.execute(
        """
        UPDATE verification_table_16
        SET status = 'approved',
            status_changed_at = NOW(),
            answer_ai = 'Верификация пройдена успешно',
            embedding = %s
        WHERE verification_id = %s
        """,
        (json.dumps(embedding), verification_id),
    )
    cur.execute(
        """
        UPDATE user_table_1
        SET is_registration_completed = TRUE,
            registration_completed_at = NOW()
        WHERE user_id = %s
        """,
        (user_id,),
    )
    success_text = (
        "Поздравляем! Вы успешно прошли верификацию и теперь "
        "Вам доступен полный функционал системы! Желаем вам отлично провести время!"
    )
    _create_user_notification(
        conn, cur, "верификация пройдена", success_text, user_id
    )
    conn.commit()
    print(f"  ✅ APPROVED: verification_id={verification_id}")


# ── Основная обработка ────────────────────────────────────────────────────
def process_one_record(conn, cur, record: dict) -> None:
    verification_id = record["verification_id"]
    user_id = record["user_id"]
    photo_1_url = record["photo_1_url"]
    photo_2_url = record["photo_2_url"]

    print(f"\n{'='*60}")
    print(f"🆕 НАЙДЕНА НОВАЯ ВЕРИФИКАЦИЯ")
    print(f"   verification_id : {verification_id}")
    print(f"   user_id         : {user_id}")
    print(f"   model           : {MODEL_NAME}")
    print(f"   detectors       : {' → '.join(DETECTOR_BACKENDS)}")
    print(f"{'='*60}")

    tmp_dir = f"/tmp/verification_{verification_id}"
    os.makedirs(tmp_dir, exist_ok=True)
    photo1_path = os.path.join(tmp_dir, "photo1.jpg")
    photo2_path = os.path.join(tmp_dir, "photo2.jpg")

    steps = [
        "Скачивание фото",
        "Проверка 1: Детекция лица",
        "Проверка 2: Один и тот же человек",
        "Вычисление embedding",
        "Проверка 3: Поиск в БД",
        "Финализация",
    ]
    pbar = tqdm(steps, desc="Обработка", ncols=70, bar_format="{l_bar}{bar}| {n_fmt}/{total_fmt}")

    try:
        # ── ШАГ 1: Скачивание ──────────────────────────────────────────
        pbar.set_description("📥 Скачивание фото")
        download_photo(photo_1_url, photo1_path)
        download_photo(photo_2_url, photo2_path)
        print(f"  ✅ Фото скачаны")
        pbar.update(1)

        # ── ШАГ 2: Детекция лица ───────────────────────────────────────
        pbar.set_description("👤 Проверка: есть ли лицо")
        try:
            _, used_backend_1 = detect_face(photo1_path)
            _, used_backend_2 = detect_face(photo2_path)
            print(f"  ✅ Лица обнаружены (детектор: {used_backend_1} / {used_backend_2})")
        except Exception as e:
            pbar.close()
            print(f"  ❌ Лицо не обнаружено ни одним детектором: {e}")
            reject_verification(
                conn, cur, verification_id, user_id,
                "На фотографиях не обнаружен человек"
            )
            return
        pbar.update(1)

        # ── ШАГ 3: Verify ──────────────────────────────────────────────
        pbar.set_description("🔄 Проверка: один и тот же человек")
        try:
            verified, distance = verify_same_person(photo1_path, photo2_path)
            print(f"  📊 Расстояние между фото: {distance:.4f}  (порог: {SAME_PERSON_THRESHOLD})")
            # Используем distance напрямую — более мягкий порог, чтобы не отклонять
            # реальных пользователей из-за плохого освещения/ракурса
            if distance >= SAME_PERSON_THRESHOLD:
                pbar.close()
                print(f"  ❌ Разные люди (distance >= {SAME_PERSON_THRESHOLD})")
                reject_verification(
                    conn, cur, verification_id, user_id,
                    "На фотографиях изображены разные люди"
                )
                return
            if not verified:
                print(f"  ⚠️  DeepFace считает разными, но distance={distance:.4f} < {SAME_PERSON_THRESHOLD} — одобряем")
            else:
                print(f"  ✅ Один и тот же человек")
        except Exception as e:
            pbar.close()
            print(f"  ❌ Ошибка сравнения: {e}")
            reject_verification(
                conn, cur, verification_id, user_id,
                "На фотографиях изображены разные люди"
            )
            return
        pbar.update(1)

        # ── ШАГ 4: Embedding ───────────────────────────────────────────
        pbar.set_description("🧠 Вычисление embedding")
        try:
            embedding = get_embedding(photo1_path)
            print(f"  ✅ Embedding вычислен (размер: {len(embedding)})")
        except Exception as e:
            pbar.close()
            print(f"  ❌ Ошибка embedding: {e}")
            reject_verification(
                conn, cur, verification_id, user_id,
                "Ошибка при анализе фотографий"
            )
            return
        pbar.update(1)

        # ── ШАГ 5: Поиск в БД ──────────────────────────────────────────
        pbar.set_description("🔍 Проверка: есть ли в БД")
        cur.execute(
            """
            SELECT verification_id, user_id, embedding
            FROM verification_table_16
            WHERE status = 'approved'
              AND verification_id != %s
              AND embedding IS NOT NULL
            """,
            (verification_id,),
        )
        approved_records = cur.fetchall()
        print(f"  📋 Найдено approved записей в БД: {len(approved_records)}")

        is_duplicate = False
        if approved_records:
            for approved in approved_records:
                db_emb = approved["embedding"]
                if isinstance(db_emb, str):
                    db_emb = json.loads(db_emb)
                dist = cosine_distance(embedding, db_emb)
                match = "🔴 ДУБЛИКАТ" if dist < DUPLICATE_THRESHOLD else "🟢 Ок"
                print(f"     vs user_id={approved['user_id']:>4} | dist={dist:.4f} | {match}")
                if dist < DUPLICATE_THRESHOLD:
                    is_duplicate = True
                    break
        else:
            print(f"     База пуста — пропускаем проверку на дубликат")

        if is_duplicate:
            pbar.close()
            print(f"  ❌ Найден дубликат!")
            reject_verification(
                conn, cur, verification_id, user_id,
                "Данный пользователь уже есть в системе"
            )
            return
        print(f"  ✅ Дубликатов не найдено")
        pbar.update(1)

        # ── ШАГ 6: Approve ─────────────────────────────────────────────
        pbar.set_description("✅ Финализация")
        approve_verification(conn, cur, verification_id, user_id, embedding)
        pbar.update(1)
        pbar.close()

    except Exception as e:
        pbar.close()
        print(f"  ❌ НЕПРЕДВИДЕННАЯ ОШИБКА: {e}")
        conn.rollback()
        # Чтобы не зациклиться на одной и той же записи — reject'им её
        try:
            reject_verification(
                conn, cur, verification_id, user_id,
                "Техническая ошибка при проверке. Попробуйте загрузить фото ещё раз."
            )
            print(f"  🔄 Запись reject'нута, чтобы избежать бесконечного цикла")
        except Exception as reject_err:
            print(f"  💥 Не удалось reject'нуть запись: {reject_err}")
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        print(f"  🧹 Временные файлы удалены")
        clear_tf_memory()
        print(f"  🧹 Память TensorFlow очищена")


# ── Главный цикл ──────────────────────────────────────────────────────────
def main() -> None:
    print("\n" + "="*60)
    print("🚀 VERIFICATION WORKER ЗАПУЩЕН")
    print("="*60)
    print(f"📌 Модель        : {MODEL_NAME} (512d)")
    print(f"📌 Детекторы     : {' → '.join(DETECTOR_BACKENDS)} (fallback)")
    print(f"📌 Same-person   : {SAME_PERSON_THRESHOLD}")
    print(f"📌 Duplicate     : {DUPLICATE_THRESHOLD}")
    print(f"📌 Интервал      : {CHECK_INTERVAL} сек")
    print("="*60 + "\n")

    while True:
        try:
            with psycopg.connect(DSN, row_factory=dict_row) as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        SELECT verification_id, user_id, photo_1_url, photo_2_url,
                               status, photos_uploaded_at
                        FROM verification_table_16
                        WHERE status = 'created'
                        ORDER BY photos_uploaded_at ASC
                        LIMIT 1
                        """
                    )
                    record = cur.fetchone()

                    if not record:
                        print(f"⏳ Нет записей в статусе 'created'. Ждём {CHECK_INTERVAL} сек...")
                        time.sleep(CHECK_INTERVAL)
                        continue

                    process_one_record(conn, cur, record)

        except Exception as e:
            print(f"\n💥 КРИТИЧЕСКАЯ ОШИБКА: {e}")
            print(f"   Перезапуск через {CHECK_INTERVAL} сек...")
            time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    main()
