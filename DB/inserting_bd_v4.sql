CREATE EXTENSION IF NOT EXISTS pgcrypto;

-------------------------------------------------------------------------------

-- Table: user_table_1

INSERT INTO user_table_1 (
    first_name,
    last_name,
    middle_name,
    birth_date,
    gender,
    email,
    password_hash,
    city,
    district,
    is_organizer,
    is_admin,
    is_registration_completed,
    registration_completed_at,
    is_blocked,
    blocked_at
)
VALUES
-- 1
('User01', 'Test', NULL, '1990-01-01', 'M',
 'user01@example.com',
 crypt('Pass!User001', gen_salt('bf', 12)),
 'Moscow', 'ЦАО',
 FALSE, FALSE,
 TRUE, NOW(),
 FALSE, NULL),

-- 2
('User02', 'Test', NULL, '1991-02-02', 'F',
 'user02@example.com',
 crypt('Pass!User002', gen_salt('bf', 12)),
 'Moscow', 'САО',
 FALSE, FALSE,
 TRUE, NOW(),
 FALSE, NULL),

-- 3
('User03', 'Test', NULL, '1992-03-03', 'M',
 'user03@example.com',
 crypt('Pass!User003', gen_salt('bf', 12)),
 'Moscow', 'СВАО',
 FALSE, FALSE,
 TRUE, NOW(),
 FALSE, NULL),

-- 4
('User04', 'Test', NULL, '1993-04-04', 'F',
 'user04@example.com',
 crypt('Pass!User004', gen_salt('bf', 12)),
 'Moscow', 'ВАО',
 FALSE, FALSE,
 TRUE, NOW(),
 FALSE, NULL),

-- 5
('User05', 'Test', NULL, '1994-05-05', 'M',
 'user05@example.com',
 crypt('Pass!User005', gen_salt('bf', 12)),
 'Moscow', 'ЮВАО',
 FALSE, FALSE,
 TRUE, NOW(),
 FALSE, NULL),

-- 6
('User06', 'Test', NULL, '1995-06-06', 'F',
 'user06@example.com',
 crypt('Pass!User006', gen_salt('bf', 12)),
 'Moscow', 'ЮАО',
 FALSE, FALSE,
 TRUE, NOW(),
 FALSE, NULL),

-- 7
('User07', 'Test', NULL, '1996-07-07', 'M',
 'user07@example.com',
 crypt('Pass!User007', gen_salt('bf', 12)),
 'Moscow', 'ЮЗАО',
 FALSE, FALSE,
 TRUE, NOW(),
 FALSE, NULL),

-- 8
('User08', 'Test', NULL, '1997-08-08', 'F',
 'user08@example.com',
 crypt('Pass!User008', gen_salt('bf', 12)),
 'Moscow', 'ЗАО',
 FALSE, FALSE,
 TRUE, NOW(),
 FALSE, NULL),

-- 9 — регистрация не завершена
('User09', 'Test', NULL, '1998-09-09', 'M',
 'user09@example.com',
 crypt('Pass!User009', gen_salt('bf', 12)),
 'Moscow', 'СЗАО',
 FALSE, FALSE,
 FALSE, NULL,
 FALSE, NULL),

-- 10 — заблокирован
('User10', 'Test', NULL, '1999-10-10', 'F',
 'user10@example.com',
 crypt('Pass!User010', gen_salt('bf', 12)),
 'Moscow', 'ЗелАО',
 FALSE, FALSE,
 TRUE, NOW(),
 TRUE, NOW()),

-- 11 — организатор, не админ
('User11', 'Test', NULL, '1985-11-11', 'M',
 'user11@example.com',
 crypt('Pass!User011', gen_salt('bf', 12)),
 'Moscow', 'НАО',
 TRUE, FALSE,
 TRUE, NOW(),
 FALSE, NULL),

-- 12 — организатор, не админ
('User12', 'Test', NULL, '1986-12-12', 'F',
 'user12@example.com',
 crypt('Pass!User012', gen_salt('bf', 12)),
 'Moscow', 'ТАО',
 TRUE, FALSE,
 TRUE, NOW(),
 FALSE, NULL),

-- 13 — организатор, не админ
('User13', 'Test', NULL, '1987-01-13', 'M',
 'user13@example.com',
 crypt('Pass!User013', gen_salt('bf', 12)),
 'Moscow', 'ЦАО',
 TRUE, FALSE,
 TRUE, NOW(),
 FALSE, NULL),

-- 14 — организатор и админ
('User14', 'Test', NULL, '1988-02-14', 'F',
 'user14@example.com',
 crypt('Pass!User014', gen_salt('bf', 12)),
 'Moscow', 'САО',
 TRUE, TRUE,
 TRUE, NOW(),
 FALSE, NULL),

-- 15 — только админ
('User15', 'Test', NULL, '1989-03-15', 'M',
 'user15@example.com',
 crypt('Pass!User015', gen_salt('bf', 12)),
 'Moscow', 'ЮЗАО',
 FALSE, TRUE,
 TRUE, NOW(),
 FALSE, NULL);

-- select * from user_table_1 where email = 'email1@gmail.com' 
-- and password_hash = crypt('pass1', password_hash)

select * from user_table_1 where user_id = 22;
-------------------------------------------------------------------------------

-- Table: meeting_table_2

INSERT INTO meeting_table_2 (
    creator_user_id,
    title,
    description,
    max_people,
    address,
    city,
    district,
    adults_only,
    status,
    start_at,
    end_at,
    actual_end_at,
    created_at,
    rating_after_end,
    count_of_ratings
)
VALUES
-- 1: created, adults_only = FALSE
(11,
 'Настольные игры',
 'Вечер настольных игр для всех желающих.',
 8,
 'ул. Тверская, д. 1',
 'Moscow',
 'НАО',
 FALSE,
 'created',
 TIMESTAMP '2026-03-10 18:00:00',
 TIMESTAMP '2026-03-10 21:00:00',
 NULL,
 NOW(),
 0,
 0),

-- 2: created, adults_only = TRUE
(12,
 'Винный вечер',
 'Дегустация вин, только для совершеннолетних.',
 10,
 'ул. Арбат, д. 25',
 'Moscow',
 'ТАО',
 TRUE,
 'created',
 TIMESTAMP '2026-03-12 19:00:00',
 TIMESTAMP '2026-03-12 22:00:00',
 NULL,
 NOW(),
 0,
 0),

-- 3: created, adults_only = FALSE
(13,
 'Утренняя пробежка',
 'Совместная пробежка в парке.',
 15,
 'парк Сокольники, главный вход',
 'Moscow',
 'ЦАО',
 FALSE,
 'created',
 TIMESTAMP '2026-03-15 07:30:00',
 TIMESTAMP '2026-03-15 09:00:00',
 NULL,
 NOW(),
 0,
 0),

-- 4: in_progress
(11,
 'Кинопросмотр',
 'Совместный просмотр фильма и обсуждение.',
 12,
 'ул. Профсоюзная, д. 15',
 'Moscow',
 'НАО',
 FALSE,
 'in_progress',
 TIMESTAMP '2026-03-05 18:00:00',
 TIMESTAMP '2026-03-05 20:30:00',
 NULL,
 NOW(),
 0,
 0),

-- 5: in_progress
(14,
 'IT-митап',
 'Встреча разработчиков для обмена опытом.',
 30,
 'ул. Ленина, д. 50',
 'Moscow',
 'САО',
 FALSE,
 'in_progress',
 TIMESTAMP '2026-03-05 17:00:00',
 TIMESTAMP '2026-03-05 20:00:00',
 NULL,
 NOW(),
 0,
 0),

-- 6: canceled
(12,
 'Прогулка по набережной',
 'Неспешная прогулка и общение.',
 20,
 'Пушкинская набережная',
 'Moscow',
 'ТАО',
 FALSE,
 'canceled',
 TIMESTAMP '2026-03-08 16:00:00',
 TIMESTAMP '2026-03-08 18:00:00',
 NULL, -- если статус = canceled то поле actual_end_at тоже равно NOW()
 NOW(),
 0,
 0);

select * from meeting_table_2 where meeting_id = 10
select * from notifications_table_4;
select * from notification_photos_table_6;
select * from user_table_1
select * from user_notifications_table_5;

select * from support_table_17;
select * from support_photos_table_22;

insert into notifications_table_4
(notification_type, notification_text)
VAlUES
('Верификация', 'Вам нужно пройти верификацию!')
-------------------------------------------------------------------------------

-- Table: user_extra_info_table_3

INSERT INTO user_extra_info_table_3 (
    user_id,
    meetings_visited_as_guest,
    count_period_meetings_guest,
    count_all_rating_guest,
    rating_as_guest,
    count_period_rating_guest,
    intermediate_rating_as_guest,
    meetings_created_as_organizer,
    rating_as_organizer,
    count_period_meetings_as_organizer,
    intermediate_rating_as_organizer,
    meetings_as_currency,
    earned_currency
)
VALUES
(1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0),
(2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0),
(3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0),
(4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0),
(5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0),
(6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0),
(7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0),
(8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0),
(9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0),
(10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0),
(11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0),
(12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0),
(13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0),
(14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0),
(15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0);

-------------------------------------------------------------------------------

-- Table: notifications_table_4

INSERT INTO notifications_table_4 (
    meeting_id,
    notification_type,
    notification_text,
    created_at
)
VALUES
-- 1: meeting_id = 1, type = "Встреча"
(1, 'Встреча', 'Напоминание о встрече №1', NOW()),

-- 2: meeting_id = 2, type = "Встреча"
(2, 'Встреча', 'Напоминание о встрече №2', NOW()),

-- 3: meeting_id = 3, type = "Встреча"
(3, 'Встреча', 'Напоминание о встрече №3', NOW()),

-- 4: meeting_id = 4, type = "Встреча"
(4, 'Встреча', 'Напоминание о встрече №4', NOW()),

-- 5: meeting_id = 5, type = "Встреча"
(5, 'Встреча', 'Напоминание о встрече №5', NOW()),

-- 6: meeting_id = 6, type = "Встреча"
(6, 'Встреча', 'Напоминание о встрече №6', NOW()),

-- 7: без meeting_id, type = "Новости"
(NULL, 'Новости', 'Новая функциональность в приложении.', NOW()),

-- 8: без meeting_id, type = "Правила"
(NULL, 'Правила', 'Обновлены правила использования сервиса.', NOW());

-------------------------------------------------------------------------------

-- Table: notification_photos_table_6

INSERT INTO notification_photos_table_6 (notification_id, photo_url)
VALUES
  (1,  'http://127.0.0.1:9000/allphotos/no.jpg'),
  (1,  'http://127.0.0.1:9000/allphotos/no.jpg'),
  (2,  'http://127.0.0.1:9000/allphotos/no.jpg'),
  (3,  'http://127.0.0.1:9000/allphotos/no.jpg'),
  (4,  'http://127.0.0.1:9000/allphotos/no.jpg'),
  (4,  'http://127.0.0.1:9000/allphotos/no.jpg'),
  (4,  'http://127.0.0.1:9000/allphotos/no.jpg'),
  (5,  'http://127.0.0.1:9000/allphotos/no.jpg'),
  (6,  'http://127.0.0.1:9000/allphotos/no.jpg'),
  (7,  'http://127.0.0.1:9000/allphotos/no.jpg'),
  (7,  'http://127.0.0.1:9000/allphotos/no.jpg'),
  (8,  'http://127.0.0.1:9000/allphotos/no.jpg');

-------------------------------------------------------------------------------

-- Table: meeting_rating_table_8

INSERT INTO meeting_rating_table_8 (
    meeting_id,
    user_id,
    user_action,
    registered_at
)
VALUES
-- meeting 1 (creator 11), user_id 1–5, один missed
(1, 1, 'registered', NOW()),
(1, 2, 'registered', NOW()),
(1, 3, 'registered', NOW()),
(1, 4, 'missed',    NOW()),
(1, 5, 'registered', NOW()),

-- meeting 2 (creator 12), user_id 6–10, пропускаем 10 (заблокирован) => берём 6–9 и 11
(2, 6, 'registered', NOW()),
(2, 7, 'registered', NOW()),
(2, 8, 'registered', NOW()),
(2, 9, 'registered', NOW()),
(2, 11,'registered', NOW()),

-- meeting 3 (creator 13), базово 11–15, но 13 нельзя => 11,12,14,15 и один missed
(3, 11,'registered', NOW()),
(3, 12,'registered', NOW()),
(3, 14,'registered', NOW()),
(3, 15,'missed',    NOW()),
(3, 1, 'registered', NOW()),  -- следующий по кругу

-- meeting 4 (creator 11), снова 1–5
(4, 1, 'registered', NOW()),
(4, 2, 'registered', NOW()),
(4, 3, 'registered', NOW()),
(4, 4, 'registered', NOW()),
(4, 5, 'registered', NOW()),

-- meeting 5 (creator 14), по кругу дальше: 6–10, но 10 нельзя и 14 нельзя => 6–9 + 11
(5, 6, 'registered', NOW()),
(5, 7, 'registered', NOW()),
(5, 8, 'registered', NOW()),
(5, 9, 'registered', NOW()),
(5, 11,'registered', NOW()),

-- meeting 6 (creator 12), по кругу дальше: 11–15, но 12 нельзя => 11,13,14,15 и ещё один по кругу
(6, 11,'registered', NOW()),
(6, 13,'registered', NOW()),
(6, 14,'registered', NOW()),
(6, 15,'registered', NOW()),
(6, 1, 'registered', NOW());

-- Моделируем ситуацию: встреча завершилась
-- 1) Организатор Отмечает тех кто был
	UPDATE meeting_rating_table_8
	SET user_action = 'attended'
	WHERE user_id in (6,7,8,9) and meeting_id = 5;

--2) Те кого не было
	UPDATE meeting_rating_table_8
	SET user_action = 'missed'
	WHERE user_id = 11 and meeting_id = 5;

	select * from meeting_rating_table_8 where meeting_id = 5

--3) Оценивает тех кто был	
	INSERT INTO user_ratings_table_15
	(rated_user_id, rater_user_id, rating_value, meeting_id)
	VALUES
	(6, 14, 8, 5),
	(7, 14, 7, 5),
	(8, 14, 5, 5),
	(9, 14, 10, 5);
	
	select * from user_extra_info_table_3 where user_id in (6,7,8,9)
	ORDER BY date_of_stats DESC LIMIT 4 -- поля рейтинга обновились
	
--4) Завершаем встречу
	UPDATE meeting_table_2
	SET status = 'finished'
	WHERE meeting_id = 5; 
	-- у организатора обновилось кол-во созданыхх встреч и earned_currency
	-- у визитеров обновились посещенные встречи
	
	select * from meeting_table_2 where meeting_id = 5

--5) Какой то пользователь оценил эту встречу
	INSERT INTO meeting_rating_info_table_26
	(meeting_id, user_id, meeting_rating)
	VAlUES
	(5, 6, 8)

	select * from meeting_table_2 where meeting_id = 5

	select * from user_extra_info_table_3 where user_id = 14
	ORDER BY date_of_stats DESC LIMIT 1
	-- рейтинг организатора поменялся

--6) Еще кто то оценил эту встречу

	INSERT INTO meeting_rating_info_table_26
	(meeting_id, user_id, meeting_rating)
	VAlUES
	(5, 7, 6)

	select * from meeting_table_2 where meeting_id = 5

	select * from user_extra_info_table_3 where user_id = 1
	ORDER BY date_of_stats DESC LIMIT 1

--7) Какой то пользователь оценил другого визитера

	INSERT INTO user_ratings_table_15
	(rated_user_id, rater_user_id, rating_value, meeting_id)
	VALUES
	(6, 7, 4, 5);

	INSERT INTO user_ratings_table_15
	(rated_user_id, rater_user_id, rating_value, meeting_id)
	VALUES
	(6, 8, 3, 5);

	select * from user_extra_info_table_3 where user_id = 6
	ORDER BY date_of_stats DESC LIMIT 1

--8) Какой то пользователь оценил организатора

	INSERT INTO user_ratings_table_15
	(rated_user_id, rater_user_id, rating_value, meeting_id)
	VALUES
	(14, 7, 4, 5);

	select * from user_extra_info_table_3 where user_id = 14
	ORDER BY date_of_stats DESC LIMIT 1

-- 1) Проверка на то что списывается 1 встреча после finished
 	UPDATE meeting_rating_table_8
	SET user_action = 'attended'
	WHERE user_id in (1,2,3,4,5) and meeting_id = 4;

	INSERT INTO user_ratings_table_15
	(rated_user_id, rater_user_id, rating_value, meeting_id)
	VALUES
	(1, 11, 8, 4),
	(2, 11, 7, 4),
	(3, 11, 5, 4),
	(4, 11, 9, 4),
	(5, 11, 2, 5);

	UPDATE meeting_table_2
	SET status = 'finished'
	WHERE meeting_id = 4; 

	select * from meeting_table_2 where meeting_id = 4; 

	select * from user_extra_info_table_3 where user_id in (1,2,3,4,5)
	ORDER BY date_of_stats DESC LIMIT 5

	delete from meeting_rating_table_8
	where meeting_id = 2 and user_id = 1
-------------------------------------------------------------------------------

-- Table: categories_table_10

INSERT INTO categories_table_10 (category_name)
VALUES
  ('спорт'),
  ('гонки'),
  ('кино'),
  ('музыка'),
  ('настольные игры'),
  ('видеоигры'),
  ('путешествия'),
  ('кулинария'),
  ('фотография'),
  ('книги'),
  ('технологии'),
  ('бизнес'),
  ('языки'),
  ('танцы'),
  ('йога');

-------------------------------------------------------------------------------

-- Table: meeting_categories_table_11

INSERT INTO meeting_categories_table_11 (meeting_id, category_id, category_value)
VALUES
  -- meeting 1
  (1, 1, 10),  (1, 2, 10),

  -- meeting 2
  (2, 3, 10),  (2, 4, 10),

  -- meeting 3
  (3, 5, 10),  (3, 6, 10),

  -- meeting 4
  (4, 7, 10),  (4, 8, 10),

  -- meeting 5
  (5, 9, 10),  (5, 10, 10),

  -- meeting 6
  (6, 11, 10), (6, 12, 10);

-------------------------------------------------------------------------------

-- Table: user_categories_table_12

INSERT INTO user_categories_table_12 (user_id, category_id, category_value)
VALUES
  (1,  1, 0),(1,  2, 0),(1,  3, 0),(1,  4, 0),(1,  5, 0),(1,  6, 0),(1,  7, 0),(1,  8, 0),(1,  9, 0),(1, 10, 0),(1, 11, 0),(1, 12, 0),(1, 13, 0),(1, 14, 0),(1, 15, 0),
  (2,  1, 0),(2,  2, 0),(2,  3, 0),(2,  4, 0),(2,  5, 0),(2,  6, 0),(2,  7, 0),(2,  8, 0),(2,  9, 0),(2, 10, 0),(2, 11, 0),(2, 12, 0),(2, 13, 0),(2, 14, 0),(2, 15, 0),
  (3,  1, 0),(3,  2, 0),(3,  3, 0),(3,  4, 0),(3,  5, 0),(3,  6, 0),(3,  7, 0),(3,  8, 0),(3,  9, 0),(3, 10, 0),(3, 11, 0),(3, 12, 0),(3, 13, 0),(3, 14, 0),(3, 15, 0),
  (4,  1, 0),(4,  2, 0),(4,  3, 0),(4,  4, 0),(4,  5, 0),(4,  6, 0),(4,  7, 0),(4,  8, 0),(4,  9, 0),(4, 10, 0),(4, 11, 0),(4, 12, 0),(4, 13, 0),(4, 14, 0),(4, 15, 0),
  (5,  1, 0),(5,  2, 0),(5,  3, 0),(5,  4, 0),(5,  5, 0),(5,  6, 0),(5,  7, 0),(5,  8, 0),(5,  9, 0),(5, 10, 0),(5, 11, 0),(5, 12, 0),(5, 13, 0),(5, 14, 0),(5, 15, 0),
  (6,  1, 0),(6,  2, 0),(6,  3, 0),(6,  4, 0),(6,  5, 0),(6,  6, 0),(6,  7, 0),(6,  8, 0),(6,  9, 0),(6, 10, 0),(6, 11, 0),(6, 12, 0),(6, 13, 0),(6, 14, 0),(6, 15, 0),
  (7,  1, 0),(7,  2, 0),(7,  3, 0),(7,  4, 0),(7,  5, 0),(7,  6, 0),(7,  7, 0),(7,  8, 0),(7,  9, 0),(7, 10, 0),(7, 11, 0),(7, 12, 0),(7, 13, 0),(7, 14, 0),(7, 15, 0),
  (8,  1, 0),(8,  2, 0),(8,  3, 0),(8,  4, 0),(8,  5, 0),(8,  6, 0),(8,  7, 0),(8,  8, 0),(8,  9, 0),(8, 10, 0),(8, 11, 0),(8, 12, 0),(8, 13, 0),(8, 14, 0),(8, 15, 0),
  (9,  1, 0),(9,  2, 0),(9,  3, 0),(9,  4, 0),(9,  5, 0),(9,  6, 0),(9,  7, 0),(9,  8, 0),(9,  9, 0),(9, 10, 0),(9, 11, 0),(9, 12, 0),(9, 13, 0),(9, 14, 0),(9, 15, 0),
  (10, 1, 0),(10, 2, 0),(10, 3, 0),(10, 4, 0),(10, 5, 0),(10, 6, 0),(10, 7, 0),(10, 8, 0),(10, 9, 0),(10,10, 0),(10,11, 0),(10,12, 0),(10,13, 0),(10,14, 0),(10,15, 0),
  (11, 1, 0),(11, 2, 0),(11, 3, 0),(11, 4, 0),(11, 5, 0),(11, 6, 0),(11, 7, 0),(11, 8, 0),(11, 9, 0),(11,10, 0),(11,11, 0),(11,12, 0),(11,13, 0),(11,14, 0),(11,15, 0),
  (12, 1, 0),(12, 2, 0),(12, 3, 0),(12, 4, 0),(12, 5, 0),(12, 6, 0),(12, 7, 0),(12, 8, 0),(12, 9, 0),(12,10, 0),(12,11, 0),(12,12, 0),(12,13, 0),(12,14, 0),(12,15, 0),
  (13, 1, 0),(13, 2, 0),(13, 3, 0),(13, 4, 0),(13, 5, 0),(13, 6, 0),(13, 7, 0),(13, 8, 0),(13, 9, 0),(13,10, 0),(13,11, 0),(13,12, 0),(13,13, 0),(13,14, 0),(13,15, 0),
  (14, 1, 0),(14, 2, 0),(14, 3, 0),(14, 4, 0),(14, 5, 0),(14, 6, 0),(14, 7, 0),(14, 8, 0),(14, 9, 0),(14,10, 0),(14,11, 0),(14,12, 0),(14,13, 0),(14,14, 0),(14,15, 0),
  (15, 1, 0),(15, 2, 0),(15, 3, 0),(15, 4, 0),(15, 5, 0),(15, 6, 0),(15, 7, 0),(15, 8, 0),(15, 9, 0),(15,10, 0),(15,11, 0),(15,12, 0),(15,13, 0),(15,14, 0),(15,15, 0);

-------------------------------------------------------------------------------

-- Table: warnings_table_13

INSERT INTO warnings_table_13 (warning_name)
VALUES
  ('не курить'),
  ('курение разрешено'),
  ('без телефонов'),
  ('телефоны на беззвучный режим'),
  ('без фото и видеосъёмки'),
  ('фото и видеосъёмка разрешены'),
  ('без мата'),
  ('вход только по регистрации'),
  ('приходите заранее (за 10 минут)'),
  ('сменная обувь обязательна'),
  ('с животными нельзя'),
  ('алкоголь запрещён'),
  ('алкоголь разрешён'),
  ('маски/СИЗ обязательны'),
  ('соблюдайте тишину'),
  ('стоимость делим на всех');

-------------------------------------------------------------------------------

-- Table: user_photos_table_14

INSERT INTO user_photos_table_14(user_id, photo_url)
VALUES
(1, 'http://127.0.0.1:9000/allphotos/no.jpg')

INSERT INTO user_photos_table_14(user_id, photo_url)
VALUES
(1, 'http://127.0.0.1:9000/allphotos/no_2.png')

INSERT INTO user_photos_table_14(user_id, photo_url)
VALUES
(14, 'http://127.0.0.1:9000/allphotos/no.jpg')
-------------------------------------------------------------------------------

-- Table: faq_table_18

INSERT INTO faq_table_18 (question_text, question_answer)
VALUES
  ('Вопрос №1',  'Ответ №1'),
  ('Вопрос №2',  'Ответ №2'),
  ('Вопрос №3',  'Ответ №3'),
  ('Вопрос №4',  'Ответ №4'),
  ('Вопрос №5',  'Ответ №5'),
  ('Вопрос №6',  'Ответ №6'),
  ('Вопрос №7',  'Ответ №7'),
  ('Вопрос №8',  'Ответ №8'),
  ('Вопрос №9',  'Ответ №9'),
  ('Вопрос №10', 'Ответ №10'),
  ('Вопрос №11', 'Ответ №11'),
  ('Вопрос №12', 'Ответ №12'),
  ('Вопрос №13', 'Ответ №13'),
  ('Вопрос №14', 'Ответ №14'),
  ('Вопрос №15', 'Ответ №15')

-------------------------------------------------------------------------------

-- Table: meeting_warnings_table_21

INSERT INTO meeting_warnings_table_21 (meeting_id, warning_id)
VALUES
  -- meeting 1
  (1, 1),  (1, 4),
  -- meeting 2
  (2, 2),  (2, 5),
  -- meeting 3
  (3, 3),  (3, 9),
  -- meeting 4
  (4, 6),  (4, 10),
  -- meeting 5
  (5, 7),  (5, 8),
  -- meeting 6
  (6, 11), (6, 12);


-------------------------------------------------------------------------------

-- Table: start_end_trial_period_table_25

INSERT INTO start_end_trial_period_table_25 (start_trial_period, end_trial_period)
VALUES (NOW(), NOW() + INTERVAL '2 day');

