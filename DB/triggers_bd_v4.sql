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

CREATE OR REPLACE FUNCTION update_meeting_rating_after_insert()
RETURNS trigger AS $$
BEGIN
    -- Обновляем агрегаты по конкретному meeting_id
    UPDATE meeting_table_2 m
    SET 
        rating_after_end = 
            (m.rating_after_end * m.count_of_ratings + NEW.meeting_rating)
            / (m.count_of_ratings + 1),
        count_of_ratings = m.count_of_ratings + 1
    WHERE m.meeting_id = NEW.meeting_id;

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
