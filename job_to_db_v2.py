"""
Это вторая версия кода который должен обслуживать user_extra_info_table_3
Учитывая ошибки прошлого опишу здесь логику процесса:
    ---получаем только idшники---
    1 Получаем последенюю информацию из таблицы job_helper_table_24, а точнее last_id_in_table_8, last_id_in_table_15 -
        - то есть последние record_id в каждой из этих таблиц, на чем джоба в прошлый раз остновилась
    2 Получаем последний record_id в таблице meeting_rating_table_8, называем его new_record_id_t8
    3 Получаем последний record_id в таблице user_ratings_table_15, называем его new_record_id_t15
    ---начинаем получать данные---
    4 Получаем из таблицы meeting_rating_table_8 информацию след вида 
        user_id, COUNT(meeting_id), причем из этой таблицы данные берем от 
        record_id = last_id_in_table_8 и до record_id = new_record_id_t8.
        То есть сколько поль-ль посетил встреч с last_id_in_table_8.
        Называем этот массив raw_1_users_count_meetings. Этот шаг не нужен так как просчет кол-ва встреч
        нужно делать в другом месте. Эта джоба будет считать только рейтинги пользователей и встреч.
    5 Получаем из таблицы meeting_rating_table_8 информацию след вида 
        mrt.meeting_id,
        AVG(mrt.meeting_rating) AS avg_meeting_rating,
        COUNT(mrt.meeting_rating) AS ratings_count,  -- количество оценок для каждой встречи
        mt.creator_user_id. То есть среднюю оценку, кол-во оценок и создателя 
        каждой встречи информация о которой появилась с last_id_in_table_8.
        Называем этот массив raw_1_meetings_info. **изменено. см в коде**
    6 Получаем из таблицы user_ratings_table_15 информацию след вида 
        rated_user_id, rating_value, 
        причем из этой таблицы данные берем от 
        record_id = last_id_in_table_15 и до record_id = new_record_id_t15.
        То есть сколько раз и как поль-ля оценили с last_id_in_table_15.
        Называем этот массив raw_1_users_ratings.
    **Комментарий: нам нужно сделать список всех user_id, которых либо оценили,
                   либо они сходили на встречи,
                   либо его встречи были оценены**
    7 Массив raw_1_users_ratings преобразуем в массив словарей 
        вида [{user_id, avg_rating, count_ratings}]. Называем его raw_2_users_ratings.
    8 Обьединяем массивы raw_1_users_count_meetings и raw_2_users_ratings. Чтобы получить
        массив словарей вида [{user_id, avg_rating, count_ratings, count_new_meetings}].
        Называем его raw_1_users_info. Шаг не нужен так как просчет встреч делаем не здесь.
    **Комментарий: на данном этапе мы имеем переменные
        last_id_in_table_8 - id записи ОТ которой мы обрабатываем табл 8,
        last_id_in_table_15 - id записи ОТ которой мы обрабатываем табл 15,
        new_record_id_t8 - id записи ДО которой мы обрабатываем табл 8,
        new_record_id_t15 - id записи ДО которой мы обрабатываем табл 15, 
        raw_1_users_info - массив вида [{user_id, avg_rating, count_ratings, count_new_meetings},...], 
        raw_1_meetings_info - массив вида [{meeting_id, avg_meeting_rating, ratings_count, creator_user_id},...].
    9 Получаем все user_id которых либо оценили, либо их встречи были оценены, либо посетили встречи
    10 Получаем все meeting_id которые были оценены
    11 Получаем старую информацию о всех пользователях, которые есть в списке users_ids
    12 Получаем старую информацию о всех встречах, которые есть в списке meetings_ids
    13 Получаем инф-ию о текущем промежуточном периоде
    14 Проверяем сегодняшнюю дату на вхождение в промежуточный период
    15 Совмещаем старую и новую информации о пользователях.
    16 Совмещаем инф-ию о встречах с пользователями для организаторов.
        Расчитываем инф-ию earned_currency у организаторов
    17 Обновляем инф-ию о встречах с помощью raw_1_meetings_info и prev_info_meetings

    18 Обновляем таблицу встреч meeting_table_2
    19 обновляем таблицу user_extra_info_table_3
    20 обновляем таблицу job_helper_table_24
    21 если нужно обновляем период start_end_trial_period_table_25
  
    **XX** Если момент работы джобы не входит промеж период то обновляем период

    **XX** Если пользователь не оценил встречу то происходит ошибка так как idшник табл 8 сдвигается и не возвращается к встрече
    **Если встреча просто завершилась, то создателю в поля
    meetings_created_as_organizer,
    count_period_meetings
    ничего не добавиться. Пока оставим как есть!!!!.**
    **Нужно создавать триггеры когда вызывать джобу, то есть например пользователя оценили**
    **Если встреча просто завершилась, то создателю в поля
    meetings_created_as_organizer,
    count_period_meetings
    ничего не добавиться. Пока оставим как есть!!!!.
    **
    **Табл 8 нужно изменить. Так как хранить там оценки и тех кто там зарегался тяжело**
"""


from important_info import DSN

import psycopg
from psycopg.rows import dict_row
from collections import defaultdict
from datetime import datetime






"""
Шаг 1. Получаем последенюю информацию из таблицы job_helper_table_24, 
    а точнее last_id_in_table_8, last_id_in_table_15 -
    - то есть последние record_id в каждой из этих таблиц, 
    на чем джоба в прошлый раз остновилась. 
    Возвращаем словарь вида: {'last_id_in_table_8': 1, 'last_id_in_table_15': 1} (тип 1)
"""
def get_data_from_table_24(cur):
    try:
        cur.execute("""

        SELECT last_id_in_table_26, last_id_in_table_15 
        FROM job_helper_table_24
        ORDER BY job_id DESC LIMIT 1;
        
        """)

        return cur.fetchall()[0]
    except Exception as error:
        return (False, error, "get_data_from_table_24")


"""
Шаг 2. Получаем последний record_id в таблице meeting_rating_table_8, 
    называем его new_record_id_t8. Данные: (тип 1)
"""
def get_new_record_id_table_8(cur):
    try:
        cur.execute("""

        SELECT record_id FROM meeting_rating_info_table_26
        ORDER BY record_id DESC
        LIMIT 1;

        """)
        
        return cur.fetchall()[0]
    except Exception as error:
        return (False, error, "get_new_record_id_table_8")


"""
Шаг 3. Получаем последний record_id в таблице user_ratings_table_15, 
    называем его new_record_id_t15. Данные: (тип 1)
"""
def get_new_record_id_table_15(cur):
    try:
        cur.execute("""

        SELECT record_id FROM user_ratings_table_15
        ORDER BY record_id DESC
        LIMIT 1;

        """)

        return cur.fetchall()[0]
    except Exception as error:
        return (False, error, "get_new_record_id_table_15")


"""
Шаг 4. Получаем из таблицы meeting_rating_table_8 информацию след вида 
    user_id, COUNT(meeting_id), причем из этой таблицы данные берем от 
    record_id = last_id_in_table_8 и до record_id = new_record_id_t8.
    То есть сколько поль-ль посетил встреч с last_id_in_table_8.
    Называем этот массив raw_1_users_count_meetings. Данные: список словарей
"""
# def get_users_count_meetings_table_8(cur, start_record_id : int, end_record_id : int):
#     try:
#         cur.execute("""

#         SELECT 
#             user_id,
#             COUNT(meeting_id) AS meetings_count
#         FROM meeting_rating_table_8
#         WHERE user_action = 'attended' AND record_id BETWEEN %s AND %s
#         GROUP BY user_id
#         ORDER BY user_id;
        
#         """, (start_record_id, end_record_id))

#         return cur.fetchall()
#     except Exception as error:
#         return (False, error, "get_users_count_meetings_table_8")


"""
Шаг 5. Получаем из таблицы meeting_rating_table_8 информацию след вида 
    mrt.meeting_id,
    AVG(mrt.meeting_rating) AS avg_meeting_rating,
    COUNT(mrt.meeting_rating) AS ratings_count,  -- количество оценок для каждой встречи
    COUNT(DISTINCT mrt.user_id) AS users_count,
    mt.creator_user_id. То есть среднюю оценку, кол-во оценок и создателя 
    каждой встречи информация о которой появилась с last_id_in_table_8, а также
    сколько людей либо посетили встречу, либо пропустили ее, но нам неважно пропустил
    ли пользователь встречу, так как организатор в любом случае должен получить за нее
    прибыль. С пропустившего встречу пользователя встреча все равно снимается.
    Называем этот массив raw_1_meetings_info. Данные: список словарей.
"""
def get_meetings_ratings_table_8(cur, start_record_id : int, end_record_id : int):
    try:
        cur.execute("""

        SELECT 
            mrt.meeting_id,
            AVG(mrt.meeting_rating) AS avg_meeting_rating,
            COUNT(mrt.meeting_rating) AS ratings_count,          -- сколько оценок
            COUNT(DISTINCT mrt.user_id) AS users_count,          -- сколько уникальных user_id
            mt.creator_user_id
        FROM meeting_rating_info_table_26 mrt
        INNER JOIN meeting_table_2 mt 
            ON mrt.meeting_id = mt.meeting_id
        AND mt.status = 'finished'
        AND mrt.meeting_rating IS NOT NULL  
        AND mrt.record_id BETWEEN %s AND %s
        GROUP BY mrt.meeting_id, mt.creator_user_id
        ORDER BY mrt.meeting_id;

        """, (start_record_id, end_record_id))

        return cur.fetchall()
    except Exception as error:
        return (False, error, "get_meetings_ratings_table_8")


"""
Шаг 6. Получаем из таблицы user_ratings_table_15 информацию след вида 
    rated_user_id, rating_value, 
    причем из этой таблицы данные берем от 
    record_id = last_id_in_table_15 и до record_id = new_record_id_t15.
    То есть сколько раз и как поль-ля оценили с last_id_in_table_15.
    Называем этот массив raw_1_users_ratings.
"""
def get_users_rating_table_15(cur, start_record_id : int, end_record_id : int):
    try:
        cur.execute("""

        SELECT rated_user_id, rating_value 
        FROM user_ratings_table_15 
        WHERE record_id between %s and %s;
        
        """, (start_record_id, end_record_id))

        return cur.fetchall()
    except Exception as error:
        return (False, error, "get_users_rating_table_15")


"""
Шаг 7. Массив raw_1_users_ratings преобразуем в массив словарей 
    вида [{user_id, avg_rating, count_ratings}]. Называем его raw_2_users_ratings.
    Преобразует список оценок в статистику по пользователям.
    ratings_data: [{'rated_user_id': 2, 'rating_value': 8}, ...]
    Возвращает: [{'user_id': 2, 'avg_rating': 8.12, 'count_ratings': 15}, ...]
"""
def process_users_ratings(ratings_data : list[dict]):

    user_ratings = defaultdict(list)
    
    for item in ratings_data:
        user_id = item['rated_user_id']
        rating = item['rating_value']
        user_ratings[user_id].append(rating)
    
    result = []
    for user_id, ratings in user_ratings.items():
        count = len(ratings)
        avg_rating = sum(ratings) / count
        
        result.append({
            'user_id': user_id,
            'avg_rating': round(avg_rating, 2),
            'count_ratings': count
        })
    
    return sorted(result, key=lambda x: x["user_id"])


"""
Шаг 8. Обьединяем массивы raw_1_users_count_meetings и raw_2_users_ratings. Чтобы получить
    массив словарей вида [{user_id, avg_rating, count_ratings, count_new_meetings}].
    Называем его raw_1_users_info.
    На выходе должны получить массив словарей вида:
    [{
    user_id, new_meetings, new_avg_rating, new_count_ratings
    }, ...].
    Объединяет данные о встречах и рейтингах.
    
    meetings_data: [{'user_id': 1, 'meetings_count': 5}, ...]
    ratings_data: [{'user_id': 1, 'avg_rating': 7.95, 'count_ratings': 21}, ...]
    
    Возвращает: [{'user_id': 1, 'new_meetings': 5, 'new_avg_rating': 7.95, 'new_count_ratings': 21}, ...]
"""
# def merge_users_count_ratings(users_count_meetings : list[dict],
#                               users_ratings : list[dict]):
#     # Преобразуем в словари для быстрого поиска
#     meetings_dict = {m['user_id']: m['meetings_count'] for m in users_count_meetings}
#     ratings_dict = {r['user_id']: {
#         'avg_rating': r['avg_rating'], 
#         'count_ratings': r['count_ratings']
#     } for r in users_ratings}
    
#     # Все user_id из обоих списков
#     all_user_ids = set(meetings_dict.keys()) | set(ratings_dict.keys())
    
#     result = []
#     for user_id in sorted(all_user_ids):  # сортировка для стабильности
#         meetings_count = meetings_dict.get(user_id, 0)
#         rating_info = ratings_dict.get(user_id, {'avg_rating': 0, 'count_ratings': 0})
        
#         result.append({
#             'user_id': user_id,
#             'new_meetings': meetings_count,
#             'new_avg_rating': rating_info['avg_rating'],
#             'new_count_ratings': rating_info['count_ratings']
#         })
    
#     return result


"""
Шаг 9. Получаем все user_id которых либо оценили, либо их встречи были оценены
Шаг 10. Получаем все meeting_id которые были оценены
"""
def get_all_user_ids(users_info : list[dict], meetings_info : list[dict]):
    result_users_ids = []
    result_meetings_ids = []

    for user_info in users_info:
        result_users_ids.append(user_info["user_id"])
    for meeting_info in meetings_info:
        result_users_ids.append(meeting_info["creator_user_id"])
        result_meetings_ids.append(meeting_info["meeting_id"])

    return list(set(result_users_ids)), list(set(result_meetings_ids))


"""
Шаг 11. Получаем старую информацию о всех пользователях, которые есть в списке users_ids
"""
def get_prev_info_users_table_3(cur,list_of_users_ids : list[int]):
    try:
        cur.execute("""

        SELECT 
            user_id,
            meetings_visited_as_guest,
            rating_as_guest,
            intermediate_rating_as_guest,
            meetings_created_as_organizer,
            rating_as_organizer,
            intermediate_rating_as_organizer,
            meetings_as_currency,
            earned_currency,
            count_all_rating,
            count_period_rating,
            count_period_meetings
        FROM (
            SELECT *,
                ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY record_id DESC) as rn
            FROM user_extra_info_table_3
        ) ranked
        WHERE rn = 1 AND user_id = ANY(%s)
        ORDER BY user_id ASC;

        """, [list_of_users_ids])

        return cur.fetchall()
    except Exception as error:
        return (False, error, "get_prev_info_users_table_3")
    

"""
Шаг 12 Получаем старую информацию о всех встречах, которые есть в списке meetings_ids
"""
def get_prev_info_meetings_table_2(cur, list_of_meetings_ids : list[int]):
    try:
        cur.execute("""

        SELECT meeting_id, rating_after_end, count_of_ratings 
        FROM meeting_table_2
        WHERE meeting_id = ANY(%s) and status = 'finished';

        """, [list_of_meetings_ids])

        return cur.fetchall()
    except Exception as error:
        return (False, error, "get_prev_info_meetings_table_2")


"""
Шаг 13. Получаем инф-ию о текущем промежуточном периоде.
"""
def get_info_intermed_period_table_25(cur):
    try:
        cur.execute("""

        SELECT start_trial_period, end_trial_period 
        FROM start_end_trial_period_table_25
        ORDER BY period_id DESC
        LIMIT 1;
        
        """)

        return cur.fetchall()[0]
    except Exception as error:
        return (False, error, "get_info_intermed_period_table_25")


"""
Шаг 14. Проверяем входит ли сегодняшняя дата в промежуточный период.
"""
def if_now_in_intermed_period(period : dict):
    if not period["start_trial_period"] <= datetime.now() <= period["end_trial_period"]:
        return False
    return True


"""
Шаг ХХ. Обновляем даты промежуточного периода.
"""
def update_intermediate_period(cur):
    try:
        cur.execute("""

        INSERT INTO start_end_trial_period_table_25 
        (start_trial_period, end_trial_period)
        VALUES 
        (NOW(), NOW() + INTERVAL '2 day');
        
        """)

    except Exception as error:
        return (False, error, "update_intermediate_period")


"""
Шаг 15 Совмещаем старую и новую информации о пользователях. 
Выход список словарей с данными. 
    user_id,

    meetings_visited_as_guest(changed),
    count_all_rating(changed),
    rating_as_guest(changed),
    count_period_rating(changed),
    intermediate_rating_as_guest(changed),

    meetings_created_as_organizer(заполняем как в prev_info),
    rating_as_organizer(заполняем как в prev_info),
    count_period_meetings(заполняем как в prev_info),
    intermediate_rating_as_organizer(заполняем как в prev_info),

    meetings_as_currency(заполняем как в prev_info),
    earned_currency(заполняем как в prev_info)

prev_info: [{'user_id': 1, 'meetings_visited_as_guest': 0, 'rating_as_guest': Decimal('0.00'), 
'intermediate_rating_as_guest': Decimal('0.00'), 'meetings_created_as_organizer': 0, 
'rating_as_organizer': Decimal('0.00'), 'intermediate_rating_as_organizer': Decimal('0.00'), 
'meetings_as_currency': 0, 'earned_currency': Decimal('0.00'), 'count_all_rating': 0, 
'count_period_rating': 0, 'count_period_meetings': 0},...]

delta_info: [{'user_id': 1, 'avg_rating': 7.95, 'count_ratings': 21},...]
"""
def update_users_info(prev_info : list[dict], delta_info : list[dict], isPeriod : bool):
    try:
        for new_info_user in prev_info:
            for delta_info_user in delta_info:
                if new_info_user["user_id"] == delta_info_user["user_id"]:
                    if (new_info_user["count_all_rating"] + delta_info_user["count_ratings"]) != 0:

                        new_info_user["rating_as_guest"] = round( \
                            (new_info_user["count_all_rating"] * float(new_info_user["rating_as_guest"]) + \
                            delta_info_user["count_ratings"] * float(delta_info_user["avg_rating"])) / \
                            (new_info_user["count_all_rating"] + delta_info_user["count_ratings"]), 2)
                        new_info_user["count_all_rating"] += delta_info_user["count_ratings"]

                        if isPeriod:
                            new_info_user["intermediate_rating_as_guest"] = round( \
                                (new_info_user["count_period_rating"] * float(new_info_user["intermediate_rating_as_guest"]) + \
                                delta_info_user["count_ratings"] * float(delta_info_user["avg_rating"])) / \
                                (new_info_user["count_period_rating"] + delta_info_user["count_ratings"]), 2)
                            new_info_user["count_period_rating"] += delta_info_user["count_ratings"]
                        else:
                            new_info_user["intermediate_rating_as_guest"] = 0.0
                            new_info_user["count_period_rating"] = 0
                        
                        # delta_info.remove(delta_info_user)
                    break

        return prev_info
    except Exception as error:
        return (False, error, "update_users_info")


"""
Шаг 16 Совмещаем инф-ию о встречах с пользователями для организаторов. 
Выход список словарей с данными. 
    user_id,

    meetings_visited_as_guest(как из шага 15),
    count_all_rating(как из шага 15),
    rating_as_guest(как из шага 15),
    count_period_rating(как из шага 15),
    intermediate_rating_as_guest(как из шага 15),

    meetings_created_as_organizer(changed),
    rating_as_organizer(changed),
    count_period_meetings(changed),
    intermediate_rating_as_organizer(changed),

    meetings_as_currency(как из шага 15),
    earned_currency(как из шага 15)

updated_info: [{'user_id': 1, 'meetings_visited_as_guest': 5, 
            'rating_as_guest': 7.95, 'intermediate_rating_as_guest': 0.0, 
            'meetings_created_as_organizer': 0, 'rating_as_organizer': Decimal('0.00'), 
            'intermediate_rating_as_organizer': Decimal('0.00'), 'meetings_as_currency': 0, 
            'earned_currency': Decimal('0.00'), 'count_all_rating': 21, 
            'count_period_rating': 0, 'count_period_meetings': 0},...]

info_meetings = [{'meeting_id': 6, 'rating_after_end': 6.6, 'count_of_ratings': 5, 'creator_user_id': 4},...]

"""
def finish_update_users_info(updated_info : list[dict],
                             info_meetings : list[dict],
                             isPeriod : bool):
    # copy_info_meetings = info_meetings.copy()    
    try:
        for meeting in info_meetings:
            for user in updated_info:
                if user["user_id"] == meeting["creator_user_id"]:

                    user["rating_as_organizer"] = round( \
                        (float(user["rating_as_organizer"]) - float(user["rating_as_organizer"]) / user["meetings_created_as_organizer"]) \
                              + meeting["rating_after_end"] / user["meetings_created_as_organizer"]
                        , 2)
                    
                    #user["meetings_created_as_organizer"] += 1 #- будем считать что как только встреча завершилась мы тут же добавляем +1 к встречам у организатора

                    if isPeriod:
                        user["intermediate_rating_as_organizer"] = round( \
                            (float(user["intermediate_rating_as_organizer"]) - float(user["intermediate_rating_as_organizer"]) / user["count_period_meetings"]) \
                                + meeting["rating_after_end"] / user["count_period_meetings"] 
                            , 2)
                        
                        #user["count_period_meetings"] += 1 #- будем считать что как только встреча завершилась мы тут же добавляем +1 к встречам у организатора
                    else:
                        user["intermediate_rating_as_organizer"] = 0.0
                        user["count_period_meetings"] = 0

                    # copy_info_meetings.remove(meeting)
                    break
        
        return updated_info
    except Exception as error:
        return (False, error, "finish_update_users_info")


"""
Шаг 17. Обновляем инф-ию о встречах с помощью raw_1_meetings_info и prev_info_meetings

raw_1_meetings_info:
    [{'meeting_id': 1, 
    'avg_meeting_rating': Decimal('6.0000000000000000'), 
    'ratings_count': 3, 'users_count': 3, 'creator_user_id': 1},...]
prev_info_meetings:
    [{'meeting_id': 9, 'rating_after_end': Decimal('0.00'), 'count_of_ratings': 0},...]
Нужно привести к виду как prev_info_meetings только с учетом обновленных данных

"""
def finish_update_meetings_info(prev_info : list[dict],
                                delta_meetings : list[dict]):
    try:
        for meeting in prev_info:
            for delta_info in delta_meetings:
                if meeting["meeting_id"] == delta_info["meeting_id"]:
                    meeting["rating_after_end"] = round( \
                    (float(meeting["rating_after_end"]) * meeting["count_of_ratings"] + \
                    float(delta_info["avg_meeting_rating"]) * delta_info["ratings_count"]) / \
                    (meeting["count_of_ratings"] + delta_info["ratings_count"]), 2)

                    meeting["count_of_ratings"] += delta_info["ratings_count"]

                    meeting["creator_user_id"] = delta_info["creator_user_id"]

                    meeting["users_count"] = delta_info["users_count"]

                    break
        
        return prev_info
    except Exception as error:
        return (False, error, "finish_update_meetings_info")


"""
Шаг 18. Обновляем таблицу встреч meeting_table_2
Вход данные: 
[{'meeting_id': 9, 'rating_after_end': 6.67, 'count_of_ratings': 3},...]
"""
def update_db_table_2(cur, meetings_info : list[dict]):
    try:
        for meeting in meetings_info:

            cur.execute("""

            UPDATE meeting_table_2
            SET rating_after_end = %s, count_of_ratings = %s
            WHERE meeting_id = %s and status = 'finished';
            
            """, (meeting["rating_after_end"], 
                  meeting["count_of_ratings"],
                  meeting["meeting_id"]
                  ))

    except Exception as error:
        return (False, error, "update_db_table_2")


"""
Шаг 19. Обновляем таблицу user_extra_info_table_3
[{'user_id': 1, 
'meetings_visited_as_guest': 5, 
'rating_as_guest': 7.95, 
'intermediate_rating_as_guest': 7.95, 
'meetings_created_as_organizer': 1, 
'rating_as_organizer': 6.0, 
'intermediate_rating_as_organizer': 6.0, 
'meetings_as_currency': 0, 'earned_currency': 2.25, 
'count_all_rating': 21, 
'count_period_rating': 21, 
'count_period_meetings': 1},..]
"""
def update_db_table_3(cur, users_info : list[dict]):
    try:
        for user in users_info:

            cur.execute("""

            INSERT INTO user_extra_info_table_3
            (user_id, 
            meetings_visited_as_guest, rating_as_guest, intermediate_rating_as_guest,
            meetings_created_as_organizer, rating_as_organizer, intermediate_rating_as_organizer,
            meetings_as_currency, earned_currency, 
            count_all_rating, count_period_rating, count_period_meetings)
            VALUES
            (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (
                user["user_id"], user["meetings_visited_as_guest"],
                user["rating_as_guest"], user["intermediate_rating_as_guest"],
                user["meetings_created_as_organizer"], user["rating_as_organizer"],
                user["intermediate_rating_as_organizer"], user["meetings_as_currency"],
                user["earned_currency"], user["count_all_rating"],
                user["count_period_rating"], user["count_period_meetings"]
            ))

    except Exception as error:
        return (False, error, "update_db_table_3")
    

"""
Шаг 20. Обновляем таблицу job_helper_table_24.
"""
def update_db_table_24(cur, 
                       new_record_id_t8 : int, 
                       new_record_id_t15 : int,
                       count_rows : int):
    try:
        cur.execute("""

        INSERT INTO job_helper_table_24 
        (last_id_in_table_8, last_id_in_table_15, rows_changed_in_table_3)
        VALUES
        (%s, %s, %s);
        """, (new_record_id_t8, new_record_id_t15, count_rows))

    except Exception as error:
        return (False, error, "update_db_table_24")


"""
Единственная функция которая будет запускаться. Она будет
выполнять все фукнции для изменения табл 3.
"""
def main_job():
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:

                # здесь получили последние idшники, которые последняя джоба обработала
                data_from_t24 =  get_data_from_table_24(cur)
                if isinstance(data_from_t24, tuple): return data_from_t24
                last_id_in_table_26 = data_from_t24["last_id_in_table_26"]
                last_id_in_table_15 = data_from_t24["last_id_in_table_15"]

                # здесь получаем последний record_id в table 8
                data_from_t26 = get_new_record_id_table_8(cur)
                if isinstance(data_from_t26,tuple):return data_from_t26
                new_record_id_t26 = data_from_t26["record_id"]

                # здесь получаем последний record_id в table 15
                data_from_t15 = get_new_record_id_table_15(cur)
                if isinstance(data_from_t15,tuple):return data_from_t15
                new_record_id_t15 = data_from_t15["record_id"]

                # здесь получаем raw_1_meetings_info. То есть средние оценки
                # и другие данные встреч, которые появились
                raw_1_meetings_info = get_meetings_ratings_table_8(cur, 
                                                                    start_record_id = last_id_in_table_26,
                                                                    end_record_id = new_record_id_t26)
                if isinstance(raw_1_meetings_info, tuple): return raw_1_meetings_info

                # здесь получаем raw_1_users_ratings, то есть список словарей, кого оценили
                # и на какую оценку
                raw_1_users_ratings = get_users_rating_table_15(cur,
                                                                start_record_id = last_id_in_table_15,
                                                                end_record_id = new_record_id_t15)
                if isinstance(raw_1_users_ratings, tuple): return raw_1_users_ratings

                # здесь получаем raw_2_users_ratings, то есть список словарей вида
                # [{'user_id': 2, 'avg_rating': 8.0, 'count_ratings': 1},..]
                raw_2_users_ratings = process_users_ratings(ratings_data=raw_1_users_ratings)

                # получаем всех пользователей, которые либо посетили встречи, либо их оценили, либо их встречи оценили
                # получаем все встречи, которые были оценены
                users_ids, meetings_ids = get_all_user_ids(meetings_info=raw_1_meetings_info,
                                             users_info=raw_2_users_ratings)
                

                # предыдущая информация о пользователях которые есть в users_ids.
                # list[dict] - данные.
                prev_info_users = get_prev_info_users_table_3(cur, users_ids)

                # предыдущая информация о встречах котораые есть в meetings_ids.
                # list[dict].
                prev_info_meetings = get_prev_info_meetings_table_2(cur, meetings_ids)

                # получаем инф-ию о текущем периоде, получаем даты
                date_of_period = get_info_intermed_period_table_25(cur)

                # сегодня входит в промежуточный период?
                isPeriod = if_now_in_intermed_period(date_of_period)

                # обновляем инф-ию о пользователе, получаем массив словарей, изменяем только рейтинг визитеров
                updated_users_info = update_users_info(prev_info=prev_info_users, 
                                                       delta_info=raw_2_users_ratings,
                                                       isPeriod=isPeriod)
                
                if isinstance(updated_users_info, tuple): return updated_users_info

                # обновляем поля встреч
                finished_meetings_info = finish_update_meetings_info(prev_info=prev_info_meetings,
                                                                     delta_meetings=raw_1_meetings_info)
                
                if isinstance(finished_meetings_info, tuple): return finished_meetings_info

                return finished_meetings_info

                # почти доводим дело с поль-ями до конца, учитываем встречи
                finished_users_info = finish_update_users_info(updated_info = updated_users_info,
                                                               info_meetings = finished_meetings_info,
                                                               isPeriod = isPeriod)
                
                if isinstance(finished_users_info, tuple): return finished_users_info

                # # обновляем табл 2, встречи
                # update_db_table_2(cur, finished_meetings_info)

                # # обновляем табл 3, доп инф-я о пользователе
                # update_db_table_3(cur, finished_users_info)

                # # обновляем табл 24
                # update_db_table_24(cur, 
                #                    new_record_id_t8=new_record_id_t8 + 1, # берем +1 так как в след раз с нее начнем
                #                    new_record_id_t15=new_record_id_t15 + 1,
                #                    count_rows=len(finished_users_info))

                #если нет то обновляем(ну на самом деле не сразу должно быть, пока для теста так)
                if not isPeriod: update_intermediate_period(cur)

                cur.connection.commit()
        return True
    except Exception as error:
        return [False, error]

print(main_job())