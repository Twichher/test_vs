import psycopg
from psycopg.rows import dict_row

from important_info import DSN


#------------------------------------------------------------------------------------------------------
#roots to MEETINGS
#------------------------------------------------------------------------------------------------------

# функция отменяет запись пользователя (переводит его из registered в missed)
def USERS_update_miss_meeting(meeting_id: int, user_id: int):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                            
                UPDATE meeting_rating_table_8
                SET user_action = 'missed'
                WHERE user_id = %s and meeting_id = %s

                """, (user_id, meeting_id))
                return {"MEETING": meeting_id, "USER": user_id, "ACTION": "MISSED", "ANSWER": True}
    except Exception as error:
        return (False, error, "USERS_update_miss_meeting")


#------------------------------------------------------------------------------------------------------
#roots to USERS
#------------------------------------------------------------------------------------------------------


# функция записывает запись пользователя на встречу
def USERS_post_reg_to_meet(meeting_id: int, user_id: int, user_action: str):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO meeting_rating_table_8
                        (meeting_id, user_id, user_action)
                    VALUES (%s, %s, %s)
                """, (meeting_id, user_id, user_action))

                return {"MEETING": meeting_id, "USER": user_id, "ACTION": user_action, "ANSWER": True}

    except psycopg.errors.RaiseException as e:
        return (False, str(e), "USERS_post_reg_to_meet")
    except Exception as e:
        return (False, str(e), "USERS_post_reg_to_meet")
