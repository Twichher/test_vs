from important_info import DSN
from help_defs import CHECK_PAR_INT_OR_STR, CHECK_PAR_LIST_OF_STR

import psycopg


#------------------------------------------------------------------------------------------------------
#roots to MEETINGS
#------------------------------------------------------------------------------------------------------


# фукнция post создания встречи
def MEETINGS_post_creation(
    creator_user_id : int,
    title : str,
    description : str,
    max_people : int,
    address : str,
    district : str,
    adults_only : bool,
    start_at : str,
    end_at : str,
    list_of_photos : list[str],
    city : str = 'Moscow',
):
    pass


















#------------------------------------------------------------------------------------------------------
#roots to USERS
#------------------------------------------------------------------------------------------------------


# post создание пользователя - регистрация. Одновременно должна быть вызвана функции отправки уведомления о регистрации.
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
                        district,
                    ),
                )
                new_id = cur.fetchone()[0]
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
                                
                        INSERT INTO support_photos_table_17 (ticket_id, photo_url)
                        VALUES (%s, %s)
                        RETURNING photo_url
                                
                    """, (ticket_int, url))

                    added_photo_urls.append(cur.fetchone()[0])
                
                conn.commit()   
                return {
                    "ticket_id": ticket_int,
                    "added_count": len(added_photo_urls),
                    "photo_urls": added_photo_urls
                }
    except Exception as error:
        return error
#print(SUPPORT_post_add_photos_to_ticket(28, ["http://127.0.0.1:9000/allphotos/no.jpg", "http://127.0.0.1:9000/allphotos/no.jpg"]))


# post запрос в бд для создания обращения в поддержку
# принимает id поль-ля кто отправляет, категория обращения, сообщение для поддержки и список ссылок на фото
def SUPPORT_post_create_ticket_by_user(requester_user_id : str|int,
                                       category : str, message_text : str, 
                                       photos_url : list[str]):
    
    #проверка всех аргументов
    answer_by_check = CHECK_PAR_INT_OR_STR(requester_user_id, "Error with requester_user_id at SUPPORT_post_create_ticket_by_user")
    if isinstance(answer_by_check, list):
        return answer_by_check
    
    if not isinstance(category, str):
        return "Error with category at SUPPORT_post_create_ticket_by_user"
    
    if not isinstance(message_text, str):
        return "Error with SUPPORT_post_create_ticket_by_user at SUPPORT_post_create_ticket_by_user"

    requester_user_id_int = int(requester_user_id)

    #основная часть функции. Сначала вносим запись в таблицу поддержки просто.

    try:
        with psycopg.connect(DSN) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                INSERT INTO support_table_22 (
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

                return {"ticket_id"  : id_of_created_ticket, 
                       "category" : category, 
                       "part_message_text" : message_text[:200],
                       "photos_answer" : result_of_additing_photos}


    except Exception as error:
        return error 
# arr = ["1", "баг", "текст обращения №29 проверка создания заявки с фото", ["http://127.0.0.1:9000/allphotos/no.jpg", 
#                                                                     "http://127.0.0.1:9000/allphotos/no.jpg"]]
# arr = ["1", "баг", "текст обращения №28 проверка создания заявки без фото", []]
# print(SUPPORT_post_create_ticket_by_user(*arr))


