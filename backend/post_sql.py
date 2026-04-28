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


# функция отменяет встречу организатором (меняет статус на 'canceled')
def MEETINGS_cancel_by_organizer(meeting_id: int, user_id: int):
    """
    Отменяет встречу организатором.
    Проверяет, что пользователь является создателем встречи и статус позволяет отмену.
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                # Проверяем, что пользователь - создатель встречи и статус допускает отмену
                cur.execute("""
                    SELECT creator_user_id, status
                    FROM meeting_table_2
                    WHERE meeting_id = %s
                """, (meeting_id,))
                meeting = cur.fetchone()
                
                if not meeting:
                    return (False, "Встреча не найдена", "MEETINGS_cancel_by_organizer")
                
                if meeting["creator_user_id"] != user_id:
                    return (False, "Только создатель может отменить встречу", "MEETINGS_cancel_by_organizer")
                
                if meeting["status"] not in ['created', 'in_progress']:
                    return (False, f"Нельзя отменить встречу со статусом '{meeting['status']}'", "MEETINGS_cancel_by_organizer")
                
                # Обновляем статус на 'canceled'
                cur.execute("""
                    UPDATE meeting_table_2
                    SET status = 'canceled'
                    WHERE meeting_id = %s
                    RETURNING meeting_id, status
                """, (meeting_id,))
                
                result = cur.fetchone()
                conn.commit()
                
                return {
                    "meeting_id": result["meeting_id"],
                    "status": result["status"],
                    "success": True,
                    "message": "Встреча успешно отменена"
                }
    except Exception as error:
        return (False, error, "MEETINGS_cancel_by_organizer")


def MEETINGS_finish_by_organizer(meeting_id: int, user_id: int):
    """
    Завершает встречу организатором.
    Проверяет, что пользователь является создателем встречи и статус позволяет завершение.
    Статус меняется на 'in_progress' (встреча идёт/завершена, ожидает оценки участников).
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                # Проверяем, что пользователь - создатель встречи и статус допускает завершение
                cur.execute("""
                    SELECT creator_user_id, status
                    FROM meeting_table_2
                    WHERE meeting_id = %s
                """, (meeting_id,))
                meeting = cur.fetchone()
                
                if not meeting:
                    return (False, "Встреча не найдена", "MEETINGS_finish_by_organizer")
                
                if meeting["creator_user_id"] != user_id:
                    return (False, "Только создатель может завершить встречу", "MEETINGS_finish_by_organizer")
                
                if meeting["status"] != 'created':
                    return (False, f"Нельзя завершить встречу со статусом '{meeting['status']}'", "MEETINGS_finish_by_organizer")
                
                # Обновляем статус на 'in_progress'
                cur.execute("""
                    UPDATE meeting_table_2
                    SET status = 'in_progress'
                    WHERE meeting_id = %s
                    RETURNING meeting_id, status
                """, (meeting_id,))
                
                result = cur.fetchone()
                conn.commit()
                
                return {
                    "meeting_id": result["meeting_id"],
                    "status": result["status"],
                    "success": True,
                    "message": "Встреча успешно завершена"
                }
    except Exception as error:
        return (False, error, "MEETINGS_finish_by_organizer")


def MEETINGS_save_participants_ratings(record_id: int, meeting_id: int, organizer_user_id: int, ratings: list):
    """
    Сохраняет оценки участников встречи организатором.
    - Вставляет оценки в user_ratings_table_15 (только для attended)
    - Обновляет user_action в meeting_rating_table_8 (для missed)
    - Обновляет israted = 1 в user_notifications_table_5 по record_id
    - Меняет статус встречи на 'finished'
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                # Проверяем, что пользователь - создатель встречи
                cur.execute("""
                    SELECT creator_user_id
                    FROM meeting_table_2
                    WHERE meeting_id = %s
                """, (meeting_id,))
                meeting = cur.fetchone()
                
                if not meeting:
                    return (False, "Встреча не найдена", "MEETINGS_save_participants_ratings")
                
                if meeting["creator_user_id"] != organizer_user_id:
                    return (False, "Только создатель может оценивать участников", "MEETINGS_save_participants_ratings")
                
                # Обрабатываем каждую оценку
                for rating in ratings:
                    user_id = rating.get("user_id")
                    user_action = rating.get("user_action")
                    rating_value = rating.get("rating_value")
                    
                    # Обновляем user_action в meeting_rating_table_8
                    # Для "missed" от организатора используем "missedbyorg"
                    db_user_action = 'missedbyorg' if user_action == 'missed' else user_action
                    cur.execute("""
                        UPDATE meeting_rating_table_8
                        SET user_action = %s
                        WHERE meeting_id = %s AND user_id = %s
                    """, (db_user_action, meeting_id, user_id))
                    
                    # Если пользователь был на встрече и есть оценка, добавляем в user_ratings_table_15
                    if user_action == 'attended' and rating_value is not None:
                        cur.execute("""
                            INSERT INTO user_ratings_table_15 
                            (rated_user_id, rater_user_id, rating_value, meeting_id)
                            VALUES (%s, %s, %s, %s)
                        """, (user_id, organizer_user_id, rating_value, meeting_id))
                
                # Обновляем israted в уведомлении организатора по record_id
                cur.execute("""
                    UPDATE user_notifications_table_5
                    SET israted = 1
                    WHERE record_id = %s
                """, (record_id,))
                
                # Меняем статус встречи на 'finished'
                cur.execute("""
                    UPDATE meeting_table_2
                    SET status = 'finished'
                    WHERE meeting_id = %s
                """, (meeting_id,))
                
                conn.commit()
                
                return {
                    "success": True,
                    "message": "Оценки успешно сохранены"
                }
    except Exception as error:
        return (False, error, "MEETINGS_save_participants_ratings")


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


#------------------------------------------------------------------------------------------------------
# Функции обновления данных пользователя (Settings Page)
#------------------------------------------------------------------------------------------------------

# обновление фамилии пользователя
def USERS_update_last_name(user_id: int, last_name: str):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE user_table_1
                    SET last_name = %s
                    WHERE user_id = %s
                    RETURNING user_id, last_name
                """, (last_name, user_id))
                result = cur.fetchone()
                return {"user_id": result["user_id"], "last_name": result["last_name"], "success": True}
    except Exception as error:
        return (False, error, "USERS_update_last_name")


# обновление имени пользователя
def USERS_update_first_name(user_id: int, first_name: str):
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE user_table_1
                    SET first_name = %s
                    WHERE user_id = %s
                    RETURNING user_id, first_name
                """, (first_name, user_id))
                result = cur.fetchone()
                return {"user_id": result["user_id"], "first_name": result["first_name"], "success": True}
    except Exception as error:
        return (False, error, "USERS_update_first_name")


# обновление даты рождения пользователя
def USERS_update_birth_date(user_id: int, birth_date: str):
    """
    birth_date должен быть в формате 'YYYY-MM-DD' или 'DD.MM.YYYY'
    """
    try:
        # Проверяем формат даты и конвертируем если нужно
        from datetime import datetime
        
        # Пробуем разные форматы
        formats = ['%Y-%m-%d', '%d.%m.%Y', '%d-%m-%Y']
        parsed_date = None
        
        for fmt in formats:
            try:
                parsed_date = datetime.strptime(birth_date, fmt)
                break
            except ValueError:
                continue
        
        if parsed_date is None:
            return (False, "Неверный формат даты. Используйте ДД.ММ.ГГГГ", "USERS_update_birth_date")
        
        # Конвертируем в формат PostgreSQL
        date_for_db = parsed_date.strftime('%Y-%m-%d')
        
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE user_table_1
                    SET birth_date = %s
                    WHERE user_id = %s
                    RETURNING user_id, birth_date
                """, (date_for_db, user_id))
                result = cur.fetchone()
                return {"user_id": result["user_id"], "birth_date": result["birth_date"], "success": True}
    except Exception as error:
        return (False, error, "USERS_update_birth_date")


# обновление пола пользователя
def USERS_update_gender(user_id: int, gender: str):
    """
    gender должен быть 'M' (Мужской) или 'F' (Женский)
    """
    try:
        # Валидация значения
        if gender not in ['M', 'F']:
            return (False, "Пол должен быть 'M' (Мужской) или 'F' (Женский)", "USERS_update_gender")
        
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE user_table_1
                    SET gender = %s
                    WHERE user_id = %s
                    RETURNING user_id, gender
                """, (gender, user_id))
                result = cur.fetchone()
                return {"user_id": result["user_id"], "gender": result["gender"], "success": True}
    except Exception as error:
        return (False, error, "USERS_update_gender")


# обновление района (квартала) пользователя
def USERS_update_district(user_id: int, district: str):
    """
    district - один из районов Москвы
    """
    # Список всех районов Москвы
    valid_districts = [
        'ЦАО', 'САО', 'СВАО', 'ВАО', 'ЮВАО', 'ЮАО', 'ЮЗАО', 'ЗАО', 'СЗАО', 'ЗелАО', 'ТАО', 'НАО'
    ]
    
    try:
        # Валидация района
        if district not in valid_districts:
            return (False, f"Неверный район. Допустимые значения: {', '.join(valid_districts)}", "USERS_update_district")
        
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE user_table_1
                    SET district = %s
                    WHERE user_id = %s
                    RETURNING user_id, district
                """, (district, user_id))
                result = cur.fetchone()
                return {"user_id": result["user_id"], "district": result["district"], "success": True}
    except Exception as error:
        return (False, error, "USERS_update_district")


# универсальная функция обновления настроек пользователя
def USERS_update_settings(user_id: int, **kwargs):
    """
    Обновляет только переданные поля пользователя.
    Допустимые поля: first_name, last_name, birth_date, gender, district
    """
    # Фильтруем None значения
    fields_to_update = {k: v for k, v in kwargs.items() if v is not None}
    
    if not fields_to_update:
        return {"success": True, "message": "Нет данных для обновления"}
    
    # Валидация полей
    allowed_fields = ['first_name', 'last_name', 'birth_date', 'gender', 'district']
    for field in fields_to_update.keys():
        if field not in allowed_fields:
            return (False, f"Недопустимое поле: {field}", "USERS_update_settings")
    
    try:
        # Преобразуем birth_date если передана
        if 'birth_date' in fields_to_update:
            from datetime import datetime
            birth_date = fields_to_update['birth_date']
            formats = ['%Y-%m-%d', '%d.%m.%Y', '%d-%m-%Y']
            parsed_date = None
            for fmt in formats:
                try:
                    parsed_date = datetime.strptime(birth_date, fmt)
                    break
                except ValueError:
                    continue
            if parsed_date is None:
                return (False, "Неверный формат даты рождения", "USERS_update_settings")
            fields_to_update['birth_date'] = parsed_date.strftime('%Y-%m-%d')
        
        # Валидация gender
        if 'gender' in fields_to_update:
            gender = fields_to_update['gender']
            if gender == 'Мужской':
                fields_to_update['gender'] = 'M'
            elif gender == 'Женский':
                fields_to_update['gender'] = 'F'
            elif gender not in ['M', 'F']:
                return (False, "Неверное значение пола", "USERS_update_settings")
        
        # Валидация district
        if 'district' in fields_to_update:
            valid_districts = ['ЦАО', 'САО', 'СВАО', 'ВАО', 'ЮВАО', 'ЮАО', 'ЮЗАО', 'ЗАО', 'СЗАО', 'ЗелАО', 'ТАО', 'НАО']
            if fields_to_update['district'] not in valid_districts:
                return (False, "Неверный район", "USERS_update_settings")
        
        # Формируем SQL запрос динамически
        set_clauses = []
        values = []
        for field, value in fields_to_update.items():
            set_clauses.append(f"{field} = %s")
            values.append(value)
        
        values.append(user_id)
        
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                sql = f"""
                    UPDATE user_table_1
                    SET {', '.join(set_clauses)}
                    WHERE user_id = %s
                    RETURNING user_id, first_name, last_name, birth_date, gender, district
                """
                cur.execute(sql, values)
                result = cur.fetchone()
                return {
                    "success": True,
                    "user_id": result["user_id"],
                    "first_name": result["first_name"],
                    "last_name": result["last_name"],
                    "birth_date": result["birth_date"],
                    "gender": result["gender"],
                    "district": result["district"]
                }
    except Exception as error:
        return (False, error, "USERS_update_settings")


# добавление фотографии пользователя в таблицу
def USERS_add_photo(user_id: int, photo_url: str):
    """
    Добавляет запись о фотографии пользователя в user_photos_table_14
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO user_photos_table_14 (user_id, photo_url)
                    VALUES (%s, %s)
                    RETURNING record_id, user_id, photo_url, uploaded_at
                """, (user_id, photo_url))
                result = cur.fetchone()
                return {
                    "success": True,
                    "record_id": result["record_id"],
                    "user_id": result["user_id"],
                    "photo_url": result["photo_url"],
                    "uploaded_at": result["uploaded_at"]
                }
    except Exception as error:
        return (False, error, "USERS_add_photo")


#------------------------------------------------------------------------------------------------------
# roots to Currency
#------------------------------------------------------------------------------------------------------
    
def USERS_reset_earned_currency(user_id: int):
    """
    Обнуляет earned_currency для пользователя (при выводе средств).
    Обновляет последнюю запись в user_extra_info_table_3, устанавливая earned_currency = 0.
    """
    try:
        with psycopg.connect(DSN) as conn:
            with conn.cursor() as cur:
                # Находим последнюю запись пользователя и обновляем earned_currency
                cur.execute("""
                UPDATE user_extra_info_table_3
                SET earned_currency = 0
                WHERE record_id = (
                    SELECT record_id
                    FROM user_extra_info_table_3
                    WHERE user_id = %s
                    ORDER BY record_id DESC
                    LIMIT 1
                )
                RETURNING record_id, earned_currency;
                """, (user_id,))
                
                result = cur.fetchone()
                if not result:
                    return (False, "User not found", "USERS_reset_earned_currency")
                
                conn.commit()
                return result[0]
    except Exception as error:
        return (False, error, "USERS_reset_earned_currency")


#------------------------------------------------------------------------------------------------------
# roots to Notifications
#------------------------------------------------------------------------------------------------------

# обновление статуса уведомления на 'read'
def USERS_mark_notification_as_read(record_id: int, user_id: int):
    """
    Отмечает уведомление как прочитанное (status = 'read')
    Проверяет, что уведомление принадлежит указанному пользователю
    """
    try:
        with psycopg.connect(DSN, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                # Проверяем что уведомление принадлежит пользователю
                cur.execute("""
                    SELECT record_id FROM user_notifications_table_5
                    WHERE record_id = %s AND user_id = %s
                """, (record_id, user_id))
                
                if not cur.fetchone():
                    return (False, "Уведомление не найдено или не принадлежит пользователю", "USERS_mark_notification_as_read")
                
                # Обновляем статус
                cur.execute("""
                    UPDATE user_notifications_table_5
                    SET status = 'read'
                    WHERE record_id = %s
                    RETURNING record_id, status
                """, (record_id,))
                
                result = cur.fetchone()
                conn.commit()
                
                return {
                    "record_id": result["record_id"],
                    "status": result["status"],
                    "success": True
                }
    except Exception as error:
        return (False, error, "USERS_mark_notification_as_read")
