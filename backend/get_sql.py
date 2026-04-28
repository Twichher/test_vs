import psycopg
from psycopg.rows import dict_row

from important_info import DSN
from models import MeetingTypeOne

#------------------------------------------------------------------------------------------------------
#roots to FAQ
#------------------------------------------------------------------------------------------------------


# функция выводит все записи и все поля из таблицы faq_table_18(или просто FAQ)
def FAQ_get_all_rows(): 
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT 
                    question_id, 
                    question_text, 
                    question_answer
                FROM faq_table_18
                ORDER BY question_id;

                """)
                return cur.fetchall()
    except Exception as error:
        return (False, error, "FAQ_get_all_rows")
    

#------------------------------------------------------------------------------------------------------
#roots to MEETINGS
#------------------------------------------------------------------------------------------------------
    

# выводим встречи для главной страницы, по нажатию кнопки "Встречи" 
def MEETINGS_get_created_lsit(district : str):
    try: 
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT
                    m.meeting_id,
                    m.title AS meeting_title,
                    COALESCE(r.registered_users_count, 0) AS registered_users_count,
                    m.max_people AS max_people_allowed,
                    m.district,
                    m.adults_only AS adults_only_18plus,
                    COALESCE(c.category_ids, '{}') AS category_ids,
                    m.start_at AS start_at,
                    m.end_at AS end_at,
                    m.creator_user_id
                FROM meeting_table_2 m

                LEFT JOIN (
                    SELECT meeting_id, COUNT(*) AS registered_users_count
                    FROM meeting_rating_table_8
                    WHERE user_action = 'registered'
                    GROUP BY meeting_id
                ) r ON r.meeting_id = m.meeting_id

                LEFT JOIN (
                    SELECT meeting_id, ARRAY_AGG(category_id) AS category_ids
                    FROM meeting_categories_table_11
                    GROUP BY meeting_id
                ) c ON c.meeting_id = m.meeting_id

                WHERE m.status = 'created'
                ORDER BY
                    CASE WHEN m.district = %s THEN 0 ELSE 1 END,
                    m.district,
                    m.meeting_id

                """, (district, ))

                return cur.fetchall()
    except Exception as error:
        return (False, error, "MEETINGS_get_created_lsit")
#print(MEETINGS_get_created_lsit("ЦАО"))


# не sql запрос! Просто сортирует некоторый массив данных по заданным параметрам
def MEETINGS_no_sql_sort_by_params(
    meetings: list,
    meeting_title: str = None,
    districts: list[str] = None,
    categories: list[int] = None,
    max_people: int = None
) -> list:
    result = meetings

    if meeting_title:
        result = [
            m for m in result
            if meeting_title.lower() in m.meeting_title.lower()
        ]

    if districts:
        result = [m for m in result if m.district in districts]

    if categories:
        result = [
            m for m in result
            if any(c in m.category_ids for c in categories)
        ]

    if max_people:
        result = [m for m in result if m.max_people_allowed <= max_people]

    return result


#print(MEETINGS_no_sql_sort_by_params([{'meeting_id': 3, 'meeting_title': 'Утренняя пробежка', 'registered_users_count': 4, 'max_people_allowed': 15, 'district': 'ЦАО', 'adults_only_18plus': False, 'category_ids': [5, 6]}, {'meeting_id': 7, 'meeting_title': 'api1', 'registered_users_count': 0, 'max_people_allowed': 10, 'district': 'ЦАО', 'adults_only_18plus': False, 'category_ids': []}, {'meeting_id': 8, 'meeting_title': 'api1', 'registered_users_count': 0, 'max_people_allowed': 10, 'district': 'ЦАО', 'adults_only_18plus': False, 'category_ids': []}, {'meeting_id': 9, 'meeting_title': 'api1', 'registered_users_count': 0, 'max_people_allowed': 10, 'district': 'api1', 'adults_only_18plus': True, 'category_ids': [1, 2, 3, 4]}, {'meeting_id': 10, 'meeting_title': 'api2', 'registered_users_count': 0, 'max_people_allowed': 10, 'district': 'api2', 'adults_only_18plus': True, 'category_ids': [1, 2]}, {'meeting_id': 1, 'meeting_title': 'Настольные игры', 'registered_users_count': 4, 'max_people_allowed': 8, 'district': 'НАО', 'adults_only_18plus': False, 'category_ids': [1, 2]}, {'meeting_id': 2, 'meeting_title': 'Винный вечер', 'registered_users_count': 5, 'max_people_allowed': 10, 'district': 'ТАО', 'adults_only_18plus': True, 'category_ids': [3, 4]}],
#                                     categories = [1]))


# фукнция выводит всю информацию о встрече, на которую нажал пользователь
# на главной странице (то есть по id)
def MEETINGS_get_all_info(meeting_id : int):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT
                    m.meeting_id,
                    m.status,
                    m.title                  AS meeting_title,
                    m.start_at               AS meeting_start_at,
                    m.end_at AS meeting_end_at,
                    m.creator_user_id,
                    u.first_name             AS creator_first_name,
                    u.last_name              AS creator_last_name,
                    COALESCE(r.registered_users_count, 0) AS registered_users_count,
                    m.max_people,
                    m.district,
                    m.adults_only,
                    m.description            AS meeting_description,
                    COALESCE(w.warnings, '') AS warnings
                FROM meeting_table_2 m

                -- Создатель встречи
                JOIN user_table_1 u
                    ON u.user_id = m.creator_user_id

                -- Количество зарегистрированных
                LEFT JOIN (
                    SELECT meeting_id, COUNT(*) AS registered_users_count
                    FROM meeting_rating_table_8
                    WHERE user_action = 'registered'
                    GROUP BY meeting_id
                ) r ON r.meeting_id = m.meeting_id

                -- Предупреждения
                LEFT JOIN (
                    SELECT mw.meeting_id,
                        STRING_AGG(w.warning_name, ', ' ORDER BY w.warning_name) AS warnings
                    FROM meeting_warnings_table_21 mw
                    JOIN warnings_table_13 w ON w.warning_id = mw.warning_id
                    GROUP BY mw.meeting_id
                ) w ON w.meeting_id = m.meeting_id

                WHERE m.status IN ('created', 'in_progress')
                AND m.meeting_id = %s;


                """, (meeting_id,))
                return cur.fetchone()
    except Exception as error:
        return (False, error, "MEETINGS_get_all_info")
#print(MEETINGS_get_all_info(3))


# выводим информацию о встрече в профиле для записей(встречи где поль-ль учавствует), всю информацию, включая адрес
def MEETINGS_reged_get_all_info(meeting_id : int):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                                SELECT
                    m.meeting_id,
                    m.status,
                    m.title                  AS meeting_title,
                    m.start_at               AS meeting_start_at,
                    m.end_at               AS meeting_end_at,
                    m.creator_user_id,
                    u.first_name             AS creator_first_name,
                    u.last_name              AS creator_last_name,
                    COALESCE(r.registered_users_count, 0) AS registered_users_count,
                    m.max_people,
                    m.district,
                    m.adults_only,
                    m.description            AS meeting_description,
                    COALESCE(w.warnings, '') AS warnings,
                    m.city AS meeting_city,
                    m.address AS meeting_adress
                FROM meeting_table_2 m

                -- Создатель встречи
                JOIN user_table_1 u
                    ON u.user_id = m.creator_user_id

                -- Количество зарегистрированных
                LEFT JOIN (
                    SELECT meeting_id, COUNT(*) AS registered_users_count
                    FROM meeting_rating_table_8
                    WHERE user_action = 'registered'
                    GROUP BY meeting_id
                ) r ON r.meeting_id = m.meeting_id

                -- Предупреждения
                LEFT JOIN (
                    SELECT mw.meeting_id,
                        STRING_AGG(w.warning_name, ', ' ORDER BY w.warning_name) AS warnings
                    FROM meeting_warnings_table_21 mw
                    JOIN warnings_table_13 w ON w.warning_id = mw.warning_id
                    GROUP BY mw.meeting_id
                ) w ON w.meeting_id = m.meeting_id

                WHERE m.status IN ('created', 'in_progress')
                AND m.meeting_id = %s;

                """, (meeting_id, ))
                return cur.fetchone()
    except Exception as error:
        return (False, error, "MEETINGS_reged_get_all_info")
    

# выводим информацию о встрече в профиле для записей(встречи где поль-ль учавствовал или встречи со статусом canceled), всю информацию, включая адрес
def MEETINGS_atted_get_all_info(meeting_id : int):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                                SELECT
                    m.meeting_id,
                    m.status,
                    m.title                  AS meeting_title,
                    m.start_at               AS meeting_start_at,
                    m.end_at               AS meeting_end_at,
                    m.creator_user_id,
                    u.first_name             AS creator_first_name,
                    u.last_name              AS creator_last_name,
                    COALESCE(
                        CASE 
                            WHEN m.status = 'canceled' THEN registered_users.users_count
                            ELSE attended_users.users_count
                        END, 
                        0
                    ) AS registered_users_count,
                    m.max_people,
                    m.district,
                    m.adults_only,
                    m.description            AS meeting_description,
                    COALESCE(w.warnings, '') AS warnings,
                    m.city AS meeting_city,
                    m.address AS meeting_adress
                FROM meeting_table_2 m

                -- Создатель встречи
                JOIN user_table_1 u
                    ON u.user_id = m.creator_user_id

                -- Для canceled встреч: считаем только registered
                LEFT JOIN (
                    SELECT meeting_id, COUNT(*) AS users_count
                    FROM meeting_rating_table_8
                    WHERE user_action = 'registered'
                    GROUP BY meeting_id
                ) registered_users ON registered_users.meeting_id = m.meeting_id AND m.status = 'canceled'

                -- Для finished встреч: считаем attended
                LEFT JOIN (
                    SELECT meeting_id, COUNT(*) AS users_count
                    FROM meeting_rating_table_8
                    WHERE user_action = 'attended'
                    GROUP BY meeting_id
                ) attended_users ON attended_users.meeting_id = m.meeting_id AND m.status = 'finished'

                -- Предупреждения
                LEFT JOIN (
                    SELECT mw.meeting_id,
                        STRING_AGG(w.warning_name, ', ' ORDER BY w.warning_name) AS warnings
                    FROM meeting_warnings_table_21 mw
                    JOIN warnings_table_13 w ON w.warning_id = mw.warning_id
                    GROUP BY mw.meeting_id
                ) w ON w.meeting_id = m.meeting_id

                WHERE m.meeting_id = %s;

                """, (meeting_id, ))
                return cur.fetchone()
    except Exception as error:
        return (False, error, "MEETINGS_atted_get_all_info")   


# по id встречи выводим список всех пользователей кто на нее зареган и кто от нее отписался
def MEETINGS_get_reged_missed_users(meeting_id : int):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT 
                    u.user_id,
                    u.first_name,
                    u.last_name,
                    u.is_organizer,
                    mr.user_action,
                    (
                        SELECT photo_url 
                        FROM user_photos_table_14
                        WHERE user_id = u.user_id
                        ORDER BY uploaded_at DESC
                        LIMIT 1
                    ) AS photo_url
                FROM meeting_rating_table_8 mr
                JOIN user_table_1 u ON u.user_id = mr.user_id
                WHERE mr.meeting_id = %s
                AND mr.user_action IN ('registered', 'missed', 'missedbyorg')
                ORDER BY u.last_name, u.first_name;


                """, (meeting_id, ))

                return cur.fetchall()
    except Exception as error:
        return (False, error, "MEETINGS_get_reged_missed_users")


# по id встречи выводим список всех пользователей кто на нее зареган (только со статусом registered)
def MEETINGS_get_registered_users_only(meeting_id : int):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT 
                    u.user_id,
                    u.first_name,
                    u.last_name,
                    u.is_organizer,
                    mr.user_action,
                    (
                        SELECT photo_url 
                        FROM user_photos_table_14
                        WHERE user_id = u.user_id
                        ORDER BY uploaded_at DESC
                        LIMIT 1
                    ) AS photo_url
                FROM meeting_rating_table_8 mr
                JOIN user_table_1 u ON u.user_id = mr.user_id
                WHERE mr.meeting_id = %s
                AND mr.user_action = 'registered'
                ORDER BY u.last_name, u.first_name;

                """, (meeting_id, ))

                return cur.fetchall()
    except Exception as error:
        return (False, error, "MEETINGS_get_registered_users_only")
    

# по id встречи выводим тех кто был на завершенной встречи и тех кто пропустил ее
# для canceled встреч выводим registered и missed (attended быть не может)
def MEETINGS_get_atted_missed_users(meeting_id : int):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT 
                    u.user_id,
                    u.first_name,
                    u.last_name,
                    u.is_organizer,
                    mr.user_action,
                    (
                        SELECT photo_url 
                        FROM user_photos_table_14
                        WHERE user_id = u.user_id
                        ORDER BY uploaded_at DESC
                        LIMIT 1
                    ) AS photo_url
                FROM meeting_rating_table_8 mr
                JOIN user_table_1 u ON u.user_id = mr.user_id
                JOIN meeting_table_2 m ON m.meeting_id = mr.meeting_id
                WHERE mr.meeting_id = %s
                AND (
                    (m.status = 'canceled' AND mr.user_action IN ('registered', 'missed', 'missedbyorg'))
                    OR (m.status != 'canceled' AND mr.user_action IN ('attended', 'missed', 'missedbyorg'))
                )
                ORDER BY u.last_name, u.first_name;
        
                """, (meeting_id, ))
                return cur.fetchall()
    except Exception as error:
        return (False, error, "MEETINGS_get_atted_missed_users")

#------------------------------------------------------------------------------------------------------
#roots to USERS
#------------------------------------------------------------------------------------------------------


#фукнция должна вернуть true если пароль и логи правильны, то есть фукнция логина 
def USERS_check_login(email_user: str, password: str):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT 
                    u.user_id,
                    u.first_name,
                    u.last_name,
                    u.district,
                    u.is_blocked,
                    u.is_organizer,
                    u.is_admin,
                    u.is_registration_completed,
                    x.meetings_as_currency
                FROM user_table_1 u
                JOIN (
                    SELECT DISTINCT ON (user_id)
                        user_id,
                        meetings_as_currency
                    FROM user_extra_info_table_3
                    ORDER BY user_id, record_id DESC
                ) x ON x.user_id = u.user_id
                WHERE u.email = %s AND u.password_hash = crypt(%s, u.password_hash);

                """, (email_user, password))
                return cur.fetchall()[0]
    except Exception as error:
        return (False, error, "USERS_check_login")

#print(USERS_check_login('user01@example.com', 'Pass!User001'))


# функция получения инф-ии о пользователе по id.
def USERS_get_info_by_id(user_id : int):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT 
                    u.user_id,
                    u.first_name,
                    u.last_name,
                    u.district,
                    u.is_blocked,
                    u.is_organizer,
                    u.is_admin,
                    u.is_registration_completed,
                    x.meetings_as_currency
                FROM user_table_1 u
                JOIN (
                    SELECT DISTINCT ON (user_id)
                        user_id,
                        meetings_as_currency
                    FROM user_extra_info_table_3
                    ORDER BY user_id, record_id DESC
                ) x ON x.user_id = u.user_id
                WHERE u.user_id = %s;

                """, (user_id, ))
                return cur.fetchall()[0]
    except Exception as error:
        return (False, error, "USERS_get_info_by_id")


# получаем всю статистику о пользователе по id кроме earned_currency
def USERS_get_all_stats_by_id(user_id : int):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT 
                    uei.meetings_visited_as_guest, 
                    uei.count_period_meetings_guest,
                    uei.rating_as_guest,
                    uei.count_all_rating_guest,
                    uei.intermediate_rating_as_guest,
                    uei.count_period_rating_guest,
                    
                    uei.meetings_created_as_organizer,
                    uei.rating_as_organizer,                
                    uei.count_period_meetings_as_organizer,
                    uei.intermediate_rating_as_organizer,

                    COALESCE(
                        (SELECT ARRAY_AGG(photo_url ORDER BY uploaded_at ASC)
                        FROM user_photos_table_14
                        WHERE user_id = %s),
                        ARRAY[]::TEXT[]
                    ) AS photo_urls

                FROM user_extra_info_table_3 uei
                WHERE uei.user_id = %s
                ORDER BY uei.record_id DESC
                LIMIT 1;


                """, (user_id, user_id))

                return cur.fetchone()
    except Exception as error:
        return (False, error, "USERS_get_all_stats_by_id")

# получаем id встреч на которые пользователь зарегистрирован
def USERS_get_reged_meetings(user_id: int):
    try:
        with psycopg.connect(DSN) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT mrt.meeting_id
                    FROM meeting_rating_table_8 mrt
                    JOIN meeting_table_2 mt ON mrt.meeting_id = mt.meeting_id
                    WHERE mt.status = 'created'
                      AND mrt.user_action IN ('registered' , 'missed')
                      AND mrt.user_id = %s;
                """, (user_id,))
                return [row[0] for row in cur.fetchall()]  # ← распаковка
    except Exception as error:
        return (False, error, "USERS_get_reged_meetings")

# получаем краткую информацию о встречах на которые пользователь записан
def USERS_get_MEETINGS_info_reged(user_id : int):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT
                    m.meeting_id,
                    m.title AS meeting_title,
                    COALESCE(r.registered_users_count, 0) AS registered_users_count,
                    m.max_people AS max_people_allowed,
                    m.district,
                    m.adults_only AS adults_only_18plus,
                    m.start_at AS start_at,
                    m.end_at AS end_at,
                    COALESCE(c.category_ids, '{}') AS category_ids,
                    m.creator_user_id,
                    m.status
                FROM meeting_table_2 m

                -- Фильтр: только встречи где записан конкретный пользователь
                JOIN meeting_rating_table_8 ur
                    ON ur.meeting_id = m.meeting_id
                    AND ur.user_id = %s
                    AND ur.user_action = 'registered'

                LEFT JOIN (
                    SELECT meeting_id, COUNT(*) AS registered_users_count
                    FROM meeting_rating_table_8
                    WHERE user_action = 'registered'
                    GROUP BY meeting_id
                ) r ON r.meeting_id = m.meeting_id

                LEFT JOIN (
                    SELECT meeting_id, ARRAY_AGG(category_id) AS category_ids
                    FROM meeting_categories_table_11
                    GROUP BY meeting_id
                ) c ON c.meeting_id = m.meeting_id

                WHERE m.status IN ('created', 'in_progress')
                ORDER BY m.meeting_id;

                """, (user_id,))

                return cur.fetchall()
    except Exception as error:
        return (False, error, "USERS_get_MEETINGS_info_reged")

# получаем краткую инф-ю о встречах в истории пользователя
# Логика:
# - attended: всегда в истории (серый)
# - missed: всегда в истории (красный)
# - registered: только если встреча canceled (черный)
def USERS_get_MEETINGS_info_finished(user_id : int):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT
                    m.meeting_id,
                    m.title AS meeting_title,
                    COALESCE(
                        CASE 
                            WHEN m.status = 'canceled' THEN canceled_users.users_count
                            WHEN m.status = 'finished' THEN finished_users.users_count
                            ELSE active_users.users_count
                        END, 
                        0
                    ) AS registered_users_count,
                    m.max_people AS max_people_allowed,
                    m.district,
                    m.adults_only AS adults_only_18plus,
                    m.start_at AS start_at,
                    m.end_at AS end_at,
                    m.status AS status,
                    ur.user_action AS user_action,
                    COALESCE(c.category_ids, '{}') AS category_ids,
                    m.creator_user_id
                FROM meeting_table_2 m

                -- Все встречи где пользователь имеет запись
                JOIN meeting_rating_table_8 ur
                    ON ur.meeting_id = m.meeting_id
                    AND ur.user_id = %s
                    AND (
                        -- attended/missed: всегда в истории
                        ur.user_action IN ('attended', 'missed', 'missedbyorg')
                        -- registered: только если встреча отменена
                        OR (ur.user_action = 'registered' AND m.status = 'canceled')
                    )

                -- Для canceled встреч: считаем только registered
                LEFT JOIN (
                    SELECT meeting_id, COUNT(*) AS users_count
                    FROM meeting_rating_table_8
                    WHERE user_action = 'registered'
                    GROUP BY meeting_id
                ) canceled_users ON canceled_users.meeting_id = m.meeting_id AND m.status = 'canceled'

                -- Для finished встреч: считаем attended
                LEFT JOIN (
                    SELECT meeting_id, COUNT(*) AS users_count
                    FROM meeting_rating_table_8
                    WHERE user_action = 'attended'
                    GROUP BY meeting_id
                ) finished_users ON finished_users.meeting_id = m.meeting_id AND m.status = 'finished'

                -- Для активных встреч (created/in_progress) где user missed: считаем registered
                LEFT JOIN (
                    SELECT meeting_id, COUNT(*) AS users_count
                    FROM meeting_rating_table_8
                    WHERE user_action = 'registered'
                    GROUP BY meeting_id
                ) active_users ON active_users.meeting_id = m.meeting_id AND m.status IN ('created', 'in_progress')

                LEFT JOIN (
                    SELECT meeting_id, ARRAY_AGG(category_id) AS category_ids
                    FROM meeting_categories_table_11
                    GROUP BY meeting_id
                ) c ON c.meeting_id = m.meeting_id

                ORDER BY m.meeting_id;

                """, (user_id,))
                return cur.fetchall()
    except Exception as error:
        return (False, error, "USERS_get_MEETINGS_info_finished")


# получаем данные пользователя для страницы настроек
def USERS_get_settings_info(user_id: int):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                SELECT 
                    u.first_name,
                    u.last_name,
                    u.birth_date,
                    u.gender,
                    u.district,
                    u.email
                FROM user_table_1 u
                WHERE u.user_id = %s;
                """, (user_id,))
                result = cur.fetchone()
                return result
    except Exception as error:
        return (False, error, "USERS_get_settings_info")


#------------------------------------------------------------------------------------------------------
#roots to CATEGORIES
#------------------------------------------------------------------------------------------------------

# возвращаем все категории которые есть в таблице categories_table_10
def CATEGORIES_get_all():
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT category_id, category_name FROM categories_table_10;
                
                """)

                return cur.fetchall()

    except Exception as error:
        return (False, error, "CATEGORIES_get_all")
    
#print(CATEGORIES_get_all())


#------------------------------------------------------------------------------------------------------
#roots to Stats
#------------------------------------------------------------------------------------------------------

# Параметры: rating_type='overall', user_type='guest', district=None (все районы) или конкретный район
# Возвращает статистику для визитеров по общему рейтингу
def STATS_get_guests_overall(district: str = None):
    """
    Параметры:
    - district: фильтр по району (None = все районы, или строка типа 'ЦАО')
    Возвращает:
    - user_id, first_name, last_name, district
    - meetings_count: meetings_visited_as_guest (всего встреч)
    - ratings_count: count_all_rating_guest (всего оценок)
    - rating: rating_as_guest (общий рейтинг)
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                # Берем только последнюю запись для каждого пользователя
                cur.execute("""
                WITH latest_stats AS (
                    SELECT DISTINCT ON (user_id)
                        user_id,
                        meetings_visited_as_guest AS meetings_count,
                        count_all_rating_guest AS ratings_count,
                        rating_as_guest AS rating
                    FROM user_extra_info_table_3
                    ORDER BY user_id, record_id DESC
                )
                SELECT 
                    u.user_id,
                    u.first_name,
                    u.last_name,
                    u.district,
                    ls.meetings_count,
                    ls.ratings_count,
                    ls.rating
                FROM user_table_1 u
                JOIN latest_stats ls ON ls.user_id = u.user_id
                WHERE (%s::text IS NULL OR %s::text = '' OR u.district = %s::text)
                AND u.is_blocked = FALSE
                ORDER BY ls.rating DESC, ls.meetings_count DESC;
                """, (district, district, district))
                return cur.fetchall()
    except Exception as error:
        return (False, error, "STATS_get_guests_overall")


# Параметры: rating_type='intermediate', user_type='guest', district=None или конкретный район
# Возвращает статистику для визитеров по промежуточному рейтингу
def STATS_get_guests_intermediate(district: str = None):
    """
    Параметры:
    - district: фильтр по району (None = все районы)
    Возвращает:
    - user_id, first_name, last_name, district
    - meetings_count: count_period_meetings_guest (встречи в промежуточный период)
    - ratings_count: count_period_rating_guest (оценки в промежуточный период)
    - rating: intermediate_rating_as_guest (промежуточный рейтинг)
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                WITH latest_stats AS (
                    SELECT DISTINCT ON (user_id)
                        user_id,
                        count_period_meetings_guest AS meetings_count,
                        count_period_rating_guest AS ratings_count,
                        intermediate_rating_as_guest AS rating
                    FROM user_extra_info_table_3
                    ORDER BY user_id, record_id DESC
                )
                SELECT 
                    u.user_id,
                    u.first_name,
                    u.last_name,
                    u.district,
                    ls.meetings_count,
                    ls.ratings_count,
                    ls.rating
                FROM user_table_1 u
                JOIN latest_stats ls ON ls.user_id = u.user_id
                WHERE (%s::text IS NULL OR %s::text = '' OR u.district = %s::text)
                AND u.is_blocked = FALSE
                ORDER BY ls.rating DESC, ls.meetings_count DESC;
                """, (district, district, district))
                return cur.fetchall()
    except Exception as error:
        return (False, error, "STATS_get_guests_intermediate")


# Параметры: rating_type='overall', user_type='organizer', district=None или конкретный район
# Возвращает статистику для организаторов по общему рейтингу
def STATS_get_organizers_overall(district: str = None):
    """
    Параметры:
    - district: фильтр по району (None = все районы)
    Возвращает:
    - user_id, first_name, last_name, district
    - meetings_count: meetings_created_as_organizer (всего создано встреч)
    - ratings_count: count_all_rating_organizer (всего оценок получено)
    - rating: rating_as_organizer (общий рейтинг)
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                WITH latest_stats AS (
                    SELECT DISTINCT ON (user_id)
                        user_id,
                        meetings_created_as_organizer AS meetings_count,
                        count_all_rating_organizer AS ratings_count,
                        rating_as_organizer AS rating
                    FROM user_extra_info_table_3
                    ORDER BY user_id, record_id DESC
                )
                SELECT 
                    u.user_id,
                    u.first_name,
                    u.last_name,
                    u.district,
                    ls.meetings_count,
                    ls.ratings_count,
                    ls.rating
                FROM user_table_1 u
                JOIN latest_stats ls ON ls.user_id = u.user_id
                WHERE (%s::text IS NULL OR %s::text = '' OR u.district = %s::text)
                AND u.is_organizer = TRUE
                AND u.is_blocked = FALSE
                ORDER BY ls.rating DESC, ls.meetings_count DESC;
                """, (district, district, district))
                return cur.fetchall()
    except Exception as error:
        return (False, error, "STATS_get_organizers_overall")


# Параметры: rating_type='intermediate', user_type='organizer', district=None или конкретный район
# Возвращает статистику для организаторов по промежуточному рейтингу
def STATS_get_organizers_intermediate(district: str = None):
    """
    Параметры:
    - district: фильтр по району (None = все районы)
    Возвращает:
    - user_id, first_name, last_name, district
    - meetings_count: count_period_meetings_as_organizer (встречи в промежуточный период)
    - ratings_count: count_period_rating_organizer (оценки в промежуточный период)
    - rating: intermediate_rating_as_organizer (промежуточный рейтинг)
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                WITH latest_stats AS (
                    SELECT DISTINCT ON (user_id)
                        user_id,
                        count_period_meetings_as_organizer AS meetings_count,
                        count_period_rating_organizer AS ratings_count,
                        intermediate_rating_as_organizer AS rating
                    FROM user_extra_info_table_3
                    ORDER BY user_id, record_id DESC
                )
                SELECT 
                    u.user_id,
                    u.first_name,
                    u.last_name,
                    u.district,
                    ls.meetings_count,
                    ls.ratings_count,
                    ls.rating
                FROM user_table_1 u
                JOIN latest_stats ls ON ls.user_id = u.user_id
                WHERE (%s::text IS NULL OR %s::text = '' OR u.district = %s::text)
                AND u.is_organizer = TRUE
                AND u.is_blocked = FALSE
                ORDER BY ls.rating DESC, ls.meetings_count DESC;
                """, (district, district, district))
                return cur.fetchall()
    except Exception as error:
        return (False, error, "STATS_get_organizers_intermediate")


#------------------------------------------------------------------------------------------------------
# roots to Profile
#------------------------------------------------------------------------------------------------------

def PROFILE_get_user_is_organizer(user_id: int):
    """
    Получает флаг is_organizer для пользователя из user_table_1
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                SELECT is_organizer 
                FROM user_table_1 
                WHERE user_id = %s;
                """, (user_id,))
                result = cur.fetchone()
                return result['is_organizer'] if result else False
    except Exception as error:
        return (False, error, "PROFILE_get_user_is_organizer")


#------------------------------------------------------------------------------------------------------
# roots to ORGANIZER meetings
#------------------------------------------------------------------------------------------------------

# получаем активные встречи организатора (status = 'created' или 'in_progress')
def ORGANIZER_get_active_meetings(user_id: int):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                SELECT
                    m.meeting_id,
                    m.title AS meeting_title,
                    COALESCE(r.registered_users_count, 0) AS registered_users_count,
                    m.max_people AS max_people_allowed,
                    m.district,
                    m.adults_only AS adults_only_18plus,
                    m.start_at AS start_at,
                    m.end_at AS end_at,
                    m.status AS status,
                    COALESCE(c.category_ids, '{}') AS category_ids,
                    m.creator_user_id
                FROM meeting_table_2 m
                
                LEFT JOIN (
                    SELECT meeting_id, COUNT(*) AS registered_users_count
                    FROM meeting_rating_table_8
                    WHERE user_action = 'registered'
                    GROUP BY meeting_id
                ) r ON r.meeting_id = m.meeting_id
                
                LEFT JOIN (
                    SELECT meeting_id, ARRAY_AGG(category_id) AS category_ids
                    FROM meeting_categories_table_11
                    GROUP BY meeting_id
                ) c ON c.meeting_id = m.meeting_id
                
                WHERE m.creator_user_id = %s
                AND m.status IN ('created', 'in_progress')
                ORDER BY m.start_at ASC;
                """, (user_id,))
                return cur.fetchall()
    except Exception as error:
        return (False, error, "ORGANIZER_get_active_meetings")


# получаем историю созданных встреч организатора (status = 'finished' или 'canceled')
def ORGANIZER_get_history_meetings(user_id: int):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                SELECT
                    m.meeting_id,
                    m.title AS meeting_title,
                    COALESCE(
                        CASE 
                            WHEN m.status = 'canceled' THEN registered_users.users_count
                            ELSE attended_users.users_count
                        END, 
                        0
                    ) AS registered_users_count,
                    m.max_people AS max_people_allowed,
                    m.district,
                    m.adults_only AS adults_only_18plus,
                    m.start_at AS start_at,
                    m.end_at AS end_at,
                    m.status AS status,
                    COALESCE(c.category_ids, '{}') AS category_ids,
                    m.creator_user_id
                FROM meeting_table_2 m
                
                -- Для canceled встреч: считаем только registered
                LEFT JOIN (
                    SELECT meeting_id, COUNT(*) AS users_count
                    FROM meeting_rating_table_8
                    WHERE user_action = 'registered'
                    GROUP BY meeting_id
                ) registered_users ON registered_users.meeting_id = m.meeting_id AND m.status = 'canceled'
                
                -- Для finished встреч: считаем attended
                LEFT JOIN (
                    SELECT meeting_id, COUNT(*) AS users_count
                    FROM meeting_rating_table_8
                    WHERE user_action = 'attended'
                    GROUP BY meeting_id
                ) attended_users ON attended_users.meeting_id = m.meeting_id AND m.status = 'finished'
                
                LEFT JOIN (
                    SELECT meeting_id, ARRAY_AGG(category_id) AS category_ids
                    FROM meeting_categories_table_11
                    GROUP BY meeting_id
                ) c ON c.meeting_id = m.meeting_id
                
                WHERE m.creator_user_id = %s
                AND m.status IN ('finished', 'canceled')
                ORDER BY m.end_at DESC;
                """, (user_id,))
                return cur.fetchall()
    except Exception as error:
        return (False, error, "ORGANIZER_get_history_meetings")


#------------------------------------------------------------------------------------------------------
# roots to Currency
#------------------------------------------------------------------------------------------------------

# получаем earned_currency для авторизованного пользователя
def USERS_get_earned_currency(user_id: int):
    """
    Получает earned_currency для пользователя.
    Проверка авторизации происходит на уровне endpoint.
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                SELECT 
                    uei.earned_currency
                FROM user_extra_info_table_3 uei
                WHERE uei.user_id = %s
                ORDER BY uei.record_id DESC
                LIMIT 1;
                """, (user_id,))
                result = cur.fetchone()
                return result['earned_currency'] if result else 0
    except Exception as error:
        return (False, error, "USERS_get_earned_currency")


#------------------------------------------------------------------------------------------------------
# roots to Meeting Basic Info
#------------------------------------------------------------------------------------------------------

def MEETINGS_get_basic_info(meeting_id: int):
    """
    Получает базовую информацию о встрече: meeting_id, creator_user_id, start_at, status.
    Используется для определения прав пользователя на странице встречи.
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                SELECT 
                    meeting_id,
                    creator_user_id,
                    start_at,
                    status
                FROM meeting_table_2
                WHERE meeting_id = %s;
                """, (meeting_id,))
                return cur.fetchone()
    except Exception as error:
        return (False, error, "MEETINGS_get_basic_info")


#------------------------------------------------------------------------------------------------------
# roots to Categories
#------------------------------------------------------------------------------------------------------

def CATEGORIES_get_all():
    """
    Получает список всех категорий встреч из таблицы categories_table_10.
    Возвращает: category_id, category_name, photo_url
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                SELECT 
                    category_id,
                    category_name,
                    photo_url
                FROM categories_table_10
                ORDER BY category_id;
                """)
                return cur.fetchall()
    except Exception as error:
        return (False, error, "CATEGORIES_get_all")


#------------------------------------------------------------------------------------------------------
# roots to Warnings
#------------------------------------------------------------------------------------------------------

def WARNINGS_get_all():
    """
    Получает список всех предупреждений из таблицы warnings_table_13.
    Возвращает: warning_id, warning_name, forAdults
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                SELECT 
                    warning_id,
                    warning_name,
                    foradults as "forAdults"
                FROM warnings_table_13
                ORDER BY warning_id;
                """)
                return cur.fetchall()
    except Exception as error:
        return (False, error, "WARNINGS_get_all")


#------------------------------------------------------------------------------------------------------
# roots to Meeting Creation
#------------------------------------------------------------------------------------------------------

def MEETINGS_create(
    creator_user_id: int,
    title: str,
    description: str,
    max_people: int,
    address: str,
    city: str,
    district: str,
    adults_only: bool,
    status: str,
    start_at: str,
    end_at: str
):
    """
    Создает новую встречу в таблице meeting_table_2.
    Возвращает meeting_id созданной встречи.
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
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
                    end_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                RETURNING meeting_id;
                """, (
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
                    end_at
                ))
                conn.commit()
                result = cur.fetchone()
                return result['meeting_id'] if result else None
    except Exception as error:
        return (False, error, "MEETINGS_create")


def NOTIFICATIONS_create(
    meeting_id: int,
    notification_type: str,
    notification_text: str
):
    """
    Создает новое уведомление в таблице notifications_table_4.
    Возвращает notification_id созданного уведомления.
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                INSERT INTO notifications_table_4 (
                    meeting_id,
                    notification_type,
                    notification_text
                ) VALUES (
                    %s, %s, %s
                )
                RETURNING notification_id;
                """, (
                    meeting_id,
                    notification_type,
                    notification_text
                ))
                conn.commit()
                result = cur.fetchone()
                return result['notification_id'] if result else None
    except Exception as error:
        return (False, error, "NOTIFICATIONS_create")


def NOTIFICATION_PHOTOS_create(
    notification_id: int,
    photo_url: str
):
    """
    Создает запись о фото уведомления в таблице notification_photos_table_6.
    Возвращает record_id созданной записи.
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                INSERT INTO notification_photos_table_6 (
                    notification_id,
                    photo_url
                ) VALUES (
                    %s, %s
                )
                RETURNING record_id;
                """, (
                    notification_id,
                    photo_url
                ))
                conn.commit()
                result = cur.fetchone()
                return result['record_id'] if result else None
    except Exception as error:
        return (False, error, "NOTIFICATION_PHOTOS_create")


def MEETINGS_add_category(meeting_id: int, category_id: int):
    """
    Добавляет категорию к встрече в таблице meeting_categories_table_11.
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                INSERT INTO meeting_categories_table_11 (
                    meeting_id,
                    category_id,
                    category_value
                ) VALUES (
                    %s, %s, 10
                )
                RETURNING record_id;
                """, (meeting_id, category_id))
                conn.commit()
                result = cur.fetchone()
                return result['record_id'] if result else None
    except Exception as error:
        return (False, error, "MEETINGS_add_category")


def MEETINGS_add_warning(meeting_id: int, warning_id: int):
    """
    Добавляет предупреждение к встрече в таблице meeting_warnings_table_21.
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                INSERT INTO meeting_warnings_table_21 (
                    meeting_id,
                    warning_id
                ) VALUES (
                    %s, %s
                )
                RETURNING record_id;
                """, (meeting_id, warning_id))
                conn.commit()
                result = cur.fetchone()
                return result['record_id'] if result else None
    except Exception as error:
        return (False, error, "MEETINGS_add_warning")


#------------------------------------------------------------------------------------------------------
# roots to Notifications
#------------------------------------------------------------------------------------------------------

# получаем все уведомления для пользователя
def USERS_get_notifications(user_id: int):
    """
    Получает все уведомления для пользователя из user_notifications_table_5
    с присоединенными данными из notifications_table_4, meeting_table_2 и notification_photos_table_6
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                SELECT
                    un.record_id,
                    un.notification_id,
                    un.user_id,
                    un.status,
                    un.sent_at,
                    un.israted,
                    n.notification_type,
                    n.notification_text,
                    n.meeting_id,
                    m.title AS meeting_title,
                    m.start_at AS meeting_start_at,
                    m.end_at AS meeting_end_at,
                    COALESCE(
                        (
                            SELECT ARRAY_AGG(np.photo_url ORDER BY np.record_id)
                            FROM notification_photos_table_6 np
                            WHERE np.notification_id = n.notification_id
                        ),
                        ARRAY[]::TEXT[]
                    ) AS photo_urls
                FROM user_notifications_table_5 un
                JOIN notifications_table_4 n ON n.notification_id = un.notification_id
                LEFT JOIN meeting_table_2 m ON m.meeting_id = n.meeting_id
                WHERE un.user_id = %s
                ORDER BY un.sent_at DESC;
                """, (user_id,))
                return cur.fetchall()
    except Exception as error:
        return (False, error, "USERS_get_notifications")
