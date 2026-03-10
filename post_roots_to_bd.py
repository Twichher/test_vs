from important_info import DSN
from help_defs import CHECK_PAR_INT_OR_STR, CHECK_PAR_LIST_OF_STR

import psycopg


#------------------------------------------------------------------------------------------------------
#roots to MEETINGS
#------------------------------------------------------------------------------------------------------


# фукнция post создания встречи
# Несколько этапов:
# 1 - создаем саму встречу
# 2 - создаем запись в meeting_categories_table_11
# 3 - создаем записи в meeting_warnings_table_21
# 4 - создаем запись в notifications_table_4
# 5 - создаем записи в notification_photos_table_6
def MEETINGS_post_creation(
    creator_user_id : int,
    title : str,
    description : str,
    description_for_notific : str,
    max_people : int,
    address : str,
    district : str,
    adults_only : bool,
    start_at : str,
    end_at : str,
    list_of_photos : list[str],
    list_of_warnings : list[str],
    list_of_categories : list[int],
    city : str = 'Moscow',
):
    try:
        with psycopg.connect(DSN) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                INSERT INTO meeting_table_2
                (creator_user_id, title, description, max_people, address, district, adults_only, 
                start_at, end_at)
                VALUES
                (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING meeting_id;
                
                """, (creator_user_id, title, description, max_people, address, district, adults_only, 
                      start_at, end_at))
                
                meeting_id = cur.fetchone()[0]
                # conn.commit()

                for category in list_of_categories:

                    cur.execute("""

                    INSERT INTO meeting_categories_table_11 
                    (meeting_id, category_id, category_value)
                    VALUES
                    (%s, %s, 10);

                    """, (meeting_id, category))

                for warning in list_of_warnings:

                    cur.execute("""

                    INSERT INTO meeting_warnings_table_21 
                    (meeting_id, warning_id)
                    VALUES
                    (%s, %s);

                    """, (meeting_id, warning))   

                cur.execute("""

                INSERT INTO notifications_table_4
                (meeting_id, notification_type, notification_text)
                VALUES
                (%s, 'Встреча', %s)
                RETURNING notification_id;
            
                """, (meeting_id, description_for_notific))   

                notification_id = cur.fetchone()[0]

                for photo in list_of_photos:

                    cur.execute("""

                    INSERT INTO notification_photos_table_6
                    (notification_id, photo_url)
                    VALUES
                    (%s, %s);

                    """, (notification_id, photo))

                conn.commit()    


        return {
            "answer": "meeting_creating - ok",
            "meeting": {
                "meeting_id" : meeting_id,
                "notification_id" : notification_id, 
                "creator_user_id" : creator_user_id,
                "title" : title,
                "description" : description,
                "max_people" : max_people,
                "address" : address,
                "district" : district,
                "adults_only" : adults_only,
                "start_at" : start_at,
                "end_at" : end_at,
                "list_of_photos" : list_of_photos,
                "list_of_warnings" : list_of_warnings,
                "list_of_categories" : list_of_categories,
                "city" : city,
            }
        }


    except Exception as error:
        return (False, error, "MEETINGS_post_creation")


#------------------------------------------------------------------------------------------------------
#roots to USERS
#------------------------------------------------------------------------------------------------------


# post создание пользователя - регистрация. Одновременно должна быть вызвана функции отправки уведомления о регистрации.
# 1 - создаем пользователя
# 2 - высылаем уведомление о прохождении верификации - пусть уведомление о прохождении
# верификации уже создано и его id = 11
def USERS_post_registration(
    first_name: str,
    last_name: str,
    email: str,
    password_hash: str,
    middle_name: str | None = None,
    birth_date: str | None = None,
    gender: str | None = None,
    district: str | None = None,
    city: str = "Moscow",
):
    for value, name in [
        (first_name, "first_name"),
        (last_name, "last_name"),
        (email, "email"),
        (password_hash, "password_hash"),
    ]:
        if not isinstance(value, str):
            return (False, f"Error with {name} at USERS_post_registration", USERS_post_registration)

    try:
        with psycopg.connect(DSN) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO user_table_1 (
                        first_name,
                        last_name,
                        middle_name,
                        birth_date,
                        gender,
                        email,
                        password_hash,
                        city,
                        district
                    )
                    VALUES (
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        crypt(%s, gen_salt('bf', 12)),
                        %s,
                        %s
                    )
                    RETURNING user_id;
                    """,
                    (
                        first_name,
                        last_name,
                        middle_name,
                        birth_date,
                        gender,
                        email,
                        password_hash,
                        city,
                        district
                    ),
                )
                new_id = cur.fetchone()[0]

                cur.execute("""

                INSERT INTO user_notifications_table_5
                (notification_id, user_id)
                VALUES
                (11, %s)

                """, (new_id,))
            conn.commit()

        return {
            "answer": "user_created - ok",
            "user": {
                "id": new_id,
                "first_name": first_name,
                "last_name": last_name,
                "middle_name": middle_name,
                "email": email,
                "birth_date": birth_date,
                "gender": gender,
                "district": district,
                "city" : city
            },
        }
    
    except Exception as error:
        return (False, error, "USERS_post_registration")


# print(USERS_post_registration(first_name="Test5", last_name="Last5", middle_name="Middle5",
#                               email="email5@gmail.com", password_hash="pass5", birth_date="2001-03-15",
#                               gender="F", district="ЦАО"))

# print(USERS_post_registration(first_name="Test6", last_name="Last6",
#                                email="email6@gmail.com", password_hash="pass6"))

#------------------------------------------------------------------------------------------------------
#roots to SUPPORT
#------------------------------------------------------------------------------------------------------


# post запрос в таблицу support_photos_table_17, то есть по id обращения добавляем фотографии
def SUPPORT_post_add_photos_to_ticket(ticket_id : str|int, photos_url : list[str]):

    #проверка всех аргументов
    answer_by_check = CHECK_PAR_INT_OR_STR(ticket_id, "Error with ticket_id at SUPPORT_post_add_photos_to_ticket")
    if isinstance(answer_by_check, list):
        return answer_by_check
    answer_by_check = CHECK_PAR_LIST_OF_STR(photos_url, "Error with photos_url at SUPPORT_post_add_photos_to_ticket")
    if isinstance(answer_by_check, list):
        return answer_by_check
    
    ticket_int = int(ticket_id)

    try:
       with psycopg.connect(DSN) as conn:
            with conn.cursor() as cur:
                added_photo_urls = []
                for url in photos_url:
                    cur.execute("""
                                
                        INSERT INTO support_photos_table_22 (ticket_id, photo_url)
                        VALUES (%s, %s)
                        RETURNING photo_url
                                
                    """, (ticket_int, url))

                    added_photo_urls.append(cur.fetchone()[0])
                
                conn.commit()   
                return {"answer" : "photos added - ok",
                        "ticket": {
                            "ticket_id": ticket_int,
                            "added_count": len(added_photo_urls),
                            "photo_urls": added_photo_urls
                        }
                }
    except Exception as error:
        return (False, error, "SUPPORT_post_add_photos_to_ticket")
#print(SUPPORT_post_add_photos_to_ticket(28, ["http://127.0.0.1:9000/allphotos/no.jpg", "http://127.0.0.1:9000/allphotos/no.jpg"]))


# post запрос в бд для создания обращения в поддержку
# принимает id поль-ля кто отправляет, категория обращения, сообщение для поддержки и список ссылок на фото
def SUPPORT_post_create_ticket_by_user(requester_user_id : str|int,
                                       category : str, message_text : str, 
                                       photos_url : list[str]):

    requester_user_id_int = int(requester_user_id)

    #основная часть функции. Сначала вносим запись в таблицу поддержки просто.

    try:
        with psycopg.connect(DSN) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                INSERT INTO support_table_17 (
                requester_user_id,
                category,
                message_text
                ) VALUES
                (%s, %s, %s)
                RETURNING ticket_id;

                """, (requester_user_id_int, category, message_text))  

                id_of_created_ticket = cur.fetchone()[0] #получаем id только созданного обращения 
                conn.commit()

                result_of_additing_photos = SUPPORT_post_add_photos_to_ticket(id_of_created_ticket, photos_url)

                if isinstance(result_of_additing_photos, tuple) and result_of_additing_photos[0] is False: 
                    return result_of_additing_photos

                return {"answer" : "ticket created - ok",
                        "ticket" : {
                            "ticket_id"  : id_of_created_ticket, 
                            "requester_user_id" : requester_user_id_int,
                            "category" : category, 
                            "message_text" : message_text[:200],
                            "photos_url" : result_of_additing_photos["ticket"]["photo_urls"]
                                    }
                        }


    except Exception as error:
        return (False, error, "SUPPORT_post_create_ticket_by_user") 
# arr = ["1", "баг", "текст обращения №29 проверка создания заявки с фото", ["http://127.0.0.1:9000/allphotos/no.jpg", 
#                                                                     "http://127.0.0.1:9000/allphotos/no.jpg"]]
# arr = ["1", "баг", "текст обращения №28 проверка создания заявки без фото", []]
# print(SUPPORT_post_create_ticket_by_user(*arr))


