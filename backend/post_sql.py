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
