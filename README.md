# VSTRECHI.RU — платформа для безопасных офлайн-встреч

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![MinIO](https://img.shields.io/badge/MinIO-C72E49?logo=minio&logoColor=white)](https://min.io/)

> Веб-приложение для организации и управления тематическими офлайн-встречами с акцентом на безопасность участников через биометрическую верификацию личности, рейтинговую систему и механизм разрешения спорных ситуаций.

---

## 📋 Содержание

- [Описание проекта](#описание-проекта)
- [Ключевые особенности](#ключевые-особенности)
- [Технологический стек](#технологический-стек)
- [Быстрый старт](#быстрый-старт)
- [Архитектура](#архитектура)
- [API](#api)
- [База данных](#база-данных)
- [Триггеры PostgreSQL](#триггеры-postgresql)
- [Система верификации](#система-верификации)
- [Структура проекта](#структура-проекта)
- [Тестовые данные](#тестовые-данные)
- [Автор](#автор)

---

## 🎯 Описание проекта

**VSTRECHI.RU** — это клиент-серверная платформа, которая помогает людям находить единомышленников и организовывать безопасные офлайн-встречи по интересам. Проект решает проблему недоверия при знакомстве с незнакомцами в реальной жизни за счёт:

- 🔐 **верификации личности** по двум фотографиям с помощью нейросетей;
- ⭐ **рейтинговой системы** гостей и организаторов;
- ⚖️ **системы голосования и апелляций** при спорных ситуациях на встречах;
- 💰 **внутренней валюты**, которая мотивирует ответственное поведение.

---

## ✨ Ключевые особенности

### Для пользователей
- Регистрация в 3 шага: личные данные, район, категории интересов.
- Просмотр каталога встреч с фильтрами по району, категориям, количеству участников.
- Запись на встречи с проверкой баланса внутренней валюты.
- Внутренние уведомления о записи, отмене, завершении встречи и конфликтах.
- Оценка встреч и других участников после мероприятия.
- Личный профиль с фото, статистикой и историей встреч.
- Магазин услуг: покупка пакетов встреч или роли организатора.
- Обращение в службу поддержки с прикреплением фото.

### Для организаторов
- Создание встреч с загрузкой фото места проведения.
- Указание категорий, предупреждений и ограничений (18+, тишина и т.д.).
- Отметка присутствовавших участников и выставление им оценок.
- Завершение встречи и автоматический пересчёт рейтингов.

### Для администраторов
- Панель поддержки с умным polling новых заявок.
- Просмотр деталей тикета с фото и email заявителя.
- Приём, отклонение и завершение обращений.

---

## 🛠 Технологический стек

### Backend
| Технология | Версия | Назначение |
|---|---|---|
| [FastAPI](https://fastapi.tiangolo.com/) | 0.128.0 | Веб-фреймворк |
| [Python](https://www.python.org/) | 3.12+ | Язык разработки |
| [Pydantic](https://docs.pydantic.dev/) | 2.12.5 | Валидация данных |
| [psycopg](https://www.psycopg.org/) | 3.3.2 | Драйвер PostgreSQL |
| [python-jose](https://python-jose.readthedocs.io/) | — | JWT-токены |
| [Uvicorn](https://www.uvicorn.org/) | 0.40.0 | ASGI-сервер |
| [DeepFace](https://github.com/serengil/deepface) + ArcFace | 0.0.93 | Верификация лиц |
| [OpenCV](https://opencv.org/) / MTCNN / YuNet | — | Детекция лиц |
| [boto3](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html) | 1.34.0 | Работа с MinIO (S3 API) |
| [email-validator](https://github.com/JoshData/python-email-validator) | 2.3.0 | Проверка email-доменов |

### Frontend
| Технология | Версия | Назначение |
|---|---|---|
| [React](https://react.dev/) | 19.2.0 | UI-фреймворк |
| [TypeScript](https://www.typescriptlang.org/) | 5.9.3 | Типизация |
| [Vite](https://vitejs.dev/) | 7.3.1 | Сборка и dev-сервер |
| [React Router DOM](https://reactrouter.com/) | 7.13.1 | Маршрутизация |
| [Redux Toolkit](https://redux-toolkit.js.org/) | 2.11.2 | Глобальное состояние |
| [React Icons](https://react-icons.github.io/react-icons/) | 5.6.0 | Иконки |
| [ESLint](https://eslint.org/) | 9.39.1 | Линтинг |

### Инфраструктура
| Технология | Назначение |
|---|---|
| [PostgreSQL](https://www.postgresql.org/) | Основная база данных |
| [MinIO](https://min.io/) | S3-совместимое хранилище фото |
| [Docker Compose](https://docs.docker.com/compose/) | Развёртывание MinIO |

---

## 🚀 Быстрый старт

### 1. Клонирование репозитория

```bash
git clone https://github.com/username/vstrechi.git
cd vstrechi
```

### 2. Подготовка базы данных

Убедитесь, что установлен PostgreSQL 14+, и выполните SQL-скрипты из директории `DB/`:

```bash
psql -U postgres -d vstrechi -f DB/creation_bd_v4.sql
psql -U postgres -d vstrechi -f DB/triggers_bd_v4.sql
psql -U postgres -d vstrechi -f DB/inserting_bd_v4.sql
```

> Расширение `pgcrypto` должно быть установлено для хеширования паролей.

### 3. Запуск MinIO

```bash
cd backend
docker-compose up -d
```

- API MinIO: `http://localhost:9000`
- Консоль MinIO: `http://localhost:9001`
- Логин: `minioadmin`
- Пароль: `minioadmin123`

### 4. Запуск backend

```bash
cd backend
python -m venv ../mvp_env
source ../mvp_env/bin/activate  # Windows: ..\mvp_env\Scripts\activate
pip install -r ../requirements.txt
fastapi dev main.py
```

Backend будет доступен на `http://localhost:8000`.

### 5. Запуск frontend

```bash
cd vstrechiv1
npm install
npm run dev
```

Frontend откроется на `http://localhost:5173`.

### 6. Запуск воркера верификации (опционально)

```bash
cd backend
python verification_worker.py
```

---

## 🏗 Архитектура

```
┌─────────────────┐      HTTP / REST      ┌──────────────────┐
│   React (Vite)  │ ◄────────────────────► │   FastAPI (Python)│
│  localhost:5173 │   JWT в httpOnly cookie │   localhost:8000  │
└─────────────────┘                        └────────┬─────────┘
                                                    │
                          ┌─────────────────────────┼─────────────────────────┐
                          │                         │                         │
                          ▼                         ▼                         ▼
                   ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
                   │  PostgreSQL │          │    MinIO    │          │  DeepFace   │
                   │   (данные)  │          │   (фото)    │          │  (верификация)│
                   └─────────────┘          └─────────────┘          └─────────────┘
```

### Модули backend

| Файл | Назначение |
|---|---|
| `main.py` | Точка входа FastAPI, все endpoint'ы, CORS, JWT-зависимости |
| `models.py` | Pydantic-модели для валидации запросов/ответов |
| `get_sql.py` | SQL-запросы `SELECT` |
| `post_sql.py` | SQL-запросы `INSERT`/`UPDATE`, бизнес-логика |
| `important_info.py` | Конфигурация: DSN PostgreSQL, `SECRET_KEY`, алгоритм JWT |
| `minio_defs.py` | Интеграция с MinIO: загрузка фото профиля, встреч, поддержки, верификации |
| `verification_worker.py` | Фоновый процесс проверки фотографий через DeepFace/ArcFace |

---

## 🔌 API

Backend предоставляет **66 REST endpoint'ов**, сгруппированных по доменам:

### Аутентификация
| Метод | Endpoint | Описание |
|---|---|---|
| POST | `/register` | Регистрация пользователя |
| POST | `/login` | Вход по email и паролю |
| GET | `/me` | Данные текущего пользователя |
| POST | `/logout` | Выход |

### Пользователи
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `/users/{user_id}/stats` | Полная статистика пользователя |
| GET | `/users/{user_id}/reged_meetings` | ID активных записей на встречи |
| GET | `/users/{user_id}/info_reged_meetings` | Информация о предстоящих встречах |
| GET | `/users/{user_id}/info_atted_meetings` | История посещённых встреч |
| GET | `/users/{user_id}/settings` | Данные для страницы настроек |
| PUT | `/users/{user_id}/settings` | Обновление данных профиля |
| POST | `/users/{user_id}/photo` | Загрузка фото профиля |

### Встречи
| Метод | Endpoint | Описание |
|---|---|---|
| POST | `/meetings` | Список активных встреч |
| POST | `/meetings/sort` | Фильтрация и сортировка |
| POST | `/meetings/create` | Создание встречи |
| GET | `/meetings/{meeting_id}` | Детальная информация о встрече |
| POST | `/meetings/{meeting_id}/reg/{user_id}` | Запись на встречу / отмена |
| PUT | `/meetings/{meeting_id}/cancel` | Отмена встречи организатором |
| PUT | `/meetings/{meeting_id}/finish` | Завершение встречи |
| POST | `/meetings/save-ratings` | Оценка участников организатором |
| POST | `/meetings/save-user-ratings` | Оценка встречи и участников |

### Уведомления
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `/users/{user_id}/notifications` | Уведомления пользователя |
| PUT | `/notifications/{record_id}/read` | Отметить как прочитанное |
| PUT | `/notifications/{record_id}/conflict-respond` | Ответ на конфликт |

### Поддержка (админ)
| Метод | Endpoint | Описание |
|---|---|---|
| GET | `/support/categories` | Категории обращений |
| POST | `/support` | Создать обращение |
| GET | `/support/tickets/new` | Новые тикеты |
| GET | `/support/tickets/in-progress` | Тикеты в работе |
| GET | `/support/tickets/{ticket_id}` | Детали тикета |
| PUT | `/support/tickets/{ticket_id}/accept` | Принять в работу |
| PUT | `/support/tickets/{ticket_id}/resolve` | Завершить |

### Статистика и справочники
| Метод | Endpoint | Описание |
|---|---|---|
| POST | `/stats_data` | Рейтинг с фильтрами |
| GET | `/stats/guests/overall` | Общий рейтинг гостей |
| GET | `/stats/organizers/intermediate` | Промежуточный рейтинг организаторов |
| GET | `/faq` | FAQ |
| GET | `/categories` | Категории встреч |
| GET | `/warnings` | Предупреждения |
| GET | `/districts` | Районы Москвы |
| GET | `/check-email` | Проверка email-домена |

---

## 🗄 База данных

Проект использует **PostgreSQL** с расширением `pgcrypto`.

### Общая сводка

| Параметр | Значение |
|---|---|
| Таблиц | **23** |
| Триггеров | **18** |
| Внешних ключей | 30+ |
| Индексов | 40+ |

### Основные сущности

| Таблица | Назначение |
|---|---|
| `user_table_1` | Пользователи: ФИО, email, хеш пароля, роли, район, статус блокировки |
| `meeting_table_2` | Встречи: название, описание, адрес, время, статус, рейтинг |
| `user_extra_info_table_3` | Расширенная статистика: рейтинги гостя/организатора, валюта |
| `meeting_rating_table_8` | Регистрации и участие: `registered` / `attended` / `missed` / `missedbyorg` |
| `categories_table_10` | Категории встреч |
| `meeting_categories_table_11` | Связь встреч и категорий |
| `user_categories_table_12` | Предпочтения пользователей |
| `warnings_table_13` | Предупреждения для встреч |
| `meeting_warnings_table_21` | Связь встреч и предупреждений |
| `user_ratings_table_15` | Оценки пользователей друг другу |
| `meeting_rating_info_table_26` | Оценки встреч пользователями |
| `verification_table_16` | Верификация личности |
| `conflict_table_7` | Спорные ситуации и голосование |
| `support_table_17` | Обращения в поддержку |
| `notifications_table_4` | Уведомления |
| `user_notifications_table_5` | Связь пользователей и уведомлений |
| `services_table_19` / `user_services_table_20` | Платные услуги и покупки |

### Жизненный цикл встречи

```
created → in_progress → finished
   ↓
canceled
```

### Внутренняя валюта

- `meetings_as_currency` — баланс пользователя для участия во встречах.
- `earned_currency` — заработанная валюта организатора (75% от числа участников за завершённую встречу).
- При регистрации проверяется: `active_records + 1 <= meetings_as_currency`.
- При завершении встречи списывается 1 единица валюты у каждого участника.

---

## ⚡ Триггеры PostgreSQL

Все ключевые бизнес-процессы автоматизированы на уровне базы данных. Ниже перечислены 18 триггеров:

| № | Триггер | Таблица | Описание |
|---|---------|---------|----------|
| 1 | `trg_set_actual_end_at` | `meeting_table_2` | При смене статуса на `finished` фиксирует `actual_end_at = NOW()` |
| 2 | `trg_inc_meetings_visited_as_guest` | `meeting_table_2` | Увеличивает счётчик посещённых встреч у участников со статусом `attended` |
| 3 | `trg_inc_meetings_created` | `meeting_table_2` | Увеличивает счётчик созданных встреч у организатора и начисляет `earned_currency` |
| 4 | `trg_update_meeting_rating_after_insert` | `meeting_rating_info_table_26` | Пересчитывает рейтинг встречи после новой оценки |
| 5 | `trg_update_guest_ratings_after_insert` | `user_ratings_table_15` | Пересчитывает рейтинг гостя и промежуточный рейтинг |
| 6 | `trg_copy_user_stats_on_new_trial` | `start_end_trial_period_table_25` | При создании нового trial-периода копирует статистику пользователей с обнулением периодных полей |
| 7 | `trg_update_organizer_ratings_after_meeting` | `meeting_table_2` | Пересчитывает рейтинг организатора при изменении рейтинга его встречи |
| 8 | `trg_meeting_finished_debit_currency` | `meeting_table_2` | Списывает 1 единицу валюты у участников при завершении встречи |
| 9 | `trg_check_max_people` | `meeting_rating_table_8` | Проверяет лимит участников перед регистрацией |
| 10 | `trg_create_notification_on_registration` | `meeting_rating_table_8` | Создаёт уведомление при записи на встречу |
| 11 | `trg_create_notification_on_cancel` | `meeting_rating_table_8` | Создаёт уведомление при отмене записи |
| 12 | `trg_create_notification_on_meeting_canceled` | `meeting_table_2` | Уведомляет организатора и участников об отмене встречи |
| 13 | `trg_create_notification_on_meeting_finished` | `meeting_table_2` | При старте встречи просит организатора отметить участников |
| 14 | `trg_update_conflict_status_on_vote` | `conflict_table_7` | Автоматически разрешает конфликт при достижении порога 50% голосов |
| 15 | `trg_update_user_action_on_conflict_yes` | `conflict_table_7` | При победе в голосовании меняет `missedbyorg` → `attended` |
| 16 | `trg_update_user_action_on_conflict_no` | `conflict_table_7` | При проигрыше меняет `missedbyorg` → `missed` |
| 17 | `trg_notify_on_conflict_resolution` | `meeting_rating_table_8` | Отправляет уведомление о результате голосования |
| 18 | `trg_create_verification_notification` | `user_table_1` | При регистрации напоминает о необходимости верификации |

---

## 🔍 Система верификации

Для записи на встречи пользователь должен пройти верификацию личности. Процесс выполняется фоновым воркером `verification_worker.py`:

1. Пользователь загружает 2 фото: анфас и профиль.
2. Воркер скачивает фото из MinIO.
3. **Детекция лиц**: каскад из YuNet → MTCNN → OpenCV. На каждом фото должно быть ровно одно лицо.
4. **Сравнение лиц**: модель **ArcFace** извлекает 512-мерные эмбеддинги. Если косинусное расстояние между ними меньше порога — лица признаются принадлежащими одному человеку.
5. **Проверка на дубликаты**: новый эмбеддинг сравнивается с уже одобренными. При расстоянии < 0.40 верификация отклоняется.
6. Результат сохраняется в `verification_table_16`, пользователь получает уведомление.

### Пороги

| Параметр | Значение |
|---|---|
| Модель | `ArcFace` |
| Порог идентичности на фото | косинусное расстояние < 0.75 |
| Порог дубликата | косинусное расстояние < 0.40 |
| Детекторы | YuNet → MTCNN → OpenCV |

---

## 📁 Структура проекта

```
mvp_vstrechi/
├── backend/                     # FastAPI backend
│   ├── main.py                  # Точка входа и роуты
│   ├── models.py                # Pydantic-модели
│   ├── get_sql.py               # SELECT-запросы
│   ├── post_sql.py              # INSERT/UPDATE-запросы
│   ├── important_info.py        # Конфигурация и JWT
│   ├── minio_defs.py            # Интеграция с MinIO
│   ├── verification_worker.py   # Воркер верификации
│   └── docker-compose.yaml      # MinIO в Docker
├── vstrechiv1/                  # React + TypeScript frontend
│   ├── src/
│   │   ├── pages/               # Страницы приложения
│   │   ├── components/          # Переиспользуемые компоненты
│   │   ├── slices/              # Redux-слайсы
│   │   ├── assets/              # Статические ресурсы
│   │   └── types/               # TypeScript-типы
│   ├── package.json
│   └── README.md
├── DB/                          # SQL-скрипты
│   ├── creation_bd_v4.sql       # Создание таблиц
│   ├── triggers_bd_v4.sql       # Триггеры
│   ├── inserting_bd_v4.sql      # Тестовые данные
│   └── insert_10_new_meetings.sql
├── requirements.txt             # Python-зависимости
├── AGENTS.md                    # Документация для AI-агентов
└── README.md                    # Этот файл
```

---

## 🧪 Тестовые данные

После применения `inserting_bd_v4.sql` в системе доступны:

- **15 пользователей** с email `user01@example.com` – `user15@example.com` и паролями `Pass!User001` – `Pass!User015`.
- **Роли**: обычные пользователи, организаторы, администраторы, заблокированный пользователь.
- **15 категорий** встреч: спорт, кино, музыка, настольные игры, технологии и др.
- **16 предупреждений** для встреч.
- **6+ встреч** в разных статусах.
- **10 FAQ** и категории поддержки.
- Начальный баланс внутренней валюты: **5 единиц** у каждого пользователя.

---