import psycopg
from psycopg.rows import dict_row

from important_info import DSN


#------------------------------------------------------------------------------------------------------
#roots to MEETINGS
#------------------------------------------------------------------------------------------------------

# функция отменяет запись пользователя (переводит его из registered в missed)
def USERS_update_miss_meeting(meeting_id: int, user_id: int):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                            
                UPDATE meeting_rating_table_8
                SET user_action = 'missed'
                WHERE user_id = %s and meeting_id = %s

                """, (user_id, meeting_id))
                return {"MEETING": meeting_id, "USER": user_id, "ACTION": "MISSED", "ANSWER": True}
    except Exception as error:
        return (False, error, "USERS_update_miss_meeting")


# функция отменяет встречу организатором (меняет статус на 'canceled')
def MEETINGS_cancel_by_organizer(meeting_id: int, user_id: int):
    """
    Отменяет встречу организатором.
    Проверяет, что пользователь является создателем встречи и статус позволяет отмену.
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                # Проверяем, что пользователь - создатель встречи и статус допускает отмену
                cur.execute("""
                    SELECT creator_user_id, status
                    FROM meeting_table_2
                    WHERE meeting_id = %s
                """, (meeting_id,))
                meeting = cur.fetchone()
                
                if not meeting:
                    return (False, "Встреча не найдена", "MEETINGS_cancel_by_organizer")
                
                if meeting["creator_user_id"] != user_id:
                    return (False, "Только создатель может отменить встречу", "MEETINGS_cancel_by_organizer")
                
                if meeting["status"] not in ['created', 'in_progress']:
                    return (False, f"Нельзя отменить встречу со статусом '{meeting['status']}'", "MEETINGS_cancel_by_organizer")
                
                # Обновляем статус на 'canceled'
                cur.execute("""
                    UPDATE meeting_table_2
                    SET status = 'canceled'
                    WHERE meeting_id = %s
                    RETURNING meeting_id, status
                """, (meeting_id,))
                
                result = cur.fetchone()
                conn.commit()
                
                return {
                    "meeting_id": result["meeting_id"],
                    "status": result["status"],
                    "success": True,
                    "message": "Встреча успешно отменена"
                }
    except Exception as error:
        return (False, error, "MEETINGS_cancel_by_organizer")


def MEETINGS_finish_by_organizer(meeting_id: int, user_id: int):
    """
    Завершает встречу организатором.
    Проверяет, что пользователь является создателем встречи и статус позволяет завершение.
    Статус меняется на 'in_progress' (встреча идёт/завершена, ожидает оценки участников).
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                # Проверяем, что пользователь - создатель встречи и статус допускает завершение
                cur.execute("""
                    SELECT creator_user_id, status
                    FROM meeting_table_2
                    WHERE meeting_id = %s
                """, (meeting_id,))
                meeting = cur.fetchone()
                
                if not meeting:
                    return (False, "Встреча не найдена", "MEETINGS_finish_by_organizer")
                
                if meeting["creator_user_id"] != user_id:
                    return (False, "Только создатель может завершить встречу", "MEETINGS_finish_by_organizer")
                
                if meeting["status"] != 'created':
                    return (False, f"Нельзя завершить встречу со статусом '{meeting['status']}'", "MEETINGS_finish_by_organizer")
                
                # Обновляем статус на 'in_progress'
                cur.execute("""
                    UPDATE meeting_table_2
                    SET status = 'in_progress'
                    WHERE meeting_id = %s
                    RETURNING meeting_id, status
                """, (meeting_id,))
                
                result = cur.fetchone()
                conn.commit()
                
                return {
                    "meeting_id": result["meeting_id"],
                    "status": result["status"],
                    "success": True,
                    "message": "Встреча успешно завершена"
                }
    except Exception as error:
        return (False, error, "MEETINGS_finish_by_organizer")


def MEETINGS_save_participants_ratings(record_id: int, meeting_id: int, organizer_user_id: int, ratings: list):
    """
    Сохраняет оценки участников встречи организатором.
    - Вставляет оценки в user_ratings_table_15 (только для attended)
    - Обновляет user_action в meeting_rating_table_8 (для missed)
    - Обновляет israted = 1 в user_notifications_table_5 по record_id
    - Меняет статус встречи на 'finished'
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                # Проверяем, что пользователь - создатель встречи
                cur.execute("""
                    SELECT creator_user_id
                    FROM meeting_table_2
                    WHERE meeting_id = %s
                """, (meeting_id,))
                meeting = cur.fetchone()
                
                if not meeting:
                    return (False, "Встреча не найдена", "MEETINGS_save_participants_ratings")
                
                if meeting["creator_user_id"] != organizer_user_id:
                    return (False, "Только создатель может оценивать участников", "MEETINGS_save_participants_ratings")
                
                # Обрабатываем каждую оценку
                for rating in ratings:
                    user_id = rating.get("user_id")
                    user_action = rating.get("user_action")
                    rating_value = rating.get("rating_value")
                    
                    # Обновляем user_action в meeting_rating_table_8
                    # Для "missed" от организатора используем "missedbyorg"
                    db_user_action = 'missedbyorg' if user_action == 'missed' else user_action
                    cur.execute("""
                        UPDATE meeting_rating_table_8
                        SET user_action = %s
                        WHERE meeting_id = %s AND user_id = %s
                    """, (db_user_action, meeting_id, user_id))
                    
                    # Если пользователь был на встрече и есть оценка, добавляем в user_ratings_table_15
                    if user_action == 'attended' and rating_value is not None:
                        cur.execute("""
                            INSERT INTO user_ratings_table_15 
                            (rated_user_id, rater_user_id, rating_value, meeting_id)
                            VALUES (%s, %s, %s, %s)
                        """, (user_id, organizer_user_id, rating_value, meeting_id))
                
                # Обновляем israted в уведомлении организатора по record_id
                cur.execute("""
                    UPDATE user_notifications_table_5
                    SET israted = 1
                    WHERE record_id = %s
                """, (record_id,))
                
                # Создаем конфликты для пользователей с missedbyorg
                # Считаем количество attended пользователей (они будут голосовать)
                attended_count = sum(1 for r in ratings if r.get("user_action") == 'attended')
                
                # Для каждого missedbyorg пользователя создаем запись в conflict_table_7
                for rating in ratings:
                    if rating.get("user_action") == 'missed':
                        missed_user_id = rating.get("user_id")
                        cur.execute("""
                            INSERT INTO conflict_table_7 
                            (meeting_id, user_id, total_allowed_to_vote)
                            VALUES (%s, %s, %s)
                        """, (meeting_id, missed_user_id, attended_count))
                
                # Меняем статус встречи на 'finished'
                cur.execute("""
                    UPDATE meeting_table_2
                    SET status = 'finished'
                    WHERE meeting_id = %s
                """, (meeting_id,))
                
                # Получаем данные встречи для уведомлений
                cur.execute("""
                    SELECT title, start_at, end_at, address
                    FROM meeting_table_2
                    WHERE meeting_id = %s
                """, (meeting_id,))
                meeting_info = cur.fetchone()
                
                if meeting_info:
                    meeting_title = meeting_info["title"]
                    meeting_start = meeting_info["start_at"]
                    meeting_end = meeting_info["end_at"]
                    meeting_address = meeting_info["address"] or 'Адрес не указан'
                    
                    # --- Уведомление для attended пользователей ---
                    rate_notification_text = (
                        f'Встреча от {meeting_start} "{meeting_title}" закончилась! '
                        f'Мы надеемся тебе понравилось. Теперь ты можешь оценить саму встречу, '
                        f'а также всех визитеров, что там были.'
                    )
                    
                    cur.execute("""
                        INSERT INTO notifications_table_4 (meeting_id, notification_type, notification_text)
                        VALUES (%s, 'оценка встречи', %s)
                        RETURNING notification_id
                    """, (meeting_id, rate_notification_text))
                    
                    rate_notification_result = cur.fetchone()
                    if rate_notification_result:
                        rate_notification_id = rate_notification_result["notification_id"]
                        
                        # Находим всех attended пользователей для этой встречи
                        cur.execute("""
                            SELECT user_id
                            FROM meeting_rating_table_8
                            WHERE meeting_id = %s AND user_action = 'attended'
                        """, (meeting_id,))
                        attended_users = cur.fetchall()
                        
                        # Отправляем уведомление каждому attended пользователю
                        for user_row in attended_users:
                            attended_user_id = user_row["user_id"]
                            cur.execute("""
                                INSERT INTO user_notifications_table_5 (notification_id, user_id, status)
                                VALUES (%s, %s, 'unread')
                                ON CONFLICT (notification_id, user_id) DO NOTHING
                            """, (rate_notification_id, attended_user_id))
                    
                    # --- Уведомление для missedbyorg пользователей ---
                    missedbyorg_notification_text = (
                        f'Организатор встречи "{meeting_title}", которая проходила '
                        f'с {meeting_start} до {meeting_end} по адресу {meeting_address}, '
                        f'отметил Вас как отсутствующего.'
                    )
                    
                    cur.execute("""
                        INSERT INTO notifications_table_4 (meeting_id, notification_type, notification_text)
                        VALUES (%s, 'конфликт', %s)
                        RETURNING notification_id
                    """, (meeting_id, missedbyorg_notification_text))
                    
                    conflict_notification_result = cur.fetchone()
                    if conflict_notification_result:
                        conflict_notification_id = conflict_notification_result["notification_id"]
                        
                        # Отправляем уведомление каждому missedbyorg пользователю
                        for rating in ratings:
                            if rating.get("user_action") == 'missed':
                                missed_user_id = rating.get("user_id")
                                cur.execute("""
                                    INSERT INTO user_notifications_table_5 (notification_id, user_id, status, israted)
                                    VALUES (%s, %s, 'unread', 0)
                                    ON CONFLICT (notification_id, user_id) DO NOTHING
                                """, (conflict_notification_id, missed_user_id))
                
                conn.commit()
                
                return {
                    "success": True,
                    "message": "Оценки успешно сохранены"
                }
    except Exception as error:
        return (False, error, "MEETINGS_save_participants_ratings")


def MEETINGS_save_user_ratings(record_id: int, meeting_id: int, user_id: int, meeting_rating: int | None, user_ratings: list, has_extra_people: bool | None = None):
    """
    Сохраняет оценки от участника встречи.
    - Вставляет оценку встречи в meeting_rating_info_table_26
    - Вставляет оценки пользователей в user_ratings_table_15
    - Обновляет голоса в conflict_table_7
    - Обновляет israted = 1 в user_notifications_table_5 по record_id
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                # Проверяем, что пользователь участвовал во встрече (attended)
                cur.execute("""
                    SELECT user_action
                    FROM meeting_rating_table_8
                    WHERE meeting_id = %s AND user_id = %s
                """, (meeting_id, user_id))
                participation = cur.fetchone()
                
                if not participation or participation["user_action"] != 'attended':
                    return (False, "Только участники встречи могут оставлять оценки", "MEETINGS_save_user_ratings")
                
                # Сохраняем оценку встречи
                if meeting_rating is not None:
                    cur.execute("""
                        INSERT INTO meeting_rating_info_table_26 
                        (meeting_id, user_id, meeting_rating)
                        VALUES (%s, %s, %s)
                    """, (meeting_id, user_id, meeting_rating))
                
                # Сохраняем оценки пользователей
                for rating in user_ratings:
                    rated_user_id = rating.get("rated_user_id")
                    rating_value = rating.get("rating_value")
                    
                    if rated_user_id is not None and rating_value is not None:
                        cur.execute("""
                            INSERT INTO user_ratings_table_15 
                            (rated_user_id, rater_user_id, rating_value, meeting_id)
                            VALUES (%s, %s, %s, %s)
                        """, (rated_user_id, user_id, rating_value, meeting_id))
                        
                        # Обновляем голоса в conflict_table_7 (если оцениваемый пользователь missedbyorg и конфликт еще не решен)
                        cur.execute("""
                            UPDATE conflict_table_7
                            SET total_voted = total_voted + 1,
                                voted_for_count = voted_for_count + 1
                            WHERE meeting_id = %s AND user_id = %s AND status = 'in_progress'
                        """, (meeting_id, rated_user_id))
                
                # Если пользователь НЕ нажал "да" (не проголосовал "за" missedbyorg),
                # увеличиваем total_voted для ВСЕХ записей conflict_table_7 по данной встрече (только активных)
                if has_extra_people is not True:
                    cur.execute("""
                        UPDATE conflict_table_7
                        SET total_voted = total_voted + 1
                        WHERE meeting_id = %s AND status = 'in_progress'
                    """, (meeting_id,))
                
                # Обновляем israted в уведомлении по record_id
                cur.execute("""
                    UPDATE user_notifications_table_5
                    SET israted = 1
                    WHERE record_id = %s
                """, (record_id,))
                
                conn.commit()
                
                return {
                    "success": True,
                    "message": "Оценки успешно сохранены"
                }
    except Exception as error:
        return (False, error, "MEETINGS_save_user_ratings")


#------------------------------------------------------------------------------------------------------
#roots to USERS
#------------------------------------------------------------------------------------------------------


def USERS_create_user(first_name: str, last_name: str, middle_name: str | None, email: str, password: str, birth_date: str, gender: str):
    """
    Создаёт нового пользователя.
    - Хеширует пароль через crypt/bcrypt
    - Создаёт запись в user_extra_info_table_3 с 3 встречами в подарок
    - Возвращает данные пользователя (как UserResp)
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                # Вставляем пользователя
                cur.execute("""
                    INSERT INTO user_table_1 
                    (first_name, last_name, middle_name, email, password_hash, birth_date, gender, city, 
                     is_organizer, is_admin, is_blocked, is_registration_completed)
                    VALUES (%s, %s, %s, %s, crypt(%s, gen_salt('bf', 12)), %s, %s, 'Москва', 
                            FALSE, FALSE, FALSE, FALSE)
                    RETURNING user_id, first_name, last_name, district, 
                              is_blocked, is_organizer, is_admin, is_registration_completed
                """, (first_name, last_name, middle_name, email, password, birth_date, gender))
                
                user = cur.fetchone()
                user_id = user["user_id"]
                
                # Создаём начальную запись статистики с 3 встречами в подарок
                cur.execute("""
                    INSERT INTO user_extra_info_table_3 
                    (user_id, meetings_as_currency, date_of_stats)
                    VALUES (%s, 3, NOW())
                """, (user_id,))
                
                conn.commit()
                
                # Добавляем meetings_as_currency к результату
                user["meetings_as_currency"] = 3
                return user
    except psycopg.errors.UniqueViolation:
        return (False, "Пользователь с таким email уже существует", "USERS_create_user")
    except Exception as error:
        return (False, error, "USERS_create_user")


# функция записывает запись пользователя на встречу
def USERS_post_reg_to_meet(meeting_id: int, user_id: int, user_action: str):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                # 1. Получаем доступную валюту (последняя запись)
                cur.execute("""
                    SELECT meetings_as_currency
                    FROM user_extra_info_table_3
                    WHERE user_id = %s
                    ORDER BY date_of_stats DESC
                    LIMIT 1
                """, (user_id,))
                currency_row = cur.fetchone()
                meetings_as_currency = currency_row["meetings_as_currency"] if currency_row else 0
                
                # 2. Считаем активные записи (registered + missed на created/in_progress встречах)
                cur.execute("""
                    SELECT COUNT(*) as active_count
                    FROM meeting_rating_table_8 mr
                    JOIN meeting_table_2 m ON m.meeting_id = mr.meeting_id
                    WHERE mr.user_id = %s
                      AND mr.user_action IN ('registered', 'missed')
                      AND m.status IN ('created', 'in_progress')
                """, (user_id,))
                active_row = cur.fetchone()
                active_count = active_row["active_count"] if active_row else 0
                
                # 3. Проверяем, хватает ли валюты
                if (active_count + 1) > meetings_as_currency:
                    return (False, "Вам не хватает встреч.", "USERS_post_reg_to_meet")
                
                # 4. Регистрируем пользователя
                cur.execute("""
                    INSERT INTO meeting_rating_table_8
                        (meeting_id, user_id, user_action)
                    VALUES (%s, %s, %s)
                """, (meeting_id, user_id, user_action))
                
                conn.commit()

                return {"MEETING": meeting_id, "USER": user_id, "ACTION": user_action, "ANSWER": True}

    except psycopg.errors.RaiseException as e:
        return (False, str(e), "USERS_post_reg_to_meet")
    except Exception as e:
        return (False, str(e), "USERS_post_reg_to_meet")


#------------------------------------------------------------------------------------------------------
# Функции обновления данных пользователя (Settings Page)
#------------------------------------------------------------------------------------------------------

# обновление фамилии пользователя
def USERS_update_last_name(user_id: int, last_name: str):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE user_table_1
                    SET last_name = %s
                    WHERE user_id = %s
                    RETURNING user_id, last_name
                """, (last_name, user_id))
                result = cur.fetchone()
                return {"user_id": result["user_id"], "last_name": result["last_name"], "success": True}
    except Exception as error:
        return (False, error, "USERS_update_last_name")


# обновление имени пользователя
def USERS_update_first_name(user_id: int, first_name: str):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE user_table_1
                    SET first_name = %s
                    WHERE user_id = %s
                    RETURNING user_id, first_name
                """, (first_name, user_id))
                result = cur.fetchone()
                return {"user_id": result["user_id"], "first_name": result["first_name"], "success": True}
    except Exception as error:
        return (False, error, "USERS_update_first_name")


# обновление даты рождения пользователя
def USERS_update_birth_date(user_id: int, birth_date: str):
    """
    birth_date должен быть в формате 'YYYY-MM-DD' или 'DD.MM.YYYY'
    """
    try:
        # Проверяем формат даты и конвертируем если нужно
        from datetime import datetime
        
        # Пробуем разные форматы
        formats = ['%Y-%m-%d', '%d.%m.%Y', '%d-%m-%Y']
        parsed_date = None
        
        for fmt in formats:
            try:
                parsed_date = datetime.strptime(birth_date, fmt)
                break
            except ValueError:
                continue
        
        if parsed_date is None:
            return (False, "Неверный формат даты. Используйте ДД.ММ.ГГГГ", "USERS_update_birth_date")
        
        # Конвертируем в формат PostgreSQL
        date_for_db = parsed_date.strftime('%Y-%m-%d')
        
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE user_table_1
                    SET birth_date = %s
                    WHERE user_id = %s
                    RETURNING user_id, birth_date
                """, (date_for_db, user_id))
                result = cur.fetchone()
                return {"user_id": result["user_id"], "birth_date": result["birth_date"], "success": True}
    except Exception as error:
        return (False, error, "USERS_update_birth_date")


# обновление пола пользователя
def USERS_update_gender(user_id: int, gender: str):
    """
    gender должен быть 'M' (Мужской) или 'F' (Женский)
    """
    try:
        # Валидация значения
        if gender not in ['M', 'F']:
            return (False, "Пол должен быть 'M' (Мужской) или 'F' (Женский)", "USERS_update_gender")
        
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE user_table_1
                    SET gender = %s
                    WHERE user_id = %s
                    RETURNING user_id, gender
                """, (gender, user_id))
                result = cur.fetchone()
                return {"user_id": result["user_id"], "gender": result["gender"], "success": True}
    except Exception as error:
        return (False, error, "USERS_update_gender")


# обновление района (квартала) пользователя
def USERS_update_district(user_id: int, district: str):
    """
    district - один из районов Москвы
    """
    # Список всех районов Москвы
    valid_districts = [
        'ЦАО', 'САО', 'СВАО', 'ВАО', 'ЮВАО', 'ЮАО', 'ЮЗАО', 'ЗАО', 'СЗАО', 'ЗелАО', 'ТАО', 'НАО'
    ]
    
    try:
        # Валидация района
        if district not in valid_districts:
            return (False, f"Неверный район. Допустимые значения: {', '.join(valid_districts)}", "USERS_update_district")
        
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE user_table_1
                    SET district = %s
                    WHERE user_id = %s
                    RETURNING user_id, district
                """, (district, user_id))
                result = cur.fetchone()
                return {"user_id": result["user_id"], "district": result["district"], "success": True}
    except Exception as error:
        return (False, error, "USERS_update_district")


# универсальная функция обновления настроек пользователя
def USERS_update_settings(user_id: int, **kwargs):
    """
    Обновляет только переданные поля пользователя.
    Допустимые поля: first_name, last_name, birth_date, gender, district
    """
    # Фильтруем None значения
    fields_to_update = {k: v for k, v in kwargs.items() if v is not None}
    
    if not fields_to_update:
        return {"success": True, "message": "Нет данных для обновления"}
    
    # Валидация полей
    allowed_fields = ['first_name', 'last_name', 'birth_date', 'gender', 'district']
    for field in fields_to_update.keys():
        if field not in allowed_fields:
            return (False, f"Недопустимое поле: {field}", "USERS_update_settings")
    
    try:
        # Преобразуем birth_date если передана
        if 'birth_date' in fields_to_update:
            from datetime import datetime
            birth_date = fields_to_update['birth_date']
            formats = ['%Y-%m-%d', '%d.%m.%Y', '%d-%m-%Y']
            parsed_date = None
            for fmt in formats:
                try:
                    parsed_date = datetime.strptime(birth_date, fmt)
                    break
                except ValueError:
                    continue
            if parsed_date is None:
                return (False, "Неверный формат даты рождения", "USERS_update_settings")
            fields_to_update['birth_date'] = parsed_date.strftime('%Y-%m-%d')
        
        # Валидация gender
        if 'gender' in fields_to_update:
            gender = fields_to_update['gender']
            if gender == 'Мужской':
                fields_to_update['gender'] = 'M'
            elif gender == 'Женский':
                fields_to_update['gender'] = 'F'
            elif gender not in ['M', 'F']:
                return (False, "Неверное значение пола", "USERS_update_settings")
        
        # Валидация district
        if 'district' in fields_to_update:
            valid_districts = ['ЦАО', 'САО', 'СВАО', 'ВАО', 'ЮВАО', 'ЮАО', 'ЮЗАО', 'ЗАО', 'СЗАО', 'ЗелАО', 'ТАО', 'НАО']
            if fields_to_update['district'] not in valid_districts:
                return (False, "Неверный район", "USERS_update_settings")
        
        # Формируем SQL запрос динамически
        set_clauses = []
        values = []
        for field, value in fields_to_update.items():
            set_clauses.append(f"{field} = %s")
            values.append(value)
        
        values.append(user_id)
        
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                sql = f"""
                    UPDATE user_table_1
                    SET {', '.join(set_clauses)}
                    WHERE user_id = %s
                    RETURNING user_id, first_name, last_name, birth_date, gender, district
                """
                cur.execute(sql, values)
                result = cur.fetchone()
                return {
                    "success": True,
                    "user_id": result["user_id"],
                    "first_name": result["first_name"],
                    "last_name": result["last_name"],
                    "birth_date": result["birth_date"],
                    "gender": result["gender"],
                    "district": result["district"]
                }
    except Exception as error:
        return (False, error, "USERS_update_settings")


# добавление фотографии пользователя в таблицу
def USERS_add_photo(user_id: int, photo_url: str):
    """
    Добавляет запись о фотографии пользователя в user_photos_table_14
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO user_photos_table_14 (user_id, photo_url)
                    VALUES (%s, %s)
                    RETURNING record_id, user_id, photo_url, uploaded_at
                """, (user_id, photo_url))
                result = cur.fetchone()
                return {
                    "success": True,
                    "record_id": result["record_id"],
                    "user_id": result["user_id"],
                    "photo_url": result["photo_url"],
                    "uploaded_at": result["uploaded_at"]
                }
    except Exception as error:
        return (False, error, "USERS_add_photo")


#------------------------------------------------------------------------------------------------------
# roots to Currency
#------------------------------------------------------------------------------------------------------
    
def USERS_reset_earned_currency(user_id: int):
    """
    Обнуляет earned_currency для пользователя (при выводе средств).
    Обновляет последнюю запись в user_extra_info_table_3, устанавливая earned_currency = 0.
    """
    try:
        with psycopg.connect(DSN) as conn:
            with conn.cursor() as cur:
                # Находим последнюю запись пользователя и обновляем earned_currency
                cur.execute("""
                UPDATE user_extra_info_table_3
                SET earned_currency = 0
                WHERE record_id = (
                    SELECT record_id
                    FROM user_extra_info_table_3
                    WHERE user_id = %s
                    ORDER BY record_id DESC
                    LIMIT 1
                )
                RETURNING record_id, earned_currency;
                """, (user_id,))
                
                result = cur.fetchone()
                if not result:
                    return (False, "User not found", "USERS_reset_earned_currency")
                
                conn.commit()
                return result[0]
    except Exception as error:
        return (False, error, "USERS_reset_earned_currency")


#------------------------------------------------------------------------------------------------------
# roots to Notifications
#------------------------------------------------------------------------------------------------------

# обновление статуса уведомления на 'read'
def USERS_mark_notification_as_read(record_id: int, user_id: int):
    """
    Отмечает уведомление как прочитанное (status = 'read')
    Проверяет, что уведомление принадлежит указанному пользователю
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                # Проверяем что уведомление принадлежит пользователю
                cur.execute("""
                    SELECT record_id FROM user_notifications_table_5
                    WHERE record_id = %s AND user_id = %s
                """, (record_id, user_id))
                
                if not cur.fetchone():
                    return (False, "Уведомление не найдено или не принадлежит пользователю", "USERS_mark_notification_as_read")
                
                # Обновляем статус
                cur.execute("""
                    UPDATE user_notifications_table_5
                    SET status = 'read'
                    WHERE record_id = %s
                    RETURNING record_id, status
                """, (record_id,))
                
                result = cur.fetchone()
                conn.commit()
                
                return {
                    "record_id": result["record_id"],
                    "status": result["status"],
                    "success": True
                }
    except Exception as error:
        return (False, error, "USERS_mark_notification_as_read")


def NOTIFICATIONS_send_to_user(notification_id: int, user_id: int):
    """
    Отправляет уведомление пользователю (создает запись в user_notifications_table_5).
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO user_notifications_table_5 (notification_id, user_id, status)
                    VALUES (%s, %s, 'unread')
                    ON CONFLICT (notification_id, user_id) DO NOTHING
                    RETURNING record_id
                """, (notification_id, user_id))
                
                result = cur.fetchone()
                conn.commit()
                
                return {
                    "record_id": result["record_id"] if result else None,
                    "success": True
                }
    except Exception as error:
        return (False, error, "NOTIFICATIONS_send_to_user")


def NOTIFICATION_PHOTOS_copy_by_notification(source_notification_id: int, target_notification_id: int):
    """
    Копирует все фото из notification_photos_table_6 от одного уведомления к другому.
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO notification_photos_table_6 (notification_id, photo_url)
                    SELECT %s, photo_url
                    FROM notification_photos_table_6
                    WHERE notification_id = %s
                """, (target_notification_id, source_notification_id))
                
                conn.commit()
                
                return {
                    "success": True,
                    "message": "Фото скопированы"
                }
    except Exception as error:
        return (False, error, "NOTIFICATION_PHOTOS_copy_by_notification")


#------------------------------------------------------------------------------------------------------
#roots to CONFLICTS
#------------------------------------------------------------------------------------------------------

def CONFLICTS_respond(record_id: int, user_id: int, attended: bool):
    """
    Обрабатывает ответ пользователя на конфликт (missedbyorg).
    - attended=False: isconflict=1, status='no', finished_at=NOW()
    - attended=True:  isconflict=1 (ждем голосов attended)
    - Обновляет israted=1 в user_notifications_table_5
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                # Находим meeting_id через уведомление
                cur.execute("""
                    SELECT n.meeting_id
                    FROM user_notifications_table_5 un
                    JOIN notifications_table_4 n ON n.notification_id = un.notification_id
                    WHERE un.record_id = %s AND un.user_id = %s AND n.notification_type = 'конфликт'
                """, (record_id, user_id))
                notification_row = cur.fetchone()
                
                if not notification_row:
                    return (False, "Уведомление не найдено или не принадлежит пользователю", "CONFLICTS_respond")
                
                meeting_id = notification_row["meeting_id"]
                
                # Находим запись конфликта
                cur.execute("""
                    SELECT conflict_id, status
                    FROM conflict_table_7
                    WHERE meeting_id = %s AND user_id = %s
                """, (meeting_id, user_id))
                conflict_row = cur.fetchone()
                
                if not conflict_row:
                    return (False, "Конфликт не найден", "CONFLICTS_respond")
                
                conflict_id = conflict_row["conflict_id"]
                current_status = conflict_row["status"]
                
                if current_status != 'in_progress':
                    return (False, "Конфликт уже решен", "CONFLICTS_respond")
                
                # Обновляем конфликт в зависимости от ответа
                if attended:
                    cur.execute("""
                        UPDATE conflict_table_7
                        SET isconflict = 2
                        WHERE conflict_id = %s
                    """, (conflict_id,))
                else:
                    cur.execute("""
                        UPDATE conflict_table_7
                        SET isconflict = 1, status = 'no', finished_at = NOW()
                        WHERE conflict_id = %s
                    """, (conflict_id,))
                
                # Отмечаем уведомление как "отвеченное" (israted = 1)
                cur.execute("""
                    UPDATE user_notifications_table_5
                    SET israted = 1
                    WHERE record_id = %s AND user_id = %s
                """, (record_id, user_id))
                
                conn.commit()
                
                return {
                    "success": True,
                    "message": "Ответ сохранен"
                }
    except Exception as error:
        return (False, error, "CONFLICTS_respond")


#------------------------------------------------------------------------------------------------------
#roots to CONFLICTS (appeal / extra order)
#------------------------------------------------------------------------------------------------------

def CONFLICTS_save_appeal(record_id: int, user_id: int, proof_text: str | None, photo_urls: list[str]):
    """
    Сохраняет апелляцию пользователя на конфликт (extra_order).
    - Обновляет proof_text и type_conflict в conflict_table_7
    - Сохраняет фото в conflict_photos_table_9
    - Отмечает уведомление как israted = 1
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                # Находим meeting_id через уведомление
                cur.execute("""
                    SELECT n.meeting_id
                    FROM user_notifications_table_5 un
                    JOIN notifications_table_4 n ON n.notification_id = un.notification_id
                    WHERE un.record_id = %s AND un.user_id = %s AND n.notification_type = 'вас не было'
                """, (record_id, user_id))
                notification_row = cur.fetchone()
                
                if not notification_row:
                    return (False, "Уведомление не найдено или не принадлежит пользователю", "CONFLICTS_save_appeal")
                
                meeting_id = notification_row["meeting_id"]
                
                # Находим конфликт
                cur.execute("""
                    SELECT conflict_id
                    FROM conflict_table_7
                    WHERE meeting_id = %s AND user_id = %s
                """, (meeting_id, user_id))
                conflict_row = cur.fetchone()
                
                if not conflict_row:
                    return (False, "Конфликт не найден", "CONFLICTS_save_appeal")
                
                conflict_id = conflict_row["conflict_id"]
                
                # Обновляем конфликт
                cur.execute("""
                    UPDATE conflict_table_7
                    SET proof_text = %s, type_conflict = 'extra_order'
                    WHERE conflict_id = %s
                """, (proof_text, conflict_id))
                
                # Сохраняем фото
                for url in photo_urls:
                    cur.execute("""
                        INSERT INTO conflict_photos_table_9 (conflict_id, proof_photo_url)
                        VALUES (%s, %s)
                    """, (conflict_id, url))
                
                # Отмечаем уведомление как отвеченное
                cur.execute("""
                    UPDATE user_notifications_table_5
                    SET israted = 1
                    WHERE record_id = %s AND user_id = %s
                """, (record_id, user_id))
                
                conn.commit()
                
                return {
                    "success": True,
                    "message": "Доказательства отправлены"
                }
    except Exception as error:
        return (False, error, "CONFLICTS_save_appeal")


#------------------------------------------------------------------------------------------------------
# roots to Services (Shop)
#------------------------------------------------------------------------------------------------------

import re

def SERVICES_buy_service(service_id: int, user_id: int):
    """
    Покупка услуги пользователем.
    - Записывает покупку в user_services_table_20
    - Для пакетов встреч (название содержит 'встреч'): извлекает число из названия и
      добавляет к meetings_as_currency в последней записи user_extra_info_table_3
    - Для 'Роль организатора': проверяет что пользователь не организатор,
      обновляет user_table_1.is_organizer = true
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                # Получаем информацию об услуге
                cur.execute("""
                    SELECT service_name
                    FROM services_table_19
                    WHERE service_id = %s
                """, (service_id,))
                service = cur.fetchone()
                
                if not service:
                    return (False, "Услуга не найдена", "SERVICES_buy_service")
                
                service_name = service["service_name"]
                buy_type = "other"
                
                # Логика для пакетов встреч
                if "встреч" in service_name.lower():
                    match = re.search(r'\d+', service_name)
                    if match:
                        meetings_count = int(match.group())
                        
                        # Обновляем meetings_as_currency в последней записи пользователя
                        cur.execute("""
                            UPDATE user_extra_info_table_3
                            SET meetings_as_currency = meetings_as_currency + %s
                            WHERE record_id = (
                                SELECT record_id
                                FROM user_extra_info_table_3
                                WHERE user_id = %s
                                ORDER BY date_of_stats DESC, record_id DESC
                                LIMIT 1
                            )
                        """, (meetings_count, user_id))
                        
                        buy_type = "currency"
                    else:
                        return (False, "Не удалось определить количество встреч в названии услуги", "SERVICES_buy_service")
                
                # Логика для роли организатора
                elif service_name == "Роль организатора":
                    # Проверяем, что пользователь ещё не организатор
                    cur.execute("""
                        SELECT is_organizer
                        FROM user_table_1
                        WHERE user_id = %s
                    """, (user_id,))
                    user = cur.fetchone()
                    
                    if not user:
                        return (False, "Пользователь не найден", "SERVICES_buy_service")
                    
                    if user["is_organizer"]:
                        return (False, "Вы уже являетесь организатором", "SERVICES_buy_service")
                    
                    # Обновляем роль
                    cur.execute("""
                        UPDATE user_table_1
                        SET is_organizer = true
                        WHERE user_id = %s
                    """, (user_id,))
                    
                    buy_type = "role"
                
                # Записываем покупку в user_services_table_20
                cur.execute("""
                    INSERT INTO user_services_table_20 (service_id, user_id, count_services)
                    VALUES (%s, %s, 1)
                """, (service_id, user_id))
                
                conn.commit()
                
                return {
                    "success": True,
                    "service_name": service_name,
                    "buy_type": buy_type,
                    "message": "Покупка успешно завершена"
                }
    except psycopg.errors.RaiseException as e:
        return (False, str(e), "SERVICES_buy_service")
    except Exception as error:
        return (False, error, "SERVICES_buy_service")


#------------------------------------------------------------------------------------------------------
# roots to Support
#------------------------------------------------------------------------------------------------------

def SUPPORT_create_ticket(requester_user_id: int, category: int, message_text: str):
    """
    Создает новое обращение в поддержку в таблице support_table_17.
    Возвращает ticket_id созданного обращения.
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                INSERT INTO support_table_17 (
                    requester_user_id,
                    closed_by_admin_user_id,
                    category,
                    message_text,
                    status
                ) VALUES (
                    %s, NULL, %s, %s, 'created'
                )
                RETURNING ticket_id;
                """, (requester_user_id, category, message_text))
                conn.commit()
                result = cur.fetchone()
                return result['ticket_id'] if result else None
    except Exception as error:
        return (False, error, "SUPPORT_create_ticket")


def SUPPORT_add_photo(ticket_id: int, photo_url: str):
    """
    Создает запись о фото обращения в поддержку в таблице support_photos_table_22.
    Возвращает photo_id созданной записи.
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                INSERT INTO support_photos_table_22 (
                    ticket_id,
                    photo_url
                ) VALUES (
                    %s, %s
                )
                RETURNING photo_id;
                """, (ticket_id, photo_url))
                conn.commit()
                result = cur.fetchone()
                return result['photo_id'] if result else None
    except Exception as error:
        return (False, error, "SUPPORT_add_photo")


def SUPPORT_accept_ticket(ticket_id: int, admin_user_id: int):
    """
    Принимает обращение в поддержку администратором.
    Устанавливает status='in_progress' и closed_by_admin_user_id.
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE support_table_17
                    SET status = 'in_progress',
                        closed_by_admin_user_id = %s
                    WHERE ticket_id = %s
                      AND status = 'created'
                      AND closed_by_admin_user_id IS NULL
                    RETURNING ticket_id;
                """, (admin_user_id, ticket_id))
                result = cur.fetchone()
                conn.commit()
                if not result:
                    return (False, "Ticket not found or already assigned", "SUPPORT_accept_ticket")
                return {"success": True, "ticket_id": result['ticket_id']}
    except Exception as error:
        return (False, error, "SUPPORT_accept_ticket")


def SUPPORT_reject_ticket(ticket_id: int):
    """
    Отказаться от обращения в поддержку.
    Сбрасывает status='created' и closed_by_admin_user_id=NULL.
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE support_table_17
                    SET status = 'created',
                        closed_by_admin_user_id = NULL
                    WHERE ticket_id = %s
                      AND status = 'in_progress'
                    RETURNING ticket_id;
                """, (ticket_id,))
                result = cur.fetchone()
                conn.commit()
                if not result:
                    return (False, "Ticket not found or not in progress", "SUPPORT_reject_ticket")
                return {"success": True, "ticket_id": result['ticket_id']}
    except Exception as error:
        return (False, error, "SUPPORT_reject_ticket")


def SUPPORT_resolve_ticket(ticket_id: int, admin_user_id: int):
    """
    Завершить обращение в поддержку.
    Устанавливает status='resolved'.
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE support_table_17
                    SET status = 'resolved'
                    WHERE ticket_id = %s
                      AND status = 'in_progress'
                      AND closed_by_admin_user_id = %s
                    RETURNING ticket_id;
                """, (ticket_id, admin_user_id))
                result = cur.fetchone()
                conn.commit()
                if not result:
                    return (False, "Ticket not found or not assigned to you", "SUPPORT_resolve_ticket")
                return {"success": True, "ticket_id": result['ticket_id']}
    except Exception as error:
        return (False, error, "SUPPORT_resolve_ticket")


def SUPPORT_create_notification(ticket_id: int, requester_user_id: int, photo_urls: list[str]):
    """
    Создает уведомление об обращении в поддержку.
    - Получает данные тикета и категории
    - Формирует текст уведомления
    - Создает запись в notifications_table_4
    - Отправляет уведомление пользователю в user_notifications_table_5
    """
    # Защита: если передали строку вместо списка, обернём в список
    if isinstance(photo_urls, str):
        photo_urls = [photo_urls]
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                # Получаем данные тикета + название категории
                cur.execute("""
                    SELECT 
                        to_char(s.created_at, 'DD.MM.YYYY HH24:MI') AS created_at_formatted,
                        c.text_category,
                        s.message_text
                    FROM support_table_17 s
                    JOIN categories_to_support_table_23 c 
                        ON c.category_to_support_id = s.category
                    WHERE s.ticket_id = %s
                """, (ticket_id,))
                ticket = cur.fetchone()
                
                if not ticket:
                    return (False, "Ticket not found", "SUPPORT_create_notification")
                
                created_at = ticket['created_at_formatted']
                category_name = ticket['text_category']
                message_text = ticket['message_text']
                
                # Формируем текст уведомления (без финальной строки — она добавляется на фронтене)
                notification_text = (
                    f"Вы отправили заявку в поддержку. Дата: {created_at}. "
                    f"Категория обращения: {category_name}.\n"
                    f"Содержимое обращения:\n"
                    f"{message_text}"
                )
                
                # Создаем уведомление в notifications_table_4
                cur.execute("""
                    INSERT INTO notifications_table_4 (meeting_id, notification_type, notification_text)
                    VALUES (NULL, 'обращение в ЦПП', %s)
                    RETURNING notification_id;
                """, (notification_text,))
                result = cur.fetchone()
                notification_id = result['notification_id']
                
                # Сохраняем фото в notification_photos_table_6 (для отображения миниатюр в уведомлениях)
                for url in photo_urls:
                    cur.execute("""
                        INSERT INTO notification_photos_table_6 (notification_id, photo_url)
                        VALUES (%s, %s);
                    """, (notification_id, url))
                
                # Отправляем уведомление пользователю
                cur.execute("""
                    INSERT INTO user_notifications_table_5 (notification_id, user_id, status)
                    VALUES (%s, %s, 'unread')
                    RETURNING record_id;
                """, (notification_id, requester_user_id))
                
                conn.commit()
                return {
                    "success": True,
                    "notification_id": notification_id
                }
    except Exception as error:
        return (False, error, "SUPPORT_create_notification")
