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
                    m.end_at AS end_at
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

                WHERE m.status = 'created'
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

                WHERE m.status = 'created'
                AND m.meeting_id = %s;

                """, (meeting_id, ))
                return cur.fetchone()
    except Exception as error:
        return (False, error, "MEETINGS_reged_get_all_info")
    

# выводим информацию о встрече в профиле для записей(встречи где поль-ль учавствовал), всю информацию, включая адрес
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

                -- Количество посетивших
                LEFT JOIN (
                    SELECT meeting_id, COUNT(*) AS registered_users_count
                    FROM meeting_rating_table_8
                    WHERE user_action IN ('attended', 'missed')
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

                WHERE m.status = 'finished'
                AND m.meeting_id = %s;

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
                AND mr.user_action IN ('registered', 'missed')
                ORDER BY u.last_name, u.first_name;


                """, (meeting_id, ))

                return cur.fetchall()
    except Exception as error:
        return (False, error, "MEETINGS_get_reged_missed_users")
    

# по id встречи выводим тех кто был на завершенной встречи и тех кто пропустил ее
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
                WHERE mr.meeting_id = %s
                AND mr.user_action IN ('attended', 'missed')
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
                      AND mrt.user_action = 'registered'
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
                    COALESCE(c.category_ids, '{}') AS category_ids
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

                WHERE m.status = 'created'
                ORDER BY m.meeting_id;

                """, (user_id,))

                return cur.fetchall()
    except Exception as error:
        return (False, error, "USERS_get_MEETINGS_info_reged")

# получаем краткую инф-ю о встречах на которые пользователь сходил и они закончились
def USERS_get_MEETINGS_info_finished(user_id : int):
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
                    COALESCE(c.category_ids, '{}') AS category_ids
                FROM meeting_table_2 m

                -- Фильтр: только встречи где записан конкретный пользователь
                JOIN meeting_rating_table_8 ur
                    ON ur.meeting_id = m.meeting_id
                    AND ur.user_id = %s
                    AND ur.user_action IN ('attended', 'missed')

                LEFT JOIN (
                    SELECT meeting_id, COUNT(*) AS registered_users_count
                    FROM meeting_rating_table_8
                    WHERE user_action = 'attended'
                    GROUP BY meeting_id
                ) r ON r.meeting_id = m.meeting_id

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