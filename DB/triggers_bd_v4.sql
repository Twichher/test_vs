-------------------------------------------------------------------------------

-- Триггер #1:обновляет поле actual_end_at у встречи, у котрой
-- статус обновился на finished, то есть встреча завершилась,
-- соотв. мы простовляем actual_end_at в момент изменения статуса

CREATE OR REPLACE FUNCTION set_actual_end_at_on_finished()
RETURNS trigger AS $$
BEGIN
    -- если статус обновляется на 'finished'
    IF NEW.status = 'finished'
       AND (OLD.status IS DISTINCT FROM NEW.status) THEN
        NEW.actual_end_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_set_actual_end_at
BEFORE UPDATE OF status
ON meeting_table_2
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'finished')
EXECUTE FUNCTION set_actual_end_at_on_finished();

-------------------------------------------------------------------------------

-- Триггер #2: если у встречи статус изменился на finished,
-- то у всех визитеров этой встречи поля 
-- meetings_visited_as_guest и count_period_meetings_guest
-- (если NOW() входит в промежуточный период, если нет 
-- то это поле не меняется) обновляются на +1. 

CREATE OR REPLACE FUNCTION inc_meetings_visited_as_guest_on_finished()
RETURNS trigger AS $$
DECLARE
    in_trial_period  boolean;
    v_start          TIMESTAMP;
    v_end            TIMESTAMP;
BEGIN
    IF TG_OP = 'UPDATE'
       AND NEW.status = 'finished'
       AND (OLD.status IS DISTINCT FROM NEW.status) THEN

        -- берём последний trial-период
        SELECT p.start_trial_period, p.end_trial_period
        INTO v_start, v_end
        FROM start_end_trial_period_table_25 p
        ORDER BY p.period_id DESC
        LIMIT 1;

        IF FOUND AND NOW() BETWEEN v_start AND v_end THEN
            in_trial_period := TRUE;
        ELSE
            in_trial_period := FALSE;
            -- создаём новый период на 1 день
            INSERT INTO start_end_trial_period_table_25 (start_trial_period, end_trial_period)
            VALUES (NOW(), NOW() + INTERVAL '1 day');
        END IF;

        -- увеличиваем счётчики у всех, кто был `attended` на этой встрече
        UPDATE user_extra_info_table_3 u
        SET
            meetings_visited_as_guest = meetings_visited_as_guest + 1,
            count_period_meetings_guest =
                CASE
                    WHEN in_trial_period THEN count_period_meetings_guest + 1
                    ELSE count_period_meetings_guest
                END
        WHERE u.record_id IN (
            SELECT x.record_id
            FROM meeting_rating_table_8 mrt
            JOIN LATERAL (
                -- последняя запись по пользователю в табл 3
                SELECT record_id
                FROM user_extra_info_table_3 u2
                WHERE u2.user_id = mrt.user_id
                ORDER BY u2.date_of_stats DESC, u2.record_id DESC
                LIMIT 1
            ) x ON TRUE
            WHERE mrt.meeting_id = NEW.meeting_id
              AND mrt.user_action = 'attended'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inc_meetings_visited_as_guest
AFTER UPDATE OF status
ON meeting_table_2
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'finished')
EXECUTE FUNCTION inc_meetings_visited_as_guest_on_finished();

-------------------------------------------------------------------------------

-- Триггер #3: если у встречи статус изменился на finished,
-- то у создателя этой встречи поля 
-- meetings_created_as_organizer и count_period_meetings_as_organizer
-- (если NOW() входит в промежуточный период, если нет 
-- то это поле не меняется) обновляются на +1.
-- Также вычисляем earned_currency.

CREATE OR REPLACE FUNCTION inc_meetings_and_period_meetings()
RETURNS trigger AS $$
DECLARE
    in_trial_period  boolean;
    users_cnt        integer;
    v_start          TIMESTAMP;
    v_end            TIMESTAMP;
BEGIN
    -- срабатываем только при смене статуса на 'finished'
    IF TG_OP = 'UPDATE'
       AND NEW.status = 'finished'
       AND (OLD.status IS DISTINCT FROM NEW.status) THEN

        -- берём последний период
        SELECT p.start_trial_period, p.end_trial_period
        INTO v_start, v_end
        FROM start_end_trial_period_table_25 p
        ORDER BY p.period_id DESC
        LIMIT 1;

        IF FOUND AND NOW() BETWEEN v_start AND v_end THEN
            in_trial_period := TRUE;
        ELSE
            in_trial_period := FALSE;
            -- создаём новый период на 1 день
            INSERT INTO start_end_trial_period_table_25 (start_trial_period, end_trial_period)
            VALUES (NOW(), NOW() + INTERVAL '1 day');
        END IF;

        -- считаем, сколько user_id связано с этой встречей
        SELECT COUNT(mr.user_id)
        INTO users_cnt
        FROM meeting_rating_table_8 mr
        WHERE mr.meeting_id = NEW.meeting_id;

        -- обновляем ТОЛЬКО последнюю запись по организатору
        UPDATE user_extra_info_table_3 u
        SET meetings_created_as_organizer = meetings_created_as_organizer + 1,
            count_period_meetings_as_organizer = count_period_meetings_as_organizer +
                CASE WHEN in_trial_period THEN 1 ELSE 0 END,
            earned_currency = earned_currency + (users_cnt * 0.75)
        WHERE u.user_id = NEW.creator_user_id
          AND u.record_id = (
                SELECT record_id
                FROM user_extra_info_table_3 x
                WHERE x.user_id = NEW.creator_user_id
                ORDER BY x.date_of_stats DESC, x.record_id DESC
                LIMIT 1
          );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inc_meetings_created
AFTER UPDATE OF status
ON meeting_table_2
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'finished')
EXECUTE FUNCTION inc_meetings_and_period_meetings();

-------------------------------------------------------------------------------

-- Триггер #4: если в таблицу meeting_rating_info_table_26
-- добавлена оценка какой то встречи то 
-- ее рейтинг пересчитывается
-- а также у организатора этой встречи увеличиваются счетчики оценок

CREATE OR REPLACE FUNCTION update_meeting_rating_after_insert()
RETURNS trigger AS $$
DECLARE
    in_trial_period  boolean;
    v_start          TIMESTAMP;
    v_end            TIMESTAMP;
    v_creator_id     BIGINT;
BEGIN
    -- Обновляем агрегаты по конкретному meeting_id
    UPDATE meeting_table_2 m
    SET 
        rating_after_end = 
            (m.rating_after_end * m.count_of_ratings + NEW.meeting_rating)
            / (m.count_of_ratings + 1),
        count_of_ratings = m.count_of_ratings + 1
    WHERE m.meeting_id = NEW.meeting_id;

    -- Получаем создателя встречи
    SELECT creator_user_id INTO v_creator_id
    FROM meeting_table_2
    WHERE meeting_id = NEW.meeting_id;

    -- Проверяем промежуточный период
    SELECT p.start_trial_period, p.end_trial_period
    INTO v_start, v_end
    FROM start_end_trial_period_table_25 p
    ORDER BY p.period_id DESC
    LIMIT 1;

    IF FOUND AND NOW() BETWEEN v_start AND v_end THEN
        in_trial_period := TRUE;
    ELSE
        in_trial_period := FALSE;
    END IF;

    -- Обновляем счетчики оценок у организатора
    UPDATE user_extra_info_table_3 u
    SET 
        count_all_rating_organizer = count_all_rating_organizer + 1,
        count_period_rating_organizer = 
            CASE
                WHEN in_trial_period THEN count_period_rating_organizer + 1
                ELSE count_period_rating_organizer
            END
    WHERE u.user_id = v_creator_id
      AND u.record_id = (
            SELECT record_id
            FROM user_extra_info_table_3 x
            WHERE x.user_id = v_creator_id
            ORDER BY x.date_of_stats DESC, x.record_id DESC
            LIMIT 1
      );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_meeting_rating_after_insert
AFTER INSERT
ON meeting_rating_info_table_26
FOR EACH ROW
EXECUTE FUNCTION update_meeting_rating_after_insert();

-------------------------------------------------------------------------------

-- Триггер #5: если в таблицу user_ratings_table_15
-- добавлена оценка какого то пользователя
-- то его рейтинги пересчитываются

CREATE OR REPLACE FUNCTION update_guest_ratings_after_insert()
RETURNS trigger AS $$
DECLARE
    in_trial_period  boolean;
    v_start          TIMESTAMP;
    v_end            TIMESTAMP;
BEGIN
    -- берём последний trial-период
    SELECT p.start_trial_period, p.end_trial_period
    INTO v_start, v_end
    FROM start_end_trial_period_table_25 p
    ORDER BY p.period_id DESC
    LIMIT 1;

    IF FOUND AND NOW() BETWEEN v_start AND v_end THEN
        in_trial_period := TRUE;
    ELSE
        in_trial_period := FALSE;
        -- создаём новый период на 1 день
        INSERT INTO start_end_trial_period_table_25 (start_trial_period, end_trial_period)
        VALUES (NOW(), NOW() + INTERVAL '1 day');
    END IF;

    -- обновляем ТОЛЬКО последнюю запись по пользователю (по date_of_stats / record_id)
    UPDATE user_extra_info_table_3 u
    SET
        rating_as_guest =
            (u.rating_as_guest * u.count_all_rating_guest + NEW.rating_value)
            / (u.count_all_rating_guest + 1),

        count_all_rating_guest = u.count_all_rating_guest + 1,

        intermediate_rating_as_guest =
            CASE
                WHEN in_trial_period AND u.count_period_rating_guest >= 0 THEN
                    (u.intermediate_rating_as_guest * u.count_period_rating_guest + NEW.rating_value)
                    / (u.count_period_rating_guest + 1)
                ELSE
                    u.intermediate_rating_as_guest
            END,

        count_period_rating_guest =
            CASE
                WHEN in_trial_period THEN u.count_period_rating_guest + 1
                ELSE u.count_period_rating_guest
            END
    WHERE u.user_id = NEW.rated_user_id
      AND u.record_id = (
            SELECT record_id
            FROM user_extra_info_table_3 x
            WHERE x.user_id = NEW.rated_user_id
            ORDER BY x.date_of_stats DESC, x.record_id DESC
            LIMIT 1
      );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_update_guest_ratings_after_insert
AFTER INSERT
ON user_ratings_table_15
FOR EACH ROW
EXECUTE FUNCTION update_guest_ratings_after_insert();

-------------------------------------------------------------------------------

-- Триггер #6: если в таблицу start_end_trial_period_table_25
-- добавлен новый период, то данные старого периода в табл
-- 3 user_extra_info_table_3 для каждого пользователя
-- обнуляется

CREATE OR REPLACE FUNCTION copy_user_stats_with_reset_period_fields()
RETURNS trigger AS $$
BEGIN
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
		count_all_rating_organizer,
		count_period_rating_organizer,
		meetings_as_currency,
		earned_currency,
		date_of_stats
    )
    SELECT
        user_id,
        meetings_visited_as_guest,
        0,							  -- count_period_meetings_guest
        count_all_rating_guest,                          
        rating_as_guest,
        0, -- count_period_rating_guest
        0,                           -- intermediate_rating_as_guest
        meetings_created_as_organizer,
        rating_as_organizer,
        0, -- count_period_meetings_as_organizer
        0,                           -- intermediate_rating_as_organizer
        count_all_rating_organizer,  -- сохраняем общий счетчик
        0,                           -- count_period_rating_organizer (сбрасываем)
        meetings_as_currency,                          
		earned_currency,							  
        NOW()
    FROM user_extra_info_table_3;

    RETURN NULL;  -- statement-триггер
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_copy_user_stats_on_new_trial
AFTER INSERT
ON start_end_trial_period_table_25
FOR EACH STATEMENT
EXECUTE FUNCTION copy_user_stats_with_reset_period_fields();

-------------------------------------------------------------------------------

-- Триггер #7: если в таблице meeting_table_2
-- изменены поля rating_after_end и count_of_ratings то
-- в табл user_extra_info_table_3 поля 
-- rating_as_organizer и intermediate_rating_as_organizer
-- пересчитываются для создателя этой встречи.

CREATE OR REPLACE FUNCTION update_organizer_ratings_after_meeting_update()
RETURNS trigger AS $$
DECLARE
    in_trial_period  boolean;
    v_start          TIMESTAMP;
    v_end            TIMESTAMP;
BEGIN
    -- Берём последний период (по period_id)
    SELECT p.start_trial_period, p.end_trial_period
    INTO v_start, v_end
    FROM start_end_trial_period_table_25 p
    ORDER BY p.period_id DESC
    LIMIT 1;

    -- Если период есть и NOW() попадает внутрь - используем его
    IF FOUND AND NOW() BETWEEN v_start AND v_end THEN
        in_trial_period := TRUE;
    ELSE
        in_trial_period := FALSE;
        -- Создаём новый период на 1 день от текущего момента, 
        -- а intermediate_rating_as_organizer обновлен не будет (см. логику CASE ниже)
        INSERT INTO start_end_trial_period_table_25 (start_trial_period, end_trial_period)
        VALUES (NOW(), NOW() + INTERVAL '1 day');
    END IF;

    -- Пересчёт rating_as_organizer / intermediate_rating_as_organizer
    UPDATE user_extra_info_table_3 u
    SET 
        rating_as_organizer =
            (u.rating_as_organizer
             - u.rating_as_organizer / NULLIF(u.meetings_created_as_organizer, 0)
             + NEW.rating_after_end / NULLIF(u.meetings_created_as_organizer, 0)),

        -- Обратите внимание: исправлено u.count_period_meetings на u.count_period_meetings_as_organizer
        intermediate_rating_as_organizer =
            CASE
                WHEN in_trial_period AND u.count_period_meetings_as_organizer > 0 THEN
                    (u.intermediate_rating_as_organizer
                     - u.intermediate_rating_as_organizer / NULLIF(u.count_period_meetings_as_organizer, 0)
                     + NEW.rating_after_end / NULLIF(u.count_period_meetings_as_organizer, 0))
                ELSE
                    u.intermediate_rating_as_organizer
            END
    WHERE u.user_id = NEW.creator_user_id
      AND u.record_id = (
            -- Обновляем только самую свежую статистику организатора
            SELECT record_id
            FROM user_extra_info_table_3 x
            WHERE x.user_id = NEW.creator_user_id
            ORDER BY x.date_of_stats DESC, x.record_id DESC
            LIMIT 1
      );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_organizer_ratings_after_meeting
AFTER UPDATE OF rating_after_end, count_of_ratings
ON meeting_table_2
FOR EACH ROW
-- Триггер сработает только если статус finished И хотя бы одно из двух полей реально изменилось
WHEN (
    NEW.status = 'finished' 
    AND (
        OLD.rating_after_end IS DISTINCT FROM NEW.rating_after_end
        OR OLD.count_of_ratings IS DISTINCT FROM NEW.count_of_ratings
    )
)
EXECUTE FUNCTION update_organizer_ratings_after_meeting_update();

-------------------------------------------------------------------------------

-- Триггер #8: если в таблице meeting_table_2
-- статус встречи стал finished, 
-- то у всех пользоватлей кто связан с этой встречью
-- в табл 8(даже если missed) то списывается 1 встреча из поля
-- earned_currency из табл user_extra_info_table_3

CREATE OR REPLACE FUNCTION trg_meeting_finished_debit_currency()
RETURNS TRIGGER AS
$$
BEGIN
    -- Срабатываем только когда статус стал 'finished'
    IF NEW.status = 'finished' AND OLD.status IS DISTINCT FROM 'finished' THEN

        UPDATE user_extra_info_table_3 uei
        SET meetings_as_currency = GREATEST(uei.meetings_as_currency - 1, 0)
        WHERE uei.record_id IN (
            SELECT DISTINCT ON (x.user_id) x.record_id
            FROM user_extra_info_table_3 x
            JOIN meeting_rating_table_8 mr
              ON mr.user_id = x.user_id
            WHERE mr.meeting_id = NEW.meeting_id
            ORDER BY x.user_id, x.date_of_stats DESC, x.record_id DESC
        );

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Сам триггер
CREATE TRIGGER trg_meeting_finished_debit_currency
AFTER UPDATE OF status ON meeting_table_2
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION trg_meeting_finished_debit_currency();

-------------------------------------------------------------------------------

-- Триггер #9: перед вставкой в табл 8
-- meeting_rating_table_8 мы проверяем кол-во уже
-- людей имеющих статус registered на данную встречу
-- и если их кол-во не превышает max_people в табл 
-- meeting_table_2 то вставка разрешена

CREATE OR REPLACE FUNCTION check_max_people()
RETURNS TRIGGER AS $$
DECLARE
    current_count INT;
    max_allowed INT;
BEGIN
    -- Считаем текущее кол-во зарегистрированных
    SELECT COUNT(*) INTO current_count
    FROM meeting_rating_table_8
    WHERE meeting_id = NEW.meeting_id
      AND user_action = 'registered';

    -- Берём лимит из meeting_table_2
    SELECT max_people INTO max_allowed
    FROM meeting_table_2
    WHERE meeting_id = NEW.meeting_id;

    IF current_count >= max_allowed THEN
        RAISE EXCEPTION 'Мест нет: встреча % заполнена', NEW.meeting_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_max_people
BEFORE INSERT ON meeting_rating_table_8
FOR EACH ROW
WHEN (NEW.user_action = 'registered')
EXECUTE FUNCTION check_max_people();

-------------------------------------------------------------------------------

-- Триггер #10: при регистрации пользователя на встречу (user_action='registered')
-- создает уведомление для пользователя в таблице user_notifications_table_5
-- notification_id берется из notifications_table_4 по meeting_id (самое раннее)

CREATE OR REPLACE FUNCTION create_notification_on_registration()
RETURNS trigger AS $$
DECLARE
    v_notification_id BIGINT;
BEGIN
    -- Находим самое раннее уведомление для этой встречи
    SELECT notification_id INTO v_notification_id
    FROM notifications_table_4
    WHERE meeting_id = NEW.meeting_id
    ORDER BY created_at ASC
    LIMIT 1;

    -- Если уведомление найдено, создаем запись для пользователя
    IF v_notification_id IS NOT NULL THEN
        INSERT INTO user_notifications_table_5 (notification_id, user_id, status)
        VALUES (v_notification_id, NEW.user_id, 'unread')
        ON CONFLICT (notification_id, user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_notification_on_registration
AFTER INSERT ON meeting_rating_table_8
FOR EACH ROW
WHEN (NEW.user_action = 'registered')
EXECUTE FUNCTION create_notification_on_registration();

-------------------------------------------------------------------------------

-- Триггер #11: при отмене записи пользователем (изменение user_action с 'registered' на 'missed')
-- создает уведомление в таблице notifications_table_4 и связывает его с пользователем

CREATE OR REPLACE FUNCTION create_notification_on_cancel()
RETURNS trigger AS $$
DECLARE
    v_notification_id BIGINT;
    v_meeting_title TEXT;
BEGIN
    -- Проверяем что статус изменился с 'registered' на 'missed'
    IF OLD.user_action = 'registered' AND NEW.user_action = 'missed' THEN
        -- Получаем название встречи
        SELECT title INTO v_meeting_title
        FROM meeting_table_2
        WHERE meeting_id = NEW.meeting_id;

        -- Создаем уведомление в notifications_table_4
        INSERT INTO notifications_table_4 (meeting_id, notification_type, notification_text)
        VALUES (
            NEW.meeting_id,
            'вы отменили',
            'Вы отменили запись на встречу'
        )
        RETURNING notification_id INTO v_notification_id;

        -- Связываем уведомление с пользователем
        INSERT INTO user_notifications_table_5 (notification_id, user_id, status)
        VALUES (v_notification_id, NEW.user_id, 'unread')
        ON CONFLICT (notification_id, user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_notification_on_cancel
AFTER UPDATE OF user_action ON meeting_rating_table_8
FOR EACH ROW
WHEN (OLD.user_action = 'registered' AND NEW.user_action = 'missed')
EXECUTE FUNCTION create_notification_on_cancel();

-------------------------------------------------------------------------------

-- Триггер #12: при отмене встречи организатором (изменение status на 'canceled')
-- создает 2 типа уведомлений:
-- 1. Для организатора: "Вы отменили встречу..."
-- 2. Для участников со статусом 'registered': "Мы сожалеем, но встреча..."

CREATE OR REPLACE FUNCTION create_notification_on_meeting_canceled()
RETURNS trigger AS $$
DECLARE
    v_notification_id_org BIGINT;
    v_notification_id_users BIGINT;
    v_user_id BIGINT;
BEGIN
    -- Проверяем что статус изменился на 'canceled'
    IF NEW.status = 'canceled' AND OLD.status IS DISTINCT FROM 'canceled' THEN
        
        -- 1. Создаем уведомление для организатора
        INSERT INTO notifications_table_4 (meeting_id, notification_type, notification_text)
        VALUES (
            NEW.meeting_id,
            'организатор отменил',
            'Вы отменили встречу "' || NEW.title || '", которая должна была пройти с ' || 
            TO_CHAR(NEW.start_at, 'DD.MM.YYYY HH24:MI') || ' по ' || 
            TO_CHAR(NEW.end_at, 'DD.MM.YYYY HH24:MI') || 
            '. Мы очень сожалеем, что у вас не получилось провести встречу.'
        )
        RETURNING notification_id INTO v_notification_id_org;
        
        -- Связываем уведомление с организатором
        INSERT INTO user_notifications_table_5 (notification_id, user_id, status)
        VALUES (v_notification_id_org, NEW.creator_user_id, 'unread')
        ON CONFLICT (notification_id, user_id) DO NOTHING;
        
        -- 2. Создаем уведомление для участников (только один раз)
        INSERT INTO notifications_table_4 (meeting_id, notification_type, notification_text)
        VALUES (
            NEW.meeting_id,
            'встреча отменена организатором',
            'Мы сожалеем, но встреча "' || NEW.title || '", которая должна была пройти с ' || 
            TO_CHAR(NEW.start_at, 'DD.MM.YYYY HH24:MI') || ' по ' || 
            TO_CHAR(NEW.end_at, 'DD.MM.YYYY HH24:MI') || 
            ', была отменена организатором. Приносим извинения.'
        )
        RETURNING notification_id INTO v_notification_id_users;
        
        -- Связываем уведомление со всеми участниками со статусом 'registered'
        INSERT INTO user_notifications_table_5 (notification_id, user_id, status)
        SELECT 
            v_notification_id_users,
            mrt.user_id,
            'unread'
        FROM meeting_rating_table_8 mrt
        WHERE mrt.meeting_id = NEW.meeting_id
          AND mrt.user_action = 'registered'
        ON CONFLICT (notification_id, user_id) DO NOTHING;
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_notification_on_meeting_canceled
AFTER UPDATE OF status ON meeting_table_2
FOR EACH ROW
WHEN (NEW.status = 'canceled' AND OLD.status IS DISTINCT FROM 'canceled')
EXECUTE FUNCTION create_notification_on_meeting_canceled();

-------------------------------------------------------------------------------

-- Триггер #13: при завершении встречи организатором (изменение status на 'in_progress')
-- создает уведомление для организатора о необходимости отметить участников

-- Сначала удаляем старый триггер если есть
DROP TRIGGER IF EXISTS trg_create_notification_on_meeting_finished ON meeting_table_2;

CREATE OR REPLACE FUNCTION create_notification_on_meeting_finished()
RETURNS trigger AS $$
DECLARE
    v_notification_id BIGINT;
BEGIN
    -- Проверяем что статус изменился на 'in_progress' (организатор нажал "Завершить встречу")
    -- и предыдущий статус был 'created' (не 'in_progress' уже)
    IF NEW.status = 'in_progress' AND OLD.status = 'created' THEN
        
        -- Создаем уведомление для организатора
        INSERT INTO notifications_table_4 (meeting_id, notification_type, notification_text)
        VALUES (
            NEW.meeting_id,
            'завершение встречи для организатора',
            'Встреча "' || NEW.title || '", проведенная Вами с ' || 
            TO_CHAR(NEW.start_at, 'DD.MM.YYYY HH24:MI') || ' до ' || 
            TO_CHAR(NEW.end_at, 'DD.MM.YYYY HH24:MI') || 
            ' завершена! Теперь отметьте тех, кто на ней был из списка зарегистрированных, а затем оцените их как собеседников по шкале от 1 до 10, где 1 - ужасный собеседник, а 10 - прекрасный человек, объект для подражания, есть чему поучиться!'
        )
        RETURNING notification_id INTO v_notification_id;
        
        -- Связываем уведомление с организатором
        INSERT INTO user_notifications_table_5 (notification_id, user_id, status)
        VALUES (v_notification_id, NEW.creator_user_id, 'unread')
        ON CONFLICT (notification_id, user_id) DO NOTHING;
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер без условия WHEN - проверка внутри функции
CREATE TRIGGER trg_create_notification_on_meeting_finished
AFTER UPDATE OF status ON meeting_table_2
FOR EACH ROW
EXECUTE FUNCTION create_notification_on_meeting_finished();


--------------------------------------------------------------------------------
-- Триггер #14: при изменении голосов в конфликте (conflict_table_7)
-- автоматически меняет статус конфликта на 'yes' или 'no'
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_conflict_status_on_vote()
RETURNS trigger AS $$
BEGIN
    -- Срабатываем только если конфликт еще в статусе 'in_progress'
    IF NEW.status = 'in_progress' THEN
        -- Условие 1: "за" набрало больше 50% от total_allowed_to_vote
        IF NEW.voted_for_count > 0.5 * NEW.total_allowed_to_vote THEN
            NEW.status := 'yes';
            NEW.finished_at := NOW();
        
        -- Условие 2: даже если все оставшиеся проголосуют "за",
        -- не наберется 50% (то есть максимум "за" <= 50%)
        ELSIF (NEW.total_allowed_to_vote - NEW.total_voted) + NEW.voted_for_count <= 0.5 * NEW.total_allowed_to_vote THEN
            NEW.status := 'no';
            NEW.finished_at := NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_conflict_status_on_vote
BEFORE UPDATE ON conflict_table_7
FOR EACH ROW
EXECUTE FUNCTION update_conflict_status_on_vote();


--------------------------------------------------------------------------------
-- Триггер #15: при изменении статуса конфликта на 'yes'
-- меняем user_action с 'missedbyorg' на 'attended' в meeting_rating_table_8
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_user_action_on_conflict_yes()
RETURNS trigger AS $$
BEGIN
    IF NEW.status = 'yes' AND OLD.status = 'in_progress' THEN
        UPDATE meeting_rating_table_8
        SET user_action = 'attended'
        WHERE meeting_id = NEW.meeting_id
          AND user_id = NEW.user_id
          AND user_action = 'missedbyorg';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_user_action_on_conflict_yes
AFTER UPDATE ON conflict_table_7
FOR EACH ROW
EXECUTE FUNCTION update_user_action_on_conflict_yes();


--------------------------------------------------------------------------------
-- Триггер #16: при изменении статуса конфликта на 'no'
-- меняем user_action с 'missedbyorg' на 'missed' в meeting_rating_table_8
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_user_action_on_conflict_no()
RETURNS trigger AS $$
BEGIN
    IF NEW.status = 'no' AND OLD.status = 'in_progress' THEN
        UPDATE meeting_rating_table_8
        SET user_action = 'missed'
        WHERE meeting_id = NEW.meeting_id
          AND user_id = NEW.user_id
          AND user_action = 'missedbyorg';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_user_action_on_conflict_no
AFTER UPDATE ON conflict_table_7
FOR EACH ROW
EXECUTE FUNCTION update_user_action_on_conflict_no();