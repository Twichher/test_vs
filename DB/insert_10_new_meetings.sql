-- =============================================================================
-- Скрипт создания 10 новых встреч (meeting_table_2)
-- Организатор: user_id = 11
-- Даты: апрель 2026
-- =============================================================================

DO $$
DECLARE
    v_meeting_id       BIGINT;
    v_notification_id  BIGINT;
    v_photo_url        TEXT := 'http://127.0.0.1:9000/allphotos/photosformeetings/b1245fb7085290d2ee03bbf4933c8515.jpg';
BEGIN
    -- =========================================================================
    -- Встреча 1: Настольные игры
    -- =========================================================================
    INSERT INTO meeting_table_2 (
        creator_user_id, title, description, max_people,
        address, city, district, adults_only, status, start_at, end_at
    ) VALUES (
        11,
        'Вечер настольных игр: Катан и Манчкин',
        'Приглашаем на уютный вечер настольных игр! Будем играть в «Колонизаторов» и «Манчкина». Чай и печенье включены. Отличная возможность познакомиться с единомышленниками и провести время в дружеской атмосфере.',
        8,
        'ул. Тверская, 15, кафе «Игровая зона»',
        'Москва',
        'ЦАО',
        FALSE,
        'created',
        '2026-04-05 18:00:00',
        '2026-04-05 21:00:00'
    ) RETURNING meeting_id INTO v_meeting_id;

    INSERT INTO meeting_categories_table_11 (meeting_id, category_id, category_value)
    VALUES (v_meeting_id, 5, 10);

    INSERT INTO meeting_warnings_table_21 (meeting_id, warning_id)
    VALUES (v_meeting_id, 7), (v_meeting_id, 8), (v_meeting_id, 9);

    INSERT INTO notifications_table_4 (meeting_id, notification_type, notification_text)
    VALUES (v_meeting_id, 'встреча', 'Новая встреча создана: Вечер настольных игр: Катан и Манчкин')
    RETURNING notification_id INTO v_notification_id;

    INSERT INTO notification_photos_table_6 (notification_id, photo_url)
    VALUES (v_notification_id, v_photo_url);

    -- =========================================================================
    -- Встреча 2: Кино
    -- =========================================================================
    INSERT INTO meeting_table_2 (
        creator_user_id, title, description, max_people,
        address, city, district, adults_only, status, start_at, end_at
    ) VALUES (
        11,
        'Поход в кино на премьеру боевика «Стальной кулак»',
        'Идём смотреть долгожданную премьеру боевика. После фильма обсудим впечатления в ближайшем кафе. Билеты покупаем заранее онлайн, места в зале рядом друг с другом.',
        10,
        'Кинотеатр «Октябрь», Новый Арбат, 24',
        'Москва',
        'ЦАО',
        TRUE,
        'created',
        '2026-04-06 19:30:00',
        '2026-04-06 22:30:00'
    ) RETURNING meeting_id INTO v_meeting_id;

    INSERT INTO meeting_categories_table_11 (meeting_id, category_id, category_value)
    VALUES (v_meeting_id, 3, 10);

    INSERT INTO meeting_warnings_table_21 (meeting_id, warning_id)
    VALUES (v_meeting_id, 4), (v_meeting_id, 15), (v_meeting_id, 8);

    INSERT INTO notifications_table_4 (meeting_id, notification_type, notification_text)
    VALUES (v_meeting_id, 'встреча', 'Новая встреча создана: Поход в кино на премьеру боевика «Стальной кулак»')
    RETURNING notification_id INTO v_notification_id;

    INSERT INTO notification_photos_table_6 (notification_id, photo_url)
    VALUES (v_notification_id, v_photo_url);

    -- =========================================================================
    -- Встреча 3: Спорт (пробежка)
    -- =========================================================================
    INSERT INTO meeting_table_2 (
        creator_user_id, title, description, max_people,
        address, city, district, adults_only, status, start_at, end_at
    ) VALUES (
        11,
        'Утренняя пробежка по ВДНХ',
        'Лёгкая пробежка на свежем воздухе по территории ВДНХ. Темп средний, подойдёт для начинающих. После пробежки делаем зарядку и пьём кофе в ближайшей кофейне.',
        15,
        'Центральный вход ВДНХ, площадь Промышленности',
        'Москва',
        'СВАО',
        FALSE,
        'created',
        '2026-04-08 07:00:00',
        '2026-04-08 08:30:00'
    ) RETURNING meeting_id INTO v_meeting_id;

    INSERT INTO meeting_categories_table_11 (meeting_id, category_id, category_value)
    VALUES (v_meeting_id, 1, 10);

    INSERT INTO meeting_warnings_table_21 (meeting_id, warning_id)
    VALUES (v_meeting_id, 1), (v_meeting_id, 9);

    INSERT INTO notifications_table_4 (meeting_id, notification_type, notification_text)
    VALUES (v_meeting_id, 'встреча', 'Новая встреча создана: Утренняя пробежка по ВДНХ')
    RETURNING notification_id INTO v_notification_id;

    INSERT INTO notification_photos_table_6 (notification_id, photo_url)
    VALUES (v_notification_id, v_photo_url);

    -- =========================================================================
    -- Встреча 4: Кулинария
    -- =========================================================================
    INSERT INTO meeting_table_2 (
        creator_user_id, title, description, max_people,
        address, city, district, adults_only, status, start_at, end_at
    ) VALUES (
        11,
        'Кулинарный мастер-класс: готовим пасту карбонара',
        'Научимся готовить классическую пасту карбонара и тирамису. Все ингредиенты предоставляются. Унесёте с собой рецепт и порцию десерта! Подходит для любого уровня кулинарных навыков.',
        12,
        'Кулинарная студия «Вкусно», ул. Большая Дмитровка, 12',
        'Москва',
        'ЦАО',
        FALSE,
        'created',
        '2026-04-10 17:00:00',
        '2026-04-10 20:00:00'
    ) RETURNING meeting_id INTO v_meeting_id;

    INSERT INTO meeting_categories_table_11 (meeting_id, category_id, category_value)
    VALUES (v_meeting_id, 8, 10);

    INSERT INTO meeting_warnings_table_21 (meeting_id, warning_id)
    VALUES (v_meeting_id, 10), (v_meeting_id, 12);

    INSERT INTO notifications_table_4 (meeting_id, notification_type, notification_text)
    VALUES (v_meeting_id, 'встреча', 'Новая встреча создана: Кулинарный мастер-класс: готовим пасту карбонара')
    RETURNING notification_id INTO v_notification_id;

    INSERT INTO notification_photos_table_6 (notification_id, photo_url)
    VALUES (v_notification_id, v_photo_url);

    -- =========================================================================
    -- Встреча 5: Книги
    -- =========================================================================
    INSERT INTO meeting_table_2 (
        creator_user_id, title, description, max_people,
        address, city, district, adults_only, status, start_at, end_at
    ) VALUES (
        11,
        'Книжный клуб: обсуждаем «Властелина колец»',
        'Обсуждаем первую часть трилогии Дж. Р. Р. Толкина. Приносите свои впечатления, любимые цитаты и вопросы. Чай и печенье бесплатно. Приглашаются как давние фанаты, так и новички.',
        20,
        'Библиотека №42, ул. Покровка, 31',
        'Москва',
        'ЦАО',
        FALSE,
        'created',
        '2026-04-12 18:30:00',
        '2026-04-12 20:30:00'
    ) RETURNING meeting_id INTO v_meeting_id;

    INSERT INTO meeting_categories_table_11 (meeting_id, category_id, category_value)
    VALUES (v_meeting_id, 10, 10);

    INSERT INTO meeting_warnings_table_21 (meeting_id, warning_id)
    VALUES (v_meeting_id, 5), (v_meeting_id, 7), (v_meeting_id, 15);

    INSERT INTO notifications_table_4 (meeting_id, notification_type, notification_text)
    VALUES (v_meeting_id, 'встреча', 'Новая встреча создана: Книжный клуб: обсуждаем «Властелина колец»')
    RETURNING notification_id INTO v_notification_id;

    INSERT INTO notification_photos_table_6 (notification_id, photo_url)
    VALUES (v_notification_id, v_photo_url);

    -- =========================================================================
    -- Встреча 6: Фотография
    -- =========================================================================
    INSERT INTO meeting_table_2 (
        creator_user_id, title, description, max_people,
        address, city, district, adults_only, status, start_at, end_at
    ) VALUES (
        11,
        'Фотопрогулка: архитектура сталинских высоток',
        'Прогулка по Москве с фотоаппаратами. Сфотографируем сталинские высотки и узнаем их историю. Подойдёт для любого уровня фототехники — от смартфона до профессиональной камеры.',
        10,
        'Старт у метро «Киевская», выход 2',
        'Москва',
        'ЗАО',
        FALSE,
        'created',
        '2026-04-15 14:00:00',
        '2026-04-15 17:00:00'
    ) RETURNING meeting_id INTO v_meeting_id;

    INSERT INTO meeting_categories_table_11 (meeting_id, category_id, category_value)
    VALUES (v_meeting_id, 9, 10);

    INSERT INTO meeting_warnings_table_21 (meeting_id, warning_id)
    VALUES (v_meeting_id, 6), (v_meeting_id, 15);

    INSERT INTO notifications_table_4 (meeting_id, notification_type, notification_text)
    VALUES (v_meeting_id, 'встреча', 'Новая встреча создана: Фотопрогулка: архитектура сталинских высоток')
    RETURNING notification_id INTO v_notification_id;

    INSERT INTO notification_photos_table_6 (notification_id, photo_url)
    VALUES (v_notification_id, v_photo_url);

    -- =========================================================================
    -- Встреча 7: Языки
    -- =========================================================================
    INSERT INTO meeting_table_2 (
        creator_user_id, title, description, max_people,
        address, city, district, adults_only, status, start_at, end_at
    ) VALUES (
        11,
        'Разговорный клуб: английский для путешественников',
        'Практикуем английский в неформальной обстановке. Тема встречи — путешествия. Будем обсуждать маршруты, делиться историями и учить полезные фразы для поездок за границу.',
        12,
        'Антикафе «Языки», Ленинградский проспект, 15',
        'Москва',
        'САО',
        FALSE,
        'created',
        '2026-04-18 19:00:00',
        '2026-04-18 21:00:00'
    ) RETURNING meeting_id INTO v_meeting_id;

    INSERT INTO meeting_categories_table_11 (meeting_id, category_id, category_value)
    VALUES (v_meeting_id, 13, 10);

    INSERT INTO meeting_warnings_table_21 (meeting_id, warning_id)
    VALUES (v_meeting_id, 7), (v_meeting_id, 8);

    INSERT INTO notifications_table_4 (meeting_id, notification_type, notification_text)
    VALUES (v_meeting_id, 'встреча', 'Новая встреча создана: Разговорный клуб: английский для путешественников')
    RETURNING notification_id INTO v_notification_id;

    INSERT INTO notification_photos_table_6 (notification_id, photo_url)
    VALUES (v_notification_id, v_photo_url);

    -- =========================================================================
    -- Встреча 8: Танцы
    -- =========================================================================
    INSERT INTO meeting_table_2 (
        creator_user_id, title, description, max_people,
        address, city, district, adults_only, status, start_at, end_at
    ) VALUES (
        11,
        'Вечер латинских танцев: бачата и салса',
        'Мастер-класс по бачате для начинающих. Не нужен партнёр — мы подберём пары на месте. После урока — свободная танцевальная практика под латинскую музыку.',
        20,
        'Танцевальная студия «Ритм», ул. Арбат, 10',
        'Москва',
        'ЦАО',
        FALSE,
        'created',
        '2026-04-20 20:00:00',
        '2026-04-20 23:00:00'
    ) RETURNING meeting_id INTO v_meeting_id;

    INSERT INTO meeting_categories_table_11 (meeting_id, category_id, category_value)
    VALUES (v_meeting_id, 14, 10);

    INSERT INTO meeting_warnings_table_21 (meeting_id, warning_id)
    VALUES (v_meeting_id, 3), (v_meeting_id, 7), (v_meeting_id, 9);

    INSERT INTO notifications_table_4 (meeting_id, notification_type, notification_text)
    VALUES (v_meeting_id, 'встреча', 'Новая встреча создана: Вечер латинских танцев: бачата и салса')
    RETURNING notification_id INTO v_notification_id;

    INSERT INTO notification_photos_table_6 (notification_id, photo_url)
    VALUES (v_notification_id, v_photo_url);

    -- =========================================================================
    -- Встреча 9: Йога
    -- =========================================================================
    INSERT INTO meeting_table_2 (
        creator_user_id, title, description, max_people,
        address, city, district, adults_only, status, start_at, end_at
    ) VALUES (
        11,
        'Йога в парке: утренняя практика для всех уровней',
        'Занятие йогой на траве в парке Горького. Приносите коврик и удобную одежду. Инструктор подскажет упражнения как для новичков, так и для опытных практиков.',
        25,
        'Парк Горького, Центральная аллея, ротонда',
        'Москва',
        'ЦАО',
        FALSE,
        'created',
        '2026-04-22 08:00:00',
        '2026-04-22 09:30:00'
    ) RETURNING meeting_id INTO v_meeting_id;

    INSERT INTO meeting_categories_table_11 (meeting_id, category_id, category_value)
    VALUES (v_meeting_id, 15, 10);

    INSERT INTO meeting_warnings_table_21 (meeting_id, warning_id)
    VALUES (v_meeting_id, 1), (v_meeting_id, 9);

    INSERT INTO notifications_table_4 (meeting_id, notification_type, notification_text)
    VALUES (v_meeting_id, 'встреча', 'Новая встреча создана: Йога в парке: утренняя практика для всех уровней')
    RETURNING notification_id INTO v_notification_id;

    INSERT INTO notification_photos_table_6 (notification_id, photo_url)
    VALUES (v_notification_id, v_photo_url);

    -- =========================================================================
    -- Встреча 10: Технологии
    -- =========================================================================
    INSERT INTO meeting_table_2 (
        creator_user_id, title, description, max_people,
        address, city, district, adults_only, status, start_at, end_at
    ) VALUES (
        11,
        'Митап: искусственный интеллект в 2026 году',
        'Обсуждаем последние тренды в AI. Доклады от спикеров, нетворкинг, кофе-брейк. Приходите, если интересуетесь нейросетями, машинным обучением и их практическим применением в бизнесе.',
        50,
        'Коворкинг «Технополис», ул. Пресненская набережная, 12',
        'Москва',
        'ЦАО',
        FALSE,
        'created',
        '2026-04-25 18:00:00',
        '2026-04-25 21:00:00'
    ) RETURNING meeting_id INTO v_meeting_id;

    INSERT INTO meeting_categories_table_11 (meeting_id, category_id, category_value)
    VALUES (v_meeting_id, 11, 10);

    INSERT INTO meeting_warnings_table_21 (meeting_id, warning_id)
    VALUES (v_meeting_id, 4), (v_meeting_id, 15), (v_meeting_id, 8);

    INSERT INTO notifications_table_4 (meeting_id, notification_type, notification_text)
    VALUES (v_meeting_id, 'встреча', 'Новая встреча создана: Митап: искусственный интеллект в 2026 году')
    RETURNING notification_id INTO v_notification_id;

    INSERT INTO notification_photos_table_6 (notification_id, photo_url)
    VALUES (v_notification_id, v_photo_url);

END $$;

SELECT '10 встреч успешно созданы' AS result;
