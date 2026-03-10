# этот код в потенциале должен пробегаться по БД и менять таблицу user_extra_info_table_3,
# то есть отслеживать значения встреч, рейтинг и промежуточный рейтинг, вычисляя их с помощью
# других таблиц

from important_info import DSN

import psycopg
from psycopg.rows import dict_row
from collections import defaultdict
from datetime import datetime


# таким образом получили id последней записи в таблице meeting_rating_table_8(то есть самое новое record_id)
# это наш end_record_id для meeting_count_of_user
def get_new_id_in_table_8(conn): 
    try:
        with conn.cursor() as cur:
            cur.execute("""

            SELECT record_id FROM meeting_rating_table_8
            ORDER BY record_id DESC
            LIMIT 1;
            
            """)
            return cur.fetchone()
    except Exception as error:
        return [False, error]
    


# выводит последний record_id в табл user_ratings_table_15
def get_new_id_in_table_15(conn): 
    try:
        with conn.cursor() as cur:
            cur.execute("""

            SELECT record_id FROM user_ratings_table_15
            ORDER BY record_id DESC
            LIMIT 1;
            
            """)
            return cur.fetchone()
    except Exception as error:
        return [False, error]


# получаем информацию о последней джобе в табл 24, то есть
# результат последней работы (на чем остановились). Это наш start_record_id для meeting_count_of_user
def get_last_job_info_in_24(conn):
    try:
        with conn.cursor() as cur:
            cur.execute("""

            SELECT * FROM job_helper_table_24
            ORDER BY job_id DESC LIMIT 1;

            """)
            return cur.fetchone()
    except Exception as error:
        return [False, error]
    

# обновляем результаты последней джобы в табл 24.
# получаем last id in table 15 and last id in table 8
def update_job_info_in_24(conn, last_id_t15, last_id_t8, count_rows_changed):
    try:
        with conn.cursor() as cur:
            cur.execute("""

            INSERT INTO job_helper_table_24  
            (last_id_in_table_8, last_id_in_table_15, rows_changed_in_table_3)
            VALUES
            (%s, %s, %s)

            """, (last_id_t15, last_id_t8, count_rows_changed))
            conn.commit()
    except Exception as error:
        return [False, error]


# с помощью этой ф-ии получим данные вида: user_id, meeting_count, то есть сколько встреч
# посетил пользователь начиная с start_record_id и до end_record_id в таблице meeting_rating_table_8
# !! в этой фукнции проблем нет - мы просто прибавляем к уже существующему кол-ву встреч пользователя
# новые встречи
def get_meeting_count_of_user(conn, start_record_id, end_record_id):
    try:
        with conn.cursor() as cur:
            cur.execute("""

            SELECT 
                user_id,
                COUNT(meeting_id) AS meetings_count
            FROM meeting_rating_table_8
            WHERE user_action = 'attended' AND record_id BETWEEN %s AND %s
            GROUP BY user_id
            ORDER BY user_id;

            """, (start_record_id, end_record_id))
            return cur.fetchall()
    except Exception as error:
        return [False, error]


# получили id встречи, ее сред оценку от пользователей которые на нее сходили,
# создателя встречи. Анализ проводится в табл 8
# Эта фукнция не позволит вычислить рейтинг встречи, а также прибавлять отсюда созданные пользователем
# встречи, так как одну и ту же встречи могут оценить в разные промежутки времени, а данные тут появятся.
# ---были изменения после того как было написано то что сверху---
# теперь мы также получаем кол-во оценок.
def get_meetid_avgrating_creator(conn, start_record_id, end_record_id):
    try:
        with conn.cursor() as cur:
            cur.execute("""

            SELECT 
                mrt.meeting_id,
                AVG(mrt.meeting_rating) AS avg_meeting_rating,
                COUNT(mrt.meeting_rating) AS ratings_count,  -- количество оценок для каждой встречи
                mt.creator_user_id
            FROM meeting_rating_table_8 mrt
            INNER JOIN meeting_table_2 mt 
                ON mrt.meeting_id = mt.meeting_id
            WHERE mrt.user_action = 'attended'
                AND mt.status = 'finished'
                AND mrt.meeting_rating IS NOT NULL  
                AND mrt.record_id BETWEEN %s AND %s
            GROUP BY mrt.meeting_id, mt.creator_user_id
            ORDER BY mrt.meeting_id;


            """, (start_record_id, end_record_id))
            return cur.fetchall()
    except Exception as error:
        return [False, error]
    

# получить данные вида кого оценили, кто, и какая оценка из табл user_ratings_table_15
# чтобы вычислить рейтинг пользователя нужно также знать общее кол-во оценок пользователя,
# а с помощью этой фукнции мы должны получать кол-во новых оценок а также их средний
# рейтинг и уже эти данные прибавлять к существующим
def get_rated_rating_value_of_users(conn, start_record_id, end_record_id):
    try:
        with conn.cursor() as cur:
            cur.execute("""

            SELECT rated_user_id, rater_user_id, rating_value 
            FROM user_ratings_table_15 
            WHERE record_id between %s and %s;

            """, (start_record_id, end_record_id))
            return cur.fetchall()
    except Exception as error:
        return [False, error]
    

# получаем

# выводим временной период промежуточного периода
def get_time_of_intermediate_period():
    try:
        with psycopg.connect(DSN) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT * 
                FROM start_end_trial_period_table_25
                ORDER BY period_id DESC
                LIMIT 1;

                """)

                return cur.fetchall()
    except Exception as error:
        return [False, error]
    

# обноваление временного промежуточного периода
def update_intermediate_period():
    try:
        with psycopg.connect(DSN) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                INSERT INTO start_end_trial_period_table_25 
                (start_trial_period, end_trial_period)
                VALUES 
                (NOW(), NOW() + INTERVAL '1 day');
                
                """)

                conn.commit()

    except Exception as error:
        return [False, error]
    

# проверяем входит ли настоящий момент в диапазон промежуточного времени
def if_now_in_intermed_period(range_period : list[tuple]):
    user_id, start_dt, end_dt = range_period[0]
    now = datetime.now()
    if not start_dt <= now <= end_dt:
        return False
    return True


# функция для получения всех нужных данных из БД, все что писали выше эта функция обьединяет в себе
def get_main_data_joba_to_t3():
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            req_answer_new_id_t8 = get_new_id_in_table_8(conn)
            req_answer_last_job_t24 = get_last_job_info_in_24(conn)
            req_answer_new_id_t15 = get_new_id_in_table_15(conn)

            if isinstance(req_answer_new_id_t8, list): return [False, "its list, error with DB - 1 - req_answer_new_id_t8"]
            if isinstance(req_answer_last_job_t24, list): return [False, "its list, error with DB - 2 - req_answer_last_job_t24"]
            if isinstance(req_answer_new_id_t15, list): return [False, "its list, error with DB - 3 - req_answer_new_id_t15"]

            req_answer_new_user_meeting_count = get_meeting_count_of_user(conn, 
                                                              start_record_id = req_answer_last_job_t24['last_id_in_table_8'],
                                                              end_record_id = req_answer_new_id_t8['record_id']
                                                              )
            
            if not req_answer_new_user_meeting_count[0]: return [False, "its list, error with DB - 4 - req_answer_new_user_meeting_count"]

            req_answer_new_meeting_avg_rating_creator = get_meetid_avgrating_creator(conn, 
                                                              start_record_id = req_answer_last_job_t24['last_id_in_table_8'],
                                                              end_record_id = req_answer_new_id_t8['record_id']                                                                             
                                                              )
            
            if not req_answer_new_meeting_avg_rating_creator[0]: return [False, "its list, error with DB - 5 - req_answer_new_meeting_avg_rating_creator"]

            req_answer_who_rating_by_whom_value = get_rated_rating_value_of_users(conn, 
                                                              start_record_id = req_answer_last_job_t24['last_id_in_table_15'],
                                                              end_record_id = req_answer_new_id_t15['record_id']
                                                              )
            
            if not req_answer_who_rating_by_whom_value[0]: return [False, "its list, error with DB - 6 - req_answer_who_rating_by_whom_value"]
            
            return {"req_answer_new_user_meeting_count":req_answer_new_user_meeting_count,
                    "req_answer_new_meeting_avg_rating_creator": req_answer_new_meeting_avg_rating_creator,
                    "req_answer_who_rating_by_whom_value":req_answer_who_rating_by_whom_value}

    except Exception as error:
        return [False, error]


#dict_keys(['req_answer_new_user_meeting_count', 'req_answer_new_meeting_avg_rating_creator', 'req_answer_who_rating_by_whom_value'])
main_data_to_work = get_main_data_joba_to_t3()


# обработка информации о встречах, получаем на вход main_data_to_work['req_answer_new_meeting_avg_rating_creator']
# Прим.: ('meeting_id': 1, 'avg_meeting_rating': Decimal('6.0000000000000000'), 'ratings_count': 3, 'creator_user_id': 1) 
def process_meetings_ratings(meetings_ratings : list[dict]):
    meeting_ids = {
        "meeting_ids": [m["meeting_id"] for m in meetings_ratings]
    }

    creators_ids = {
        "creators_ids": set([m["creator_user_id"] for m in meetings_ratings])
    }

    # второй словарь: исходный список словарей как есть
    original = {
        "meetings": meetings_ratings
    }

    return {"meeting_ids":meeting_ids, "creators_ids":creators_ids, "original":original}

processed_meetings = process_meetings_ratings(main_data_to_work['req_answer_new_meeting_avg_rating_creator'])


# сначала получаем старую информацию о встречах. На вход получаем main_data_to_work['req_answer_new_meeting_avg_rating_creator'],
# чтобы искать информацию только об этих встречах. Возвращаем rating_after_end,count_of_ratings
def get_prev_info_about_meetings(info_about_meetings : list[dict]):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                SELECT meeting_id,
                       rating_after_end,
                       count_of_ratings 
                FROM meeting_table_2
                WHERE meeting_id = ANY(%s);

                """, [info_about_meetings["meeting_ids"]["meeting_ids"]])
                answer_req =  cur.fetchall()
                info_about_meetings["prev_info_meetings"] = answer_req
                return info_about_meetings
    except Exception as error:
        return [False, error]
    
# dict_keys(['meeting_ids', 'creators_ids', 'original', 'prev_info_meetings'])
all_info_about_meetings = get_prev_info_about_meetings(processed_meetings)
# print(list(all_info_about_meetings["creators_ids"]["creators_ids"]))
# exit()

# фукнция обработки массива словарей req_answer_who_rating_by_whom_value, чтобы получить массив кортежей
# (rated_user_id, avg_rating_value, count_of_ratings)
def process_user_ratings(users_ratings : list[dict]):
    """
    Обрабатывает массив словарей с рейтингами и возвращает:
    [(rated_user_id, средний_рейтинг, количество_оценок), ...]
    """
    user_ratings = defaultdict(list)

    # Группируем оценки по rated_user_id
    for rating in users_ratings:
        user_ratings[rating['rated_user_id']].append(rating['rating_value'])
    
    all_result = []
    only_user_id = []
    for user_id, values in user_ratings.items():
        avg_rating = round(sum(values) / len(values), 2)
        count = len(values)
        only_user_id.append(user_id)
        all_result.append((user_id, avg_rating, count))
    
    return {"user_ids":only_user_id,
            "all_result":all_result} # [(user_id, avg_rating, count)...]


#dict_keys(['user_ids', 'all_result'])
processed_info_users = process_user_ratings(main_data_to_work['req_answer_who_rating_by_whom_value'])


# вывод существующий статистики нужных пользователей, их
# кол-во встреч, их кол-во оценок(всего и промежуточные)
# а также рейтинг и промежуточный рейтинг как для гостя так и для организатора 
def get_prev_data_users_t3(info_about_users : dict, info_about_creators : dict):
    new_list_of_ids = set(info_about_users["user_ids"] + list(info_about_creators))
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""

                    SELECT user_id,
                           meetings_visited_as_guest,
                           count_all_rating,
                           count_period_rating,
                           rating_as_guest,
                           intermediate_rating_as_guest,
                           meetings_created_as_organizer,   
                           rating_as_organizer,             
                           intermediate_rating_as_organizer,
                           count_period_meetings,
                           meetings_as_currency,
                           earned_currency
                    FROM user_extra_info_table_3
                    WHERE user_id = ANY(%s);

                """,[list(new_list_of_ids)])
                answer_req =  cur.fetchall()
                info_about_users["prev_info_users"] = answer_req
                return info_about_users
    except Exception as error:
        return [False, error]


#dict_keys(['user_ids', 'all_result', 'prev_info_users'])
#all_result = [(2, 8.04, 26),...], # id, avg rating, count ratings
prev_data_about_t3 = get_prev_data_users_t3(info_about_users = processed_info_users, 
                                            info_about_creators = list(all_info_about_meetings["creators_ids"]["creators_ids"]))


# обьединяем все информацию об изменениях:
# info_meetings - # dict_keys(['meeting_ids', 'creators_ids', 'original', 'prev_info_meetings'])
# info_ratings_users - #dict_keys(['user_ids', 'all_result', 'prev_info_users']) #all_result = [(2, 8.04, 26),...], # id, avg rating, count ratings
# info_meetings_count_users - [{'user_id': 1, 'meetings_count': 5}, ...]
# остается только все посчитать и внести изменения в табл meeting_table_2 чтобы изменить рейтинг встреч
# затем в табл 3 user_extra_info_table_3
def summrize_all_info(info_meetings : dict,
                      info_ratings_users : dict,
                      info_meetings_count_users : list[dict]):
    
    return {"info_meetings" : info_meetings, "info_ratings_users" : info_ratings_users, "info_meetings_count_users" : info_meetings_count_users}


# "info_meetings" : info_meetings, "info_ratings_users" : info_ratings_users, "info_meetings_count_users" : info_meetings_count_users
data_with_all_changes = summrize_all_info(info_meetings = all_info_about_meetings, 
      info_ratings_users = prev_data_about_t3, 
      info_meetings_count_users = main_data_to_work["req_answer_new_user_meeting_count"])


# начнем с изменения рейтинга встречи.
# 'meeting_id': , 'rating_after_end': , 'count_of_ratings': 
# нужно возвращать список словарей с такими ключами
# мы возвращаем новые значения полей 'meeting_id': , 'rating_after_end': , 'count_of_ratings': , а также creators_ids 
def make_dict_with_new_data_meetings(info_meetings : dict):
    meetings_ids = info_meetings["meeting_ids"]["meeting_ids"]
    changes_with_meetings = info_meetings["original"]["meetings"]
    prev_data_with_meetings = info_meetings["prev_info_meetings"]
    creators_ids = info_meetings["creators_ids"]

    # print(creators_ids)
    # print(meetings_ids) 
    # print("-" * 100)
    # print(changes_with_meetings)
    # print("-" * 100)
    # print(prev_data_with_meetings)
    # print("-" * 100)

    list_of_new_meetings_info = []

    m = 0
    for meeting_id in meetings_ids:
        new_count_multip_avgrating = 0.0 #вычисляем новую сумму произведений рейтинга на кол-во оценок
        new_count_of_ratings = changes_with_meetings[m]["ratings_count"] #общее кол-во оценок, но в этой строчке кол-во только новых оценок
        new_count_multip_avgrating = float(changes_with_meetings[m]["avg_meeting_rating"]) * new_count_of_ratings # считаем произведение новых оценок на их сред оценку

        new_count_multip_avgrating += float(prev_data_with_meetings[m]["rating_after_end"]) * prev_data_with_meetings[m]["count_of_ratings"]
        new_count_of_ratings += prev_data_with_meetings[m]["count_of_ratings"]

        new_rating_of_meeting = round(new_count_multip_avgrating / new_count_of_ratings, 2)

        list_of_new_meetings_info.append(
            {"meeting_id" : meeting_id,
             "rating_after_end" : new_rating_of_meeting,
             "count_of_ratings" : new_count_of_ratings,
             "creator_id" : changes_with_meetings[m]["creator_user_id"]
             }
        )

        m+=1

    return list_of_new_meetings_info, creators_ids


# получаем кортеж с где 0 это список словарей с новой информацией о встречах и 1 это создатели этих встреч
finished_info_meetings = make_dict_with_new_data_meetings(data_with_all_changes["info_meetings"])

# получаем окончательный результат всех изменений о пользователе
# нужно как то все обьединить а на выходе получить удобоваримый резлуьтат чтобы потом обновить БД
# 
# 'user_id': 4, 
# 'meetings_visited_as_guest': 0, 
# 'count_all_rating': 0,  
# 'rating_as_guest': Decimal('0.00'), 
# 'count_period_rating': 0,
# 'intermediate_rating_as_guest': Decimal('0.00'), 
#
# 'meetings_created_as_organizer': 0, 
# 'rating_as_organizer': Decimal('0.00'), 
# 'count_period_meetings': 0
# 'intermediate_rating_as_organizer': Decimal('0.00')

def get_fifnished_info_at_all(users_new_rating : dict, 
                              users_new_meetings : dict, 
                              meetings_new_info : dict):
    # print("-" * 100)
    # print(users_new_rating)
    # print("-" * 100)
    # print(users_new_meetings)
    # print("-" * 100)
    # print(meetings_new_info)
    # print("-" * 100)

    isPeriod = if_now_in_intermed_period(get_time_of_intermediate_period())

    new_info = []

    for user_info in users_new_rating["prev_info_users"]:
        user_id = user_info["user_id"] 
        meetings_visited_as_guest = user_info["meetings_visited_as_guest"]
        for new_count_meeting in users_new_meetings:
            if new_count_meeting["user_id"] == user_id:
                meetings_visited_as_guest += new_count_meeting["meetings_count"] 
            
                users_new_meetings.remove(new_count_meeting)
                break


        count_all_rating = user_info["count_all_rating"]
        rating_as_guest = float(user_info["rating_as_guest"])
        multip_all_count_rating = float(count_all_rating * rating_as_guest)


        delta_rating = 0
        delta_count = 0
        for delta_rating_users in users_new_rating["all_result"]:
            if delta_rating_users[0] == user_id:
                delta_rating = float(delta_rating_users[1])
                delta_count = delta_rating_users[2]
                multip_delta_count_rating = float(delta_rating * delta_count)

                users_new_rating["all_result"].remove(delta_rating_users)
                break

        
        multip_all_count_rating += multip_delta_count_rating
        count_all_rating += delta_count
        if count_all_rating != 0:
            rating_as_guest = round(multip_all_count_rating / count_all_rating, 2)


        if not isPeriod:
            count_period_rating = 0
            intermediate_rating_as_guest = 0
        else:
            count_period_rating = user_info["count_period_rating"]
            intermediate_rating_as_guest = float(user_info["intermediate_rating_as_guest"])
            multip_period_count_rating = float(count_period_rating * intermediate_rating_as_guest)

            multip_period_count_rating += multip_delta_count_rating
            count_period_rating += delta_count

            if count_period_rating != 0:
                intermediate_rating_as_guest = round(multip_period_count_rating / count_period_rating, 2)
            
        
        new_info.append({
            "user_id" : user_id,
            "meetings_visited_as_guest" : meetings_visited_as_guest,
            "count_all_rating":count_all_rating,
            "rating_as_guest":rating_as_guest,
            "count_period_rating" : count_period_rating,
            "intermediate_rating_as_guest" : intermediate_rating_as_guest,
            "meetings_created_as_organizer" : user_info["meetings_created_as_organizer"],
            "rating_as_organizer": user_info["rating_as_organizer"],
            "count_period_meetings": user_info["count_period_meetings"],
            "intermediate_rating_as_organizer" : user_info["intermediate_rating_as_organizer"],
            "meetings_as_currency": user_info["meetings_as_currency"],
            "earned_currency":user_info["earned_currency"]
        })


    for creator_id in meetings_new_info[1]["creators_ids"]:
        meetings_created_as_organizer, rating_as_organizer = 0, 0.0
        for meeting_info in meetings_new_info[0]:
            if meeting_info["creator_id"] == creator_id:
                meetings_created_as_organizer += 1
                rating_as_organizer += meeting_info["rating_after_end"]
        if meetings_created_as_organizer != 0:
            rating_as_organizer = round(rating_as_organizer / meetings_created_as_organizer, 2)
        # print({"creator_id":creator_id,
        #        "meetings_created_as_organizer" : meetings_created_as_organizer,
        #        "rating_as_organizer": rating_as_organizer
        #        })

        for user_info in new_info:
            if user_info["user_id"] == creator_id:
                multipl_meets_rating = float(user_info["meetings_created_as_organizer"]) * float(user_info["rating_as_organizer"])
                multipl_meets_rating += meetings_created_as_organizer * rating_as_organizer

                new_meetings_created_as_organizer = user_info["meetings_created_as_organizer"] + meetings_created_as_organizer

                rating_as_organizer = round(multipl_meets_rating / new_meetings_created_as_organizer,2)

                if not isPeriod: 
                    intermediate_rating_as_organizer = 0.0
                    new_count_meeting = 0
                else:
                    multip_meetings_rating_prev = user_info["count_period_meetings"] * float(user_info["intermediate_rating_as_organizer"])
                    new_count_meeting = user_info["count_period_meetings"] + meetings_created_as_organizer
                    multip_meetings_rating_prev += meetings_created_as_organizer * rating_as_organizer

                    if new_count_meeting != 0:
                        intermediate_rating_as_organizer = round(multip_meetings_rating_prev / new_count_meeting, 2)


                user_info["meetings_created_as_organizer"] = new_meetings_created_as_organizer
                user_info["rating_as_organizer"] = rating_as_organizer
                user_info["count_period_meetings"] = new_count_meeting
                user_info["intermediate_rating_as_organizer"] = intermediate_rating_as_organizer
    
    return new_info



# for info in get_fifnished_info_at_all(users_new_rating = data_with_all_changes["info_ratings_users"],
#                           users_new_meetings = data_with_all_changes["info_meetings_count_users"],
#                           meetings_new_info = finished_info_meetings
#                           ):
#     print(info)

# print("-" * 100)
finished_info_users = get_fifnished_info_at_all(users_new_rating = data_with_all_changes["info_ratings_users"],
                          users_new_meetings = data_with_all_changes["info_meetings_count_users"],
                          meetings_new_info = finished_info_meetings
                          )

print(finished_info_users)
exit()


# print(finished_info_meetings[0][:3])


# обновляем информацию в табл meeting_table_2, а именно rating_after_end, count_of_ratings
def update_meetings_info(conn, meetings_info_delta : list[dict]):
    try:
        with conn.cursor() as cur:

            for meeting in meetings_info_delta:

                cur.execute("""

                UPDATE meeting_table_2
                SET rating_after_end = %s, count_of_ratings = %s
                WHERE meeting_id = %s and status = 'finished';

                """, (meeting["rating_after_end"], meeting['count_of_ratings'], meeting['meeting_id']))

        conn.commit()

    except Exception as error:
        return [False, error]
    

# всталяем новые строчки данных о пользователях в табл 3
def insert_new_info_table3(conn, users_info_new : list[dict]):
    try:
        with conn.cursor() as cur:

            for users in users_info_new:

                cur.execute("""

                INSERT INTO user_extra_info_table_3
                (user_id, 
                meetings_visited_as_guest, count_all_rating, rating_as_guest, count_period_rating, intermediate_rating_as_guest,
                meetings_created_as_organizer, rating_as_organizer, count_period_meetings, intermediate_rating_as_organizer,
                meetings_as_currency, earned_currency)
                VALUES
                (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    users["user_id"], users["meetings_visited_as_guest"], users["count_all_rating"],
                    users["rating_as_guest"], users["count_period_rating"], users["intermediate_rating_as_guest"],
                    users["meetings_created_as_organizer"], users["rating_as_organizer"], users["count_period_meetings"],
                    users["intermediate_rating_as_organizer"], users["meetings_as_currency"], users["earned_currency"]
                ))

            conn.commit()

    except Exception as error:
        return [False, error]
    
#работает!
# with psycopg.connect(DSN) as conn:
#     print(finished_info_meetings[0][:2])
#     update_meetings_info(conn, finished_info_meetings[0][:2])

# with psycopg.connect(DSN) as conn:
#     print(finished_info_users[:3])
#     print(insert_new_info_table3(conn, finished_info_users[:3]))