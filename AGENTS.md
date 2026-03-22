# AGENTS.md — Документация для AI-агентов

## Общая информация о проекте

**Название проекта:** Vstrechi (Встречи)  
**Тип:** MVP веб-приложения для организации и управления встречами/мероприятиями  
**Архитектура:** Клиент-серверное приложение с разделением на Frontend и Backend

---

## Структура проекта

```
mvp_vstrechi/
├── backend/              # Python FastAPI backend
│   ├── main.py           # Главный файл приложения FastAPI
│   ├── models.py         # Pydantic модели данных
│   ├── get_sql.py        # SQL-запросы для чтения данных
│   ├── post_sql.py       # SQL-запросы для записи данных
│   ├── important_info.py # Конфигурация (ключи, алгоритмы)
│   ├── minio_defs.py     # Интеграция с MinIO (S3-совместимое хранилище)
│   └── docker-compose.yaml # Docker Compose для MinIO
├── vstrechiv1/           # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/   # React-компоненты
│   │   ├── pages/        # Страницы приложения
│   │   ├── slices/       # Redux slices (authSlice, store)
│   │   └── assets/       # Статические ресурсы
│   └── package.json
├── requirements.txt      # Python-зависимости
└── AGENTS.md            # Этот файл
```

---

## Технологический стек

### Backend
- **Framework:** FastAPI 0.128.0
- **Язык:** Python 3.12+
- **База данных:** PostgreSQL (через psycopg 3.3.2)
- **Аутентификация:** JWT-токены (python-jose)
- **Хранилище файлов:** MinIO (S3-совместимое)
- **Сервер:** Uvicorn 0.40.0
- **Валидация:** Pydantic 2.12.5

### Frontend
- **Framework:** React 19.2.0
- **Язык:** TypeScript 5.9.3
- **Сборщик:** Vite 7.3.1
- **Состояние:** Redux Toolkit 2.11.2
- **Маршрутизация:** React Router DOM 7.13.1
- **UI-иконки:** React Icons 5.6.0
- **Линтер:** ESLint 9.39.1

---

## Запуск проекта

### Backend

```bash
cd backend

# Установка зависимостей (из корня проекта)
pip install -r ../requirements.txt

# Запуск в режиме разработки
fastapi dev main.py
# или
uvicorn main:app --reload

# Сервер будет доступен на http://localhost:8000
```

### Frontend

```bash
cd vstrechiv1

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Приложение будет доступно на http://localhost:5173
```

### MinIO (S3 хранилище)

```bash
cd backend
docker-compose up -d

# Консоль MinIO доступна на http://localhost:9001
# Порт API: 9000
# Логин/пароль: minioadmin / minioadmin123
```

---

## Архитектура Backend

### Основные модули

| Файл | Назначение |
|------|------------|
| `main.py` | Точка входа, определение роутов FastAPI |
| `models.py` | Pydantic-модели для валидации запросов/ответов |
| `get_sql.py` | SQL-запросы SELECT (чтение из БД) |
| `post_sql.py` | SQL-запросы INSERT/UPDATE (запись в БД) |
| `important_info.py` | Конфигурация JWT (SECRET_KEY, ALGORITHM) |
| `minio_defs.py` | Работа с MinIO для загрузки файлов |

### Аутентификация

- Используется JWT-токены с хранением в httpOnly cookie
- Токен действителен 7 дней
- Защищённые роуты используют `Depends(get_current_user)`
- CORS настроен для `http://localhost:5173`

### API Endpoints

#### FAQ
- `GET /faq` — получить список FAQ

#### Встречи (Meetings)
- `POST /meetings` — список встреч по району
- `POST /meetings/sort` — сортировка и фильтрация встреч
- `GET /meetings/categories` — список категорий
- `GET /meetings/{meeting_id}` — информация о встрече
- `GET /meetings/{meeting_id}/reged_info` — инфо для зарегистрированных
- `GET /meetings/{meeting_id}/atted_info` — инфо для прошедших
- `POST /meetings/{meeting_id}/reg/{user_id}` — регистрация на встречу
- `PUT /meetings/{meeting_id}/canceledby/{user_id}` — отмена участия
- `GET /meetings/{meeting_id}/reged_users` — список зарегистрированных
- `GET /meetings/{meeting_id}/atted_users` — список участников

#### Пользователи (Users)
- `POST /login` — вход в систему
- `GET /me` — информация о текущем пользователе
- `POST /logout` — выход из системы
- `GET /users/{user_id}/reged_meetings` — ID зарегистрированных встреч
- `GET /users/{user_id}/stats` — статистика пользователя
- `GET /users/{user_id}/info_reged_meetings` — инфо о предстоящих встречах
- `GET /users/{user_id}/info_atted_meetings` — инфо о прошедших встречах

---

## Архитектура Frontend

### Структура

```
src/
├── components/          # Переиспользуемые компоненты
│   ├── NavBar.tsx       # Навигационная панель
│   ├── FilterPanel.tsx  # Панель фильтров
│   ├── MeetingAsItem.tsx # Карточка встречи
│   ├── MeetingExpandedInfo.tsx # Расширенная информация
│   ├── ProfileCard.tsx  # Карточка профиля
│   └── ...
├── pages/               # Страницы приложения
│   ├── HomePage.tsx     # Главная страница
│   ├── MeetingsPage.tsx # Страница списка встреч
│   ├── ProfilePage.tsx  # Страница профиля
│   ├── OneMeetingPage.tsx # Страница встречи
│   ├── FaqPage.tsx      # Страница FAQ
│   ├── AboutPage.tsx    # О проекте
│   └── LoginModal.tsx   # Модальное окно входа
├── slices/              # Redux state management
│   ├── authSlice.ts     # Управление аутентификацией
│   └── store.ts         # Конфигурация Redux store
└── assets/              # Статические файлы
```

### Маршруты (React Router)

| Путь | Страница |
|------|----------|
| `/` | HomePage (главная) |
| `/about` | AboutPage (о проекте) |
| `/faq` | FaqPage (частые вопросы) |
| `/meetings` | MeetingsPage (список встреч) |
| `/user/:user_id` | ProfilePage (профиль пользователя) |
| `/meetings/info_reged/:meeting_id` | OneMeetingPage (детали встречи) |
| `/meetings/info_history/:meeting_id` | OneMeetingPageHistory (история) |

### State Management (Redux)

- **authSlice**: управление состоянием аутентификации
  - `setUser` — установка данных пользователя
  - `clearUser` — очистка данных (выход)
  - Проверка сессии при загрузке приложения через `/me`

---

## Модели данных

### Пользователь (User)
```typescript
{
  user_id: number
  first_name: string
  last_name: string
  district: string
  is_blocked: boolean
  is_organizer: boolean
  is_admin: boolean
  is_registration_completed: boolean
  meetings_as_currency: number
}
```

### Встреча (Meeting)
```typescript
{
  meeting_id: number
  meeting_title: string
  registered_users_count: number
  max_people_allowed: number
  district: string
  adults_only_18plus: boolean
  category_ids: number[]
  start_at: datetime
  end_at: datetime
}
```

### FAQ
```typescript
{
  question_id: number
  question_text: string
  question_answer: string
}
```

---

## Стиль кода и соглашения

### Python (Backend)
- PEP 8
- Именование функций БД: `{TABLE}_{action}_{details}` (например, `USERS_get_info_by_id`)
- Возврат ошибок из SQL-функций в виде кортежа `(False, error_message)`
- Pydantic-модели для всех входных/выходных данных

### TypeScript (Frontend)
- Functional components с хуками
- CSS-модули (отдельные `.css` файлы для компонентов)
- Redux Toolkit для глобального состояния
- `credentials: 'include'` для всех fetch-запросов к API

---

## Безопасность

- JWT-токены в httpOnly cookies
- CORS настроен только для `localhost:5173`
- Пароли хранятся в БД (предполагается хеширование)
- Проверка авторизации через `get_current_user`

---

## База данных

### Общая информация

- **СУБД:** PostgreSQL
- **Файлы схемы:** `DB/creation_bd_v4.sql`, `DB/inserting_bd_v4.sql`, `DB/triggers_bd_v4.sql`
- **Расширение:** `pgcrypto` (для хеширования паролей)

### Структура (25 таблиц)

#### Основные таблицы

| Таблица | Назначение | Ключевые поля |
|---------|------------|---------------|
| **user_table_1** | Пользователи | `user_id`, `email`, `password_hash`, `is_organizer`, `is_admin`, `is_blocked`, `district`, `city`, `birth_date`, `gender` |
| **meeting_table_2** | Встречи/мероприятия | `meeting_id`, `creator_user_id`, `title`, `description`, `max_people`, `address`, `city`, `district`, `adults_only`, `status` (created/in_progress/finished/canceled), `start_at`, `end_at`, `actual_end_at`, `rating_after_end`, `count_of_ratings` |
| **meeting_rating_table_8** | Регистрации на встречи | `meeting_id`, `user_id`, `user_action` (registered/attended/missed), `registered_at` |
| **categories_table_10** | Категории встреч | `category_id`, `category_name`, `photo_url` |
| **warnings_table_13** | Предупреждения для встреч | `warning_id`, `warning_name` |

#### Статистика и рейтинги

| Таблица | Назначение |
|---------|------------|
| **user_extra_info_table_3** | Расширенная статистика: посещённые встречи, рейтинг гостя/организатора, валюта (`meetings_as_currency`, `earned_currency`). Создаётся новая запись при каждом новом trial-периоде |
| **user_ratings_table_15** | Оценки пользователей друг другу (1-10) — `rated_user_id`, `rater_user_id`, `rating_value`, `meeting_id` |
| **meeting_rating_info_table_26** | Оценки встреч пользователями — `meeting_id`, `user_id`, `meeting_rating` |
| **start_end_trial_period_table_25** | Периоды для подсчёта промежуточной статистики — `start_trial_period`, `end_trial_period` |

#### Связующие таблицы (Many-to-Many)

| Таблица | Связь |
|---------|-------|
| **meeting_categories_table_11** | Встреча ↔ Категории (`meeting_id`, `category_id`, `category_value`) |
| **meeting_warnings_table_21** | Встреча ↔ Предупреждения (`meeting_id`, `warning_id`) |
| **user_categories_table_12** | Пользователь ↔ Предпочтения категорий (`user_id`, `category_id`, `category_value`) |

#### Уведомления и поддержка

| Таблица | Назначение |
|---------|------------|
| **notifications_table_4** | Уведомления (`notification_type`: встреча/правила/новости/верификация, `notification_text`) |
| **user_notifications_table_5** | Связь пользователь-уведомление (`notification_id`, `user_id`, `status`: read/unread) |
| **notification_photos_table_6** | Фото для уведомлений |
| **support_table_17** | Тикеты поддержки (`requester_user_id`, `closed_by_admin_user_id`, `category`, `message_text`, `status`) |
| **support_photos_table_22** | Фото для тикетов |
| **categories_to_support_table_23** | Категории обращений в поддержку |

#### Дополнительные таблицы

| Таблица | Назначение |
|---------|------------|
| **conflict_table_7** | Споры/конфликты на встречах с голосованием (`total_allowed_to_vote`, `total_voted`, `voted_for_count`, `status`) |
| **conflict_photos_table_9** | Доказательства для споров (фото) |
| **user_photos_table_14** | Фото профиля пользователей |
| **verification_table_16** | Верификация пользователей (`photo_1_url`, `photo_2_url`, `status`: in_progress/rejected/approved) |
| **faq_table_18** | FAQ (`question_text`, `question_answer`) |
| **services_table_19** | Платные услуги (`service_name`, `service_description`, `service_price`) |
| **user_services_table_20** | Купленные услуги пользователями |

---

### Триггеры PostgreSQL (9 штук)

| Триггер | Таблица | Действие |
|---------|---------|----------|
| **trg_set_actual_end_at** | meeting_table_2 | При изменении `status` на `'finished'` устанавливает `actual_end_at = NOW()` |
| **trg_inc_meetings_visited_as_guest** | meeting_table_2 | При завершении встречи увеличивает счётчик посещённых встреч у гостей со статусом `attended` |
| **trg_inc_meetings_created** | meeting_table_2 | При завершении встречи увеличивает счётчик созданных встреч у организатора и начисляет `earned_currency = users_count × 0.75` |
| **trg_update_meeting_rating_after_insert** | meeting_rating_info_table_26 | Пересчитывает `rating_after_end` и `count_of_ratings` встречи при новой оценке |
| **trg_update_guest_ratings_after_insert** | user_ratings_table_15 | Пересчитывает рейтинг гостя (`rating_as_guest`, `intermediate_rating_as_guest`) при получении оценки |
| **trg_copy_user_stats_on_new_trial** | start_end_trial_period_table_25 | При создании нового периода сбрасывает периодную статистику (создаёт новые записи в user_extra_info_table_3) |
| **trg_update_organizer_ratings_after_meeting** | meeting_table_2 | Пересчитывает рейтинг организатора (`rating_as_organizer`) при изменении рейтинга встречи |
| **trg_meeting_finished_debit_currency** | meeting_table_2 | При завершении встречи списывает 1 `meetings_as_currency` у всех участников |
| **trg_check_max_people** | meeting_rating_table_8 | Перед регистрацией проверяет, не превышен ли лимит участников (`max_people`) |

---

### Тестовые данные

Скрипт `DB/inserting_bd_v4.sql` создаёт:

- **15 пользователей:**
  - user01@example.com – user15@example.com
  - Пароли: Pass!User001 – Pass!User015
  - Разные роли: обычные, организаторы, админы, заблокированный

- **6 встреч** с разными статусами: created, in_progress, canceled

- **15 категорий:** спорт, гонки, кино, музыка, настольные игры, видеоигры, путешествия, кулинария, фотография, книги, технологии, бизнес, языки, танцы, йога

- **16 предупреждений:** не курить, курение разрешено, без телефонов, телефоны на беззвучный, без фото и видео, фото разрешены, без мата, вход по регистрации, приходите заранее, сменная обувь, без животных, алкоголь запрещён/разрешён, маски обязательны, соблюдайте тишину, стоимость делим на всех

---

### Особенности работы с БД

1. **Пароли:** Хешируются через `crypt(password, gen_salt('bf', 12))`
2. **Trial-периоды:** При выходе за границы текущего периода автоматически создаётся новый (1 день) и сбрасывается периодная статистика
3. **Рейтинги:** Автоматически пересчитываются через триггеры при новых оценках
4. **Валюта:** `meetings_as_currency` — внутренняя валюта для участия в встречах, списывается при их завершении
5. **Статусы встреч:** `created` → `in_progress` → `finished`/`canceled`

---

## Разработка и отладка

### Backend
- Используйте `fastapi dev main.py` для hot-reload
- API документация доступна на `/docs` (Swagger UI)

### Frontend
- `npm run dev` — запуск dev-сервера
- `npm run lint` — проверка кода линтером
- `npm run build` — сборка для продакшена

---

## Полезные ссылки

- [FastAPI документация](https://fastapi.tiangolo.com/)
- [React документация](https://react.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Vite документация](https://vitejs.dev/)
