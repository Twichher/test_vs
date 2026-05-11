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
│   │   │   ├── NavBar.tsx
│   │   │   ├── NavbarLogin.tsx
│   │   │   ├── NavbarNoLogin.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   ├── MeetingAsItem.tsx
│   │   │   ├── MeetingExpandedInfo.tsx
│   │   │   ├── ProfileCard.tsx
│   │   │   ├── SupportModalWindow.tsx    # Модалка обращения в поддержку
│   │   │   ├── SupportOrderComponent.tsx  # Карточка заявки в админке
│   │   │   ├── MessageDetailSupportTicket.tsx  # Деталка уведомления ЦПП
│   │   │   └── ...
│   │   ├── pages/        # Страницы приложения
│   │   │   ├── HomePage.tsx
│   │   │   ├── MeetingsPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── FaqPage.tsx              # FAQ + модалка поддержки
│   │   │   ├── MessagesPage.tsx         # Уведомления пользователя
│   │   │   ├── SupportAdminPage.tsx     # Админ-панель заявок поддержки
│   │   │   ├── MoreOrderSupportPage.tsx # Детальная страница заявки (админ)
│   │   │   └── ...
│   │   ├── slices/       # Redux state management
│   │   │   ├── authSlice.ts
│   │   │   └── store.ts
│   │   └── assets/       # Статические ресурсы
│   └── package.json
├── DB/                   # SQL-скрипты базы данных
│   ├── creation_bd_v4.sql
│   ├── inserting_bd_v4.sql
│   └── triggers_bd_v4.sql
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
- Админ-роуты используют `Depends(get_current_admin_user)` — проверяет `is_admin` в БД
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
- `GET /users/{user_id}/notifications` — уведомления пользователя (с `photo_urls`)

#### Поддержка (Support) — публичные
- `GET /support/categories` — категории обращений в поддержку
- `POST /support` — создать обращение (требуется авторизация)
  - Принимает `category_id`, `message_text`, `photos[]` (base64)
  - Загружает фото в MinIO, сохраняет в `support_photos_table_22`
  - Создаёт уведомление `notification_type = 'обращение в ЦПП'`
  - Копирует фото в `notification_photos_table_6`

#### Админ-панель поддержки (Support Admin) — только `is_admin = true`
- `GET /support/tickets/new` — новые заявки (`status='created'`, `closed_by_admin_user_id IS NULL`)
- `GET /support/tickets/in-progress` — принятые заявки (`status='in_progress'`, назначены текущему админу)
- `GET /support/tickets/resolved` — завершённые заявки (`status='resolved'`, закрыты текущим админом)
- `GET /support/tickets/{ticket_id}` — детали заявки (включая `photo_urls` и `requester_email`)
- `PUT /support/tickets/{ticket_id}/accept` — принять заявку (`status='in_progress'`)
- `PUT /support/tickets/{ticket_id}/reject` — отказаться от заявки (`status='created'`, `closed_by_admin_user_id=NULL`)
- `PUT /support/tickets/{ticket_id}/resolve` — завершить заявку (`status='resolved'`)

---

## Архитектура Frontend

### Структура

```
src/
├── components/          # Переиспользуемые компоненты
│   ├── NavBar.tsx       # Навигационная панель (включая админ-кнопку)
│   ├── NavbarLogin.tsx
│   ├── NavbarNoLogin.tsx
│   ├── SupportModalWindow.tsx    # Модалка создания обращения в поддержку
│   ├── SupportOrderComponent.tsx  # Карточка заявки в админ-списке
│   ├── MessageDetailSupportTicket.tsx  # Детали уведомления ЦПП
│   └── ...
├── pages/               # Страницы приложения
│   ├── HomePage.tsx
│   ├── MeetingsPage.tsx
│   ├── ProfilePage.tsx
│   ├── FaqPage.tsx              # FAQ + модалка поддержки + toast
│   ├── MessagesPage.tsx         # Лента уведомлений
│   ├── SupportAdminPage.tsx     # Админ-панель: список заявок с табами
│   ├── MoreOrderSupportPage.tsx # Детали заявки (админ)
│   └── ...
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
| `/faq` | FaqPage (частые вопросы + модалка поддержки) |
| `/meetings` | MeetingsPage (список встреч) |
| `/user/:user_id` | ProfilePage (профиль пользователя) |
| `/messages` | MessagesPage (уведомления) |
| `/meetings/info_reged/:meeting_id` | OneMeetingPage (детали встречи) |
| `/meetings/info_history/:meeting_id` | OneMeetingPageHistory (история) |
| `/support` | SupportAdminPage (админ-панель заявок) |
| `/support/:ticket_id` | MoreOrderSupportPage (детали заявки для админа) |

### State Management (Redux)

- **authSlice**: управление состоянием аутентификации
  - `setUser` — установка данных пользователя
  - `clearUser` — очистка данных (выход)
  - Проверка сессии при загрузке приложения через `/me`
  - Поле `is_admin` используется для условного рендера админ-кнопки в `NavBar.tsx`

---

## Поток обращения в поддержку (Support Ticket Flow)

### 1. Создание обращения (пользователь)
```
Пользователь
  → Открывает FaqPage → нажимает "Написать в поддержку"
  → SupportModalWindow открывается (проверка isAuth)
  → Заполняет категорию, текст, прикрепляет фото (до 5, base64)
  → POST /support
```

### 2. Backend при создании
```
main.py create_support_ticket()
  → SUPPORT_create_ticket() → support_table_17
  → Загружает фото в MinIO (photossupport/)
  → SUPPORT_add_photo() → support_photos_table_22
  → SUPPORT_create_notification():
      - Создаёт запись в notifications_table_4 (тип: 'обращение в ЦПП')
      - Копирует фото в notification_photos_table_6
      - Связывает с пользователем в user_notifications_table_5
```

### 3. Просмотр уведомления (пользователь)
```
MessagesPage.tsx
  → GET /users/{user_id}/notifications
  → При клике на 'обращение в ЦПП' → MessageDetailSupportTicket.tsx
  → Показывает текст + миниатюры фото + модалка просмотра
```

### 4. Админ-панель (админ)
```
NavBar.tsx → красная кнопка щита (видна только при is_admin)
  → /support → SupportAdminPage.tsx
    
SupportAdminPage:
  → Табы: "Новые" / "Принятые" / "Завершенные"
  → Умный polling (60 сек) только для таба "Новые"
  → Карточки: SupportOrderComponent.tsx
    
SupportOrderComponent:
  → Показывает ticket_id, категорию, дату, наличие фото
  → Кнопка "Подробнее" → /support/{ticket_id}
```

### 5. Детали заявки (админ)
```
MoreOrderSupportPage.tsx (/support/:ticket_id)
  → GET /support/tickets/{ticket_id}
  → Показывает:
      - Шапку (как в карточке)
      - Текст обращения (message_text)
      - Миниатюры фото → модалка просмотра (как в ProfilePage)
      - "Почта для связи" (показывается после принятия)
  → Кнопки:
      - "Принять" (жёлтая) — если status='created'
      - "Отказаться" (белая с красной рамкой) — если status='in_progress'
      - "Завершить" (зелёная) — если status='in_progress'
```

### 6. Жизненный цикл статусов заявки
```
[created] --(Принять)--> [in_progress] --(Завершить)--> [resolved]
     ↑_____________________(Отказаться)_____________________|
```

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

### SupportTicketItem (админ-список)
```typescript
{
  ticket_id: number
  requester_user_id: number
  message_text: string
  status: string
  created_at_formatted: string
  text_category: string
  has_photos: boolean
}
```

### SupportTicketDetailResponse (детали заявки)
```typescript
{
  ticket_id: number
  requester_user_id: number
  message_text: string
  status: string
  closed_by_admin_user_id: number | null
  created_at_formatted: string
  text_category: string
  has_photos: boolean
  requester_email: string
  photo_urls: string[]
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
- Пароли хранятся в БД (хеширование через `crypt`)
- Проверка авторизации через `get_current_user`
- Админ-эндпоинты защищены `get_current_admin_user` — проверяет `is_admin` в БД

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
| **notifications_table_4** | Уведомления (`notification_type`: встреча/правила/новости/верификация/обращение в ЦПП, `notification_text`) |
| **user_notifications_table_5** | Связь пользователь-уведомление (`notification_id`, `user_id`, `status`: read/unread) |
| **notification_photos_table_6** | Фото для уведомлений |
| **support_table_17** | Тикеты поддержки (`requester_user_id`, `closed_by_admin_user_id`, `category` → FK categories_to_support_table_23, `message_text`, `status`: created/in_progress/resolved) |
| **support_photos_table_22** | Фото для тикетов поддержки |
| **categories_to_support_table_23** | Категории обращений в поддержку (`category_to_support_id`, `text_category`) |

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
6. **Статусы заявок поддержки:** `created` → `in_progress` → `resolved`
7. **Фото обращений:** Хранятся дважды — в `support_photos_table_22` (для админки) и в `notification_photos_table_6` (для уведомлений пользователя)

---

## Известные особенности и баги

### Исправленные баги
- **photo_urls character-split:** `psycopg` возвращал PostgreSQL `TEXT[]` как строку. Исправлено парсингом в `main.py` GET `/users/{_user_id}/notifications`
- **Support photo list bug:** В `create_support_ticket` передавалась строка `photo_url` вместо списка `photo_urls`. Исправлено накоплением списка и передачей в `SUPPORT_create_notification`

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
