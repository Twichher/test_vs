from important_info import DSN
from help_defs import CHECK_PAR_INT_OR_STR, CHECK_PAR_LIST_OF_STR, CHECK_PAR_LIST_OF_INT

import psycopg
from psycopg.rows import dict_row


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
        return error
#print(FAQ_get_all_rows())


#------------------------------------------------------------------------------------------------------
#roots to MEETINGS
#------------------------------------------------------------------------------------------------------


# функция выводит встречи в статусе created(то есть открытые для записи), зависит от квартала где пользователь(сначала в его квартале, в 
# алфавитном все остальные), выводит
# название встечи, кол-во зарегистрированных уже участников, макс участников, квартал и ограничение 18+(true/false).
# Также выводит не все встречи а часть, то есть начиная с какого то meeting_id <- не сработало, не буду делать, вряд ли 
# встреч будет миллионы открытых
def MEETINGS_get_info_for_main_page(district : str):

    # """
    # last_meeting_id: ID последней загруженной встречи.
    # last_is_my_district: True, если последняя встреча была из "моего" района.
    #                      Нужно для корректного перехода границы между "своими" и "чужими".
    #                      Если None (первый запуск) — считается как начало (-1).
    # """
    # 0 = мой район, 1 = чужой. Для старта берем -1, чтобы показать всё с 0.
    # if last_is_my_district is None:
    #     last_priority = -1
    # else:
    #     last_priority = 0 if last_is_my_district else 1


    if not isinstance(district, str):
        return "Error with district at MEETINGS_get_info_for_main_page"

    try: 
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                    SELECT
                        m.meeting_id, 
                        m.title AS meeting_title,
                        COUNT(mr.user_id) FILTER (WHERE mr.user_action = 'registered') AS registered_users_count,
                        m.max_people AS max_people_allowed,
                        m.district AS district,
                        m.adults_only AS adults_only_18plus
                    FROM meeting_table_2 m
                    LEFT JOIN meeting_rating_table_8 mr ON mr.meeting_id = m.meeting_id
                    WHERE m.status = 'created'
                    GROUP BY m.meeting_id, m.title, m.district, m.adults_only
                    ORDER BY 
                        CASE WHEN m.district = %s THEN 0 ELSE 1 END,  
                        m.district,                                   
                        m.meeting_id
                
                """, (district, ))

                return cur.fetchall()
    except Exception as error:
        return error
#print(MEETINGS_get_info_for_main_page("ЮАО"))


# выводит краткую инф-ю(как в MEETINGS_get_info_for_main_page) для определенных встреч,
# по конкретным id. Только активные встречи
def MEETINGS_get_only_definite(meetings_ids : list[int]):
    answer_by_check = CHECK_PAR_LIST_OF_INT(meetings_ids, "Error with meetings_ids at MEETINGS_get_only_definite")
    if isinstance(answer_by_check, list):
        return answer_by_check
    
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT
                    m.meeting_id, 
                    m.title AS meeting_title,
                    COUNT(mr.user_id) FILTER (WHERE mr.user_action = 'registered') AS registered_users_count,
                    m.max_people AS max_people_allowed,
                    m.district AS district,
                    m.adults_only AS adults_only_18plus,
                    m.creator_user_id
                FROM meeting_table_2 m
                LEFT JOIN meeting_rating_table_8 mr ON mr.meeting_id = m.meeting_id
                WHERE m.status = 'created' and mr.meeting_id = ANY(%s)
                GROUP BY m.meeting_id, m.title, m.district, m.adults_only
                ORDER BY m.meeting_id

                """, [meetings_ids])
                return cur.fetchall()
    except Exception as error:
        return (False, error, "MEETINGS_get_only_definite")
    

# функция нужна для вывода посещенных встреч. Выводит как данные как в MEETINGS_get_only_definite
# только для завершившихся встреч
def MEETINGS_get_only_ended_definite(meetings_ids : list[int]):
    answer_by_check = CHECK_PAR_LIST_OF_INT(meetings_ids, "Error with meetings_ids at MEETINGS_get_only_ended_definite")
    if isinstance(answer_by_check, list):
        return answer_by_check 

    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT
                    m.meeting_id, 
                    m.title AS meeting_title,
                    COUNT(mr.user_id) FILTER (WHERE mr.user_action = 'attended') AS registered_users_count,
                    m.max_people AS max_people_allowed,
                    m.district AS district,
                    m.adults_only AS adults_only_18plus,
                    m.creator_user_id
                FROM meeting_table_2 m
                LEFT JOIN meeting_rating_table_8 mr ON mr.meeting_id = m.meeting_id
                WHERE m.status = 'finished' and mr.meeting_id = ANY(%s)
                GROUP BY m.meeting_id, m.title, m.district, m.adults_only
                ORDER BY m.meeting_id

                """, [meetings_ids])
                return cur.fetchall()
    except Exception as error:
        return (False, error, "MEETINGS_get_only_definite")



# фукнция должна выводить встречи у которых конкретный квартал, суть работы как и у MEETINGS_get_info_for_main_page, 
# только добавляется условие по кварталам
# districts = 'ЦАО' or districts = ['ЦАО', 'ЦАО', 'ЦАО'] -> districts = 'ЦАО', 'ЦАО', 'ЦАО'
def MEETINGS_get_info_for_main_page_by_definite_district(districts : list[str]):
    
    answer_by_check = CHECK_PAR_LIST_OF_STR(districts, "Error with districts at MEETINGS_get_info_for_main_page_by_definite_district")
    if isinstance(answer_by_check, list):
        return answer_by_check

    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT
                        m.meeting_id, m.title AS meeting_title,
                        COUNT(mr.user_id) FILTER (WHERE mr.user_action = 'registered') AS registered_users_count,
                        m.max_people AS max_people_allowed,
                        m.district AS district,
                        m.adults_only AS adults_only_18plus
                    FROM meeting_table_2 m
                    LEFT JOIN meeting_rating_table_8 mr ON mr.meeting_id = m.meeting_id
                    WHERE m.status = 'created' AND m.district = ANY(%s)
                    GROUP BY m.meeting_id, m.title, m.district, m.adults_only
                    ORDER BY m.meeting_id
                """, [districts])
                return cur.fetchall()
    except Exception as error:
        return error
#print(MEETINGS_get_info_for_main_page_by_definite_district(['ЦАО', 'ВАО']))


# фукнция должна выводить встречи у которых есть конкретные категории,
# суть работы как и у MEETINGS_get_info_for_main_page, только добавляется условие по категориям
def MEETINGS_get_info_for_main_page_by_definite_categories(categories : list[str]):

    answer_by_check = CHECK_PAR_LIST_OF_STR(categories, "Error with categories at MEETINGS_get_info_for_main_page_by_definite_categories")
    if isinstance(answer_by_check, list):
        return answer_by_check

    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                WITH required AS (
                    SELECT c.category_id
                    FROM categories_table_10 c
                    WHERE lower(c.category_name) = ANY(%s)
                ),
                meetings_ok AS (
                    SELECT mc.meeting_id
                    FROM meeting_categories_table_11 mc
                    JOIN required r ON r.category_id = mc.category_id
                    GROUP BY mc.meeting_id
                    HAVING COUNT(DISTINCT mc.category_id) = (SELECT COUNT(*) FROM required)
                )
                SELECT
                    m.meeting_id,
                    m.title AS meeting_title,
                    COUNT(mr.user_id) FILTER (WHERE mr.user_action = 'registered') AS registered_users_count,
                    m.max_people AS max_people_allowed,
                    m.district AS quarter,
                    m.adults_only AS adults_only_18plus
                FROM meeting_table_2 m
                JOIN meetings_ok ok ON ok.meeting_id = m.meeting_id
                LEFT JOIN meeting_rating_table_8 mr ON mr.meeting_id = m.meeting_id
                WHERE m.status = 'created'
                GROUP BY
                    m.meeting_id, m.title, m.max_people, m.district, m.adults_only
                ORDER BY m.meeting_id;
                
                """, [categories])
                return cur.fetchall()
    except Exception as error:
        return error
#print(MEETINGS_get_info_for_main_page_by_definite_categories(['спорт', 'йога']))


#выводит те встречи у которых параметр макс людей удоволетворяет условию, то есть фильтр по кол-ву людей максимум
def MEETINGS_get_info_for_main_page_by_count_of_max_people(max_people_par : str|int):

    answer_by_check = CHECK_PAR_INT_OR_STR(max_people_par, "Error with max_people_par at MEETINGS_get_info_for_main_page_by_count_of_max_people")
    if isinstance(answer_by_check, list):
        return answer_by_check
    
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT
                    m.meeting_id,
                    m.title AS meeting_title,
                    COUNT(mr.user_id) FILTER (WHERE mr.user_action = 'registered') AS registered_users_count,
                    m.max_people AS max_people_allowed,
                    m.district AS district,
                    m.adults_only AS adults_only_18plus
                FROM meeting_table_2 m
                LEFT JOIN meeting_rating_table_8 mr
                    ON mr.meeting_id = m.meeting_id
                WHERE m.status = 'created' AND m.max_people <= %s
                GROUP BY
                    m.meeting_id, m.title, m.district, m.adults_only
                ORDER BY m.meeting_id;
                
                """, (max_people_par,))
                return cur.fetchall()
    except Exception as error:
        return error
#print(MEETINGS_get_info_for_main_page_by_count_of_max_people(15))


# фукнция выводит всю информацию о встрече, на которую нажал пользователь
# на главной странице (то есть по id)
def MEETINGS_get_info_for_clicked_meeting( meeting_id : str|int ):

    answer_by_check = CHECK_PAR_INT_OR_STR(meeting_id, "Error with meeting_id at MEETINGS_get_info_for_clicked_meeting")
    if isinstance(answer_by_check, list):
        return answer_by_check
    
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT
                    m.meeting_id,
                    m.status,
                    m.title                                   AS meeting_title,
                    m.start_at                                AS meeting_start_at,
                    m.creator_user_id                         AS creator_user_id,
                    COUNT(mr.user_id) FILTER (WHERE mr.user_action = 'registered')
                                                                AS registered_users_count,
                    m.max_people                              AS max_people,
                    m.district                                AS district,
                    m.adults_only                             AS adults_only,
                    COALESCE(
                        STRING_AGG(DISTINCT w.warning_name, ', ' ORDER BY w.warning_name),
                        ''
                    )                                         AS warnings,
                    m.description                             AS meeting_description
                FROM meeting_table_2 m
                LEFT JOIN meeting_rating_table_8 mr
                    ON mr.meeting_id = m.meeting_id
                LEFT JOIN meeting_warnings_table_21 mw
                    ON mw.meeting_id = m.meeting_id
                LEFT JOIN warnings_table_13 w
                    ON w.warning_id = mw.warning_id
                WHERE m.status = 'created' and m.meeting_id = %s
                GROUP BY
                    m.meeting_id, m.status, m.title, m.start_at, m.creator_user_id,
                    m.max_people, m.district, m.adults_only, m.description
                ORDER BY m.meeting_id;
                
                """, (meeting_id,))
                return cur.fetchall()
    except Exception as error:
        return error
#print(MEETINGS_get_info_for_clicked_meeting(3))


# выводим всех зарегистрированных на встречу пользователей, а также их кол-во посещенный встреч,
# и рейтинги
def MEETINGS_get_reged_users(meeting_id : str|int):
    answer_by_check = CHECK_PAR_INT_OR_STR(meeting_id, "Error with meeting_id at MEETINGS_get_reged_users")
    if isinstance(answer_by_check, list):
        return answer_by_check    
    
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT
                    mrt.user_id,
                    u.first_name,
                    u.last_name,
                    ue.meetings_visited_as_guest,
                    ue.rating_as_guest,
                    ue.intermediate_rating_as_guest
                FROM meeting_rating_table_8 mrt
                JOIN user_table_1 u
                ON u.user_id = mrt.user_id
                JOIN user_extra_info_table_3 ue
                ON ue.user_id = mrt.user_id
                WHERE mrt.meeting_id = %s
                AND mrt.user_action = 'registered'
                ORDER BY mrt.user_id;

                """, (meeting_id,))
                return cur.fetchall()
    except Exception as error:
        return (False, error, "MEETINGS_get_reged_users")
#print(MEETINGS_get_reged_users(4))


# выводим список посетивших встречу пользователей
def MEETINGS_get_atted_users(meeting_id : str|int):
    answer_by_check = CHECK_PAR_INT_OR_STR(meeting_id, "Error with meeting_id at MEETINGS_get_atted_users")
    if isinstance(answer_by_check, list):
        return answer_by_check    
    
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT
                    mrt.user_id,
                    u.first_name,
                    u.last_name,
                    ue.meetings_visited_as_guest,
                    ue.rating_as_guest,
                    ue.intermediate_rating_as_guest
                FROM meeting_rating_table_8 mrt
                JOIN user_table_1 u
                ON u.user_id = mrt.user_id
                JOIN user_extra_info_table_3 ue
                ON ue.user_id = mrt.user_id
                WHERE mrt.meeting_id = %s
                AND mrt.user_action = 'attended'
                ORDER BY mrt.user_id;;

                """, (meeting_id,))
                return cur.fetchall()
    except Exception as error:
        return (False, error, "MEETINGS_get_atted_users")
#print(MEETINGS_get_atted_users(6))


#------------------------------------------------------------------------------------------------------
#roots to USERS
#------------------------------------------------------------------------------------------------------


# выводит информацию о конкретном пользователе когда нажали на сайте посмотреть инфу(то есть по id), выводит 
# последнюю фото загруженную поль-ем, имя, фамилию, встречи, рейтинг, промежуточный рейтинг, и если
# он еще и организатор то встречи, рейтинг и промежуточный рейтинг
def USERS_get_info_about_clicked_user(user_id : str|int):

    answer_by_check = CHECK_PAR_INT_OR_STR(user_id, "Error with user_id at USERS_get_info_about_clicked_user")
    if isinstance(answer_by_check, list):
        return answer_by_check
    
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT
                    u.user_id,
                    u.first_name,
                    u.last_name,
                    u.is_organizer,
                    e.meetings_visited_as_guest,
                    e.rating_as_guest,
                    e.intermediate_rating_as_guest,
                    CASE WHEN u.is_organizer THEN e.meetings_created_as_organizer END AS meetings_created_as_organizer,
                    CASE WHEN u.is_organizer THEN e.rating_as_organizer END         AS rating_as_organizer,
                    CASE WHEN u.is_organizer THEN e.intermediate_rating_as_organizer END AS intermediate_rating_as_organizer,
                    p.photo_url
                FROM user_table_1 u
                LEFT JOIN user_extra_info_table_3 e
                    ON e.user_id = u.user_id
                LEFT JOIN LATERAL (
                    SELECT up.photo_url
                    FROM user_photos_table_14 up
                    WHERE up.user_id = u.user_id
                    ORDER BY up.uploaded_at DESC
                    LIMIT 1
                ) p ON TRUE
                WHERE u.user_id = %s;

                """, (user_id,))
                return cur.fetchall()

    except Exception as error:
        return error
#print(USERS_get_info_about_clicked_user(1))


# просто выводит все фотографии загруженные пользователем в хронологическом порядке(первое - самое новое фото)
def USERS_get_all_photos_of_clicked_user(user_id : str|int):

    answer_by_check = CHECK_PAR_INT_OR_STR(user_id, "Error with user_id at USERS_get_all_photos_of_clicked_user")
    if isinstance(answer_by_check, list):
        return answer_by_check
    
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT
                    u.user_id,
                    p.photo_url
                FROM user_table_1 u
                JOIN user_photos_table_14 p
                    ON p.user_id = u.user_id
                WHERE u.user_id = %s
                ORDER BY p.uploaded_at DESC, u.user_id;

                """, (user_id,))
                return cur.fetchall()
    except Exception as error:
        return error
#print(USERS_get_all_photos_of_clicked_user(1))


# просто выводи значение meetings_as_currency у конкретного пользователя по его user_id
def USERS_get_meeting_currency_by_define_id(user_id : str|int):

    answer_by_check = CHECK_PAR_INT_OR_STR(user_id, "Error with user_id at USERS_get_meeting_currency_by_define_id")
    if isinstance(answer_by_check, list):
        return answer_by_check
    
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT
                    u.first_name,
                    u.last_name,
                    x.meetings_as_currency
                FROM user_table_1 u
                JOIN user_extra_info_table_3 x
                ON x.user_id = u.user_id
                WHERE u.user_id = %s;

                """, (user_id,))
                return cur.fetchall()
    except Exception as error:
        return error
#print(USERS_get_meeting_currency_by_define_id(1))


#фукнция должна вернуть true если пароль и логи правильны, то есть фукнция логина 
def USERS_check_login(email_user : str, password : str):

    if not isinstance(email_user, str): return "Error with email_user at USERS_check_login"
    if not isinstance(password, str): return "Error with password at USERS_check_login"

    try:
        with psycopg.connect(DSN) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT user_id, first_name, last_name, 
                       district, is_blocked
                FROM user_table_1
                WHERE email = %s AND password_hash = crypt(%s, password_hash);

                """, (email_user, password))
                return cur.fetchall()
    except Exception as error:
        return error
#print(USERS_check_login('andrey.pavlov15@example.com', 'fPass!User015'))



# получаем idшники всех встреч куда записан конкретный пользователь
# возвращает {'meeting_id': 4}
def USERS_get_ids_of_meetings_reged(user_id : str | int):
    answer_by_check = CHECK_PAR_INT_OR_STR(user_id, "Error with user_id at USERS_get_ids_of_meetings_reged")
    if isinstance(answer_by_check, list):
        return answer_by_check
    
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT mrt.meeting_id
                FROM meeting_rating_table_8 mrt
                JOIN meeting_table_2 mt
                ON mrt.meeting_id = mt.meeting_id
                WHERE mt.status = 'created' 
                    AND mrt.user_action = 'registered' 
                    AND mrt.user_id = %s;
            
                """, (user_id,))
                req = cur.fetchall()
                return [id["meeting_id"] for id in req]
    except Exception as error:
        return (False, error, "USERS_get_ids_of_meetings_reged")
    
#print(MEETINGS_get_only_definite(USERS_get_ids_of_meetings_reged(4)))


# выводим id встреч которые посетил пользователь
def USERS_get_ids_of_meetings_ended(user_id : str | int):
    answer_by_check = CHECK_PAR_INT_OR_STR(user_id, "Error with user_id at USERS_get_ids_of_meetings_ended")
    if isinstance(answer_by_check, list):
        return answer_by_check 
    
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT mrt.meeting_id
                FROM meeting_rating_table_8 mrt
                JOIN meeting_table_2 mt
                ON mrt.meeting_id = mt.meeting_id
                WHERE mt.status = 'finished' 
                    AND mrt.user_action = 'attended' 
                    AND mrt.user_id = %s;
            
                """, (user_id,))
                req = cur.fetchall()
                return [id["meeting_id"] for id in req]
    except Exception as error:
        return (False, error, "USERS_get_ids_of_meetings_reged")
    
#print(MEETINGS_get_only_ended_definite(USERS_get_ids_of_meetings_ended(4)))


# выводим встречи созданные данным пользователь
def USERS_get_created_meetings_by_user(user_id : str | int):
    answer_by_check = CHECK_PAR_INT_OR_STR(user_id, "Error with user_id at USERS_get_created_meetings_by_user")
    if isinstance(answer_by_check, list):
        return answer_by_check    
    
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT
                    m.meeting_id, 
                    m.title AS meeting_title,
                    COUNT(mr.user_id) FILTER (WHERE mr.user_action = 'attended') AS registered_users_count,
                    m.max_people AS max_people_allowed,
                    m.district AS district,
                    m.adults_only AS adults_only_18plus,
                    m.creator_user_id
                FROM meeting_table_2 m
                LEFT JOIN meeting_rating_table_8 mr ON mr.meeting_id = m.meeting_id
                WHERE m.status = 'finished' and m.creator_user_id = %s
                GROUP BY m.meeting_id, m.title, m.district, m.adults_only
                ORDER BY m.meeting_id

                """, (user_id, ))
                return cur.fetchall()
    except Exception as error:
        return (False, error, "USERS_get_created_meetings_by_user")
#print(USERS_get_created_meetings_by_user(1))


# вывести таблицу пользователей по рейтингу от большего к лучшему
def USERS_top_rating():
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT user_id, meetings_visited_as_guest, rating_as_guest
                FROM user_extra_info_table_3 
                ORDER BY rating_as_guest DESC
    
                """)
                return cur.fetchall()
    except Exception as error:
        return (True, error, "USERS_top_rating")
#print(USERS_top_rating())


# вывести таблицу пользователей по промежуточному рейтингу от большего к лучшему
def USERS_top_intermediate_rating():
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT user_id, meetings_visited_as_guest, rating_as_guest
                FROM user_extra_info_table_3 
                ORDER BY rating_as_guest DESC
    
                """)
                return cur.fetchall()        
    except Exception as error:
        return (False, error, "USERS_top_intermediate_rating")

#------------------------------------------------------------------------------------------------------
#ВСПОМОГАТЕЛЬНЫЕ РУЧКИ
#------------------------------------------------------------------------------------------------------

# выводит список всех предупреждений
def HELPFUL_get_warnings():
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT warning_name 
                FROM warnings_table_13 
                ORDER BY warning_id

                """)
                return cur.fetchall()
    except Exception as error:
        return (False, error, "HELPFUL_get_warnings")

#print(HELPFUL_get_warnings())


# выводит список всех категорий
def HELPFUL_get_categories():
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT category_name, photo_url
                FROM categories_table_10 
                ORDER BY category_id
                
                """)
                return cur.fetchall()
    except Exception as error:
        return (False, error, "HELPFUL_get_categories")
#print(HELPFUL_get_categories())