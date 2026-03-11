import psycopg
from psycopg.rows import dict_row

from important_info import DSN

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