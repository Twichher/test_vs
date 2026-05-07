#fastapi dev main.py
#uvicorn main:app --reload

from fastapi import Cookie, FastAPI, HTTPException, Response, Depends, Form
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta, timezone
from jose import jwt

from get_sql import FAQ_get_all_rows, MEETINGS_atted_get_all_info, MEETINGS_get_atted_missed_users, MEETINGS_get_reged_missed_users, MEETINGS_get_registered_users_only, MEETINGS_reged_get_all_info, USERS_check_login, USERS_get_MEETINGS_info_finished, USERS_get_MEETINGS_info_reged, USERS_get_info_by_id,MEETINGS_get_created_lsit, MEETINGS_no_sql_sort_by_params, CATEGORIES_get_all, WARNINGS_get_all, MEETINGS_create, NOTIFICATIONS_create, NOTIFICATION_PHOTOS_create, MEETINGS_add_category, MEETINGS_add_warning, \
CATEGORIES_get_all, MEETINGS_get_all_info, USERS_get_reged_meetings, USERS_get_all_stats_by_id, USERS_get_settings_info, \
STATS_get_guests_overall, STATS_get_guests_intermediate, STATS_get_organizers_overall, STATS_get_organizers_intermediate, \
PROFILE_get_user_is_organizer, ORGANIZER_get_active_meetings, ORGANIZER_get_history_meetings, USERS_get_earned_currency, \
MEETINGS_get_basic_info, USERS_get_notifications, SERVICES_get_all, SUPPORT_get_categories, SUPPORT_get_new_tickets, SUPPORT_get_in_progress_tickets, SUPPORT_get_resolved_tickets, SUPPORT_get_ticket_detail
from post_sql import USERS_post_reg_to_meet, USERS_update_miss_meeting, USERS_update_last_name, USERS_update_first_name, USERS_update_birth_date, USERS_update_gender, USERS_update_district, USERS_update_settings, USERS_add_photo, USERS_reset_earned_currency, MEETINGS_cancel_by_organizer, MEETINGS_finish_by_organizer, MEETINGS_save_participants_ratings, MEETINGS_save_user_ratings, NOTIFICATIONS_send_to_user, NOTIFICATION_PHOTOS_copy_by_notification, USERS_mark_notification_as_read, CONFLICTS_respond, CONFLICTS_save_appeal, SERVICES_buy_service, SUPPORT_create_ticket, SUPPORT_add_photo, SUPPORT_create_notification, SUPPORT_accept_ticket, SUPPORT_reject_ticket, SUPPORT_resolve_ticket
from models import FAQ, MeetingInfoRequestV2, MeetingRegedMissedUser, UserResp, UserLogin, MeetingsListGet, MeetingTypeOne, MeetingsRequest, Category, MeetingInfoRequest, CategoriesResponse, WarningsResponse, CreateMeetingRequest, CreateMeetingResponse, \
UsersStatsReq, RegUserToMeetingRequest, UpdateLastNameRequest, UpdateFirstNameRequest, UpdateBirthDateRequest, UpdateGenderRequest, UpdateDistrictRequest, UpdateFieldResponse, UserSettingsInfo, UpdateSettingsRequest, UpdateSettingsResponse, UploadPhotoResponse, StatsUser, StatsRequest, StatsResponse, NotificationItem, SaveRatingsRequest, SaveUserRatingsRequest, ConflictRespondRequest, Service, ServicesResponse, ServiceBuyRequest, ServiceBuyResponse, SupportCategory, SupportCategoriesResponse, CreateSupportRequest, CreateSupportResponse, SupportTicketItem, SupportTicketsResponse, SupportTicketDetailResponse
from minio_defs import upload_photo, upload_meeting_photo, upload_support_photo
import base64
import uuid
from fastapi import UploadFile, File
from important_info import SECRET_KEY, ALGORITHM

app = FastAPI()

#------------------------------------------------------------------------------------------------------
#Настройка
#------------------------------------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # порт твоего Vite
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
)

#------------------------------------------------------------------------------------------------------
#Вспомогательные функции
#------------------------------------------------------------------------------------------------------

def get_current_user(access_token: str = Cookie(default=None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Не авторизован")
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload["user_id"]
        return user_id
    except Exception:
        raise HTTPException(status_code=401, detail="Токен невалиден")


def get_current_admin_user(access_token: str = Cookie(default=None)):
    user_id = get_current_user(access_token)
    user_info = USERS_get_info_by_id(user_id)
    if isinstance(user_info, tuple):
        raise HTTPException(status_code=500, detail="Ошибка проверки прав администратора")
    if not user_info or not user_info.get('is_admin'):
        raise HTTPException(status_code=403, detail="Доступ запрещен: требуются права администратора")
    return user_id


def create_jwt_token(user_id: int) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7) 
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


#------------------------------------------------------------------------------------------------------
#roots to FAQ
#------------------------------------------------------------------------------------------------------


@app.get("/faq", response_model=List[FAQ])
def get_faq():
    result = FAQ_get_all_rows()

    if isinstance(result, tuple):
        return result[1]

    return result


@app.get("/categories", response_model=CategoriesResponse)
def get_categories():
    """
    Получает список всех категорий встреч.
    """
    result = CATEGORIES_get_all()
    
    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=str(result[1]))
    
    return {"categories": result}


@app.get("/warnings", response_model=WarningsResponse)
def get_warnings():
    """
    Получает список всех предупреждений для встреч.
    """
    result = WARNINGS_get_all()
    
    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=str(result[1]))
    
    return {"warnings": result}


@app.get("/services", response_model=ServicesResponse)
def get_services():
    """
    Получает список всех услуг в магазине.
    """
    result = SERVICES_get_all()
    
    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=str(result[1]))
    
    return {"services": result}


@app.get("/support/categories", response_model=SupportCategoriesResponse)
def get_support_categories():
    """
    Получает список категорий обращений в поддержку.
    """
    result = SUPPORT_get_categories()
    
    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=str(result[1]))
    
    return {"categories": result}


@app.post("/support", response_model=CreateSupportResponse)
def create_support_ticket(
    request: CreateSupportRequest,
    current_user_id: int = Depends(get_current_user)
):
    """
    Создает новое обращение в поддержку.
    Загружает фото в MinIO и сохраняет URL в support_photos_table_22.
    """
    try:
        # 1. Создаем тикет в БД
        ticket_id = SUPPORT_create_ticket(
            requester_user_id=current_user_id,
            category=request.category_id,
            message_text=request.message_text
        )
        
        if isinstance(ticket_id, tuple):
            raise HTTPException(status_code=500, detail=f"Failed to create ticket: {ticket_id[1]}")
        
        if not ticket_id:
            raise HTTPException(status_code=500, detail="Failed to create ticket: no ID returned")
        
        # 2. Загружаем фото в MinIO и сохраняем в БД
        photo_urls = []
        for i, photo_base64 in enumerate(request.photos):
            try:
                # Парсим Base64 data URL
                if ',' in photo_base64:
                    header, encoded = photo_base64.split(',', 1)
                else:
                    encoded = photo_base64
                
                # Определяем content-type из header
                content_type = 'image/jpeg'  # default
                if 'data:' in photo_base64:
                    content_type = photo_base64.split(';')[0].replace('data:', '')
                
                # Декодируем Base64
                file_data = base64.b64decode(encoded)
                
                # Генерируем имя файла
                extension = content_type.split('/')[-1] if '/' in content_type else 'jpg'
                filename = f"support_{ticket_id}_photo_{i}.{extension}"
                
                # Загружаем в MinIO
                upload_result = upload_support_photo(file_data, filename, content_type)
                
                if upload_result.get('success'):
                    photo_url = upload_result['url']
                    photo_urls.append(photo_url)
                    
                    # Сохраняем URL в БД
                    photo_record = SUPPORT_add_photo(ticket_id, photo_url)
                    if isinstance(photo_record, tuple):
                        print(f"Warning: Failed to save photo record: {photo_record[1]}")
                else:
                    print(f"Warning: Failed to upload photo {i}: {upload_result.get('error')}")
                    
            except Exception as e:
                print(f"Warning: Error processing photo {i}: {str(e)}")
        
        # 3. Создаем уведомление об обращении в поддержку
        notification_result = SUPPORT_create_notification(
            ticket_id=ticket_id,
            requester_user_id=current_user_id,
            photo_urls=photo_urls
        )
        
        if isinstance(notification_result, tuple):
            print(f"Warning: Failed to create notification: {notification_result[1]}")
        
        return CreateSupportResponse(
            success=True,
            ticket_id=ticket_id,
            message="Ticket created successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/support/tickets/new", response_model=SupportTicketsResponse)
def get_support_tickets_new(admin_user_id: int = Depends(get_current_admin_user)):
    """Новые обращения (status='created', не назначены админу). Только для администраторов."""
    result = SUPPORT_get_new_tickets()
    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=str(result[1]))
    return SupportTicketsResponse(tickets=[SupportTicketItem(**row) for row in result])


@app.get("/support/tickets/in-progress", response_model=SupportTicketsResponse)
def get_support_tickets_in_progress(admin_user_id: int = Depends(get_current_admin_user)):
    """Принятые обращения (status='in_progress', назначены текущему админу)."""
    result = SUPPORT_get_in_progress_tickets(admin_user_id)
    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=str(result[1]))
    return SupportTicketsResponse(tickets=[SupportTicketItem(**row) for row in result])


@app.get("/support/tickets/resolved", response_model=SupportTicketsResponse)
def get_support_tickets_resolved(admin_user_id: int = Depends(get_current_admin_user)):
    """Завершённые обращения (status='resolved', закрыты текущим админом)."""
    result = SUPPORT_get_resolved_tickets(admin_user_id)
    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=str(result[1]))
    return SupportTicketsResponse(tickets=[SupportTicketItem(**row) for row in result])


@app.get("/support/tickets/{ticket_id}", response_model=SupportTicketDetailResponse)
def get_support_ticket_detail(ticket_id: int, admin_user_id: int = Depends(get_current_admin_user)):
    """Детальная информация об обращении в поддержку. Только для администраторов."""
    result = SUPPORT_get_ticket_detail(ticket_id)
    if isinstance(result, tuple):
        if result[1] == "Ticket not found":
            raise HTTPException(status_code=404, detail="Данной заявки нет")
        raise HTTPException(status_code=500, detail=str(result[1]))
    return SupportTicketDetailResponse(**result)


@app.put("/support/tickets/{ticket_id}/accept")
def accept_support_ticket(ticket_id: int, admin_user_id: int = Depends(get_current_admin_user)):
    """Принять обращение в поддержку (назначить на себя). Только для администраторов."""
    result = SUPPORT_accept_ticket(ticket_id, admin_user_id)
    if isinstance(result, tuple):
        if result[1] == "Ticket not found or already assigned":
            raise HTTPException(status_code=409, detail="Заявка не найдена или уже назначена")
        raise HTTPException(status_code=500, detail=str(result[1]))
    return {"success": True, "ticket_id": result["ticket_id"]}


@app.put("/support/tickets/{ticket_id}/reject")
def reject_support_ticket(ticket_id: int, admin_user_id: int = Depends(get_current_admin_user)):
    """Отказаться от обращения в поддержку (вернуть в 'created'). Только для администраторов."""
    result = SUPPORT_reject_ticket(ticket_id)
    if isinstance(result, tuple):
        if result[1] == "Ticket not found or not in progress":
            raise HTTPException(status_code=409, detail="Заявка не найдена или не в статусе 'Принята'")
        raise HTTPException(status_code=500, detail=str(result[1]))
    return {"success": True, "ticket_id": result["ticket_id"]}


@app.put("/support/tickets/{ticket_id}/resolve")
def resolve_support_ticket(ticket_id: int, admin_user_id: int = Depends(get_current_admin_user)):
    """Завершить обращение в поддержку. Только для администраторов."""
    result = SUPPORT_resolve_ticket(ticket_id, admin_user_id)
    if isinstance(result, tuple):
        if result[1] == "Ticket not found or not assigned to you":
            raise HTTPException(status_code=409, detail="Заявка не найдена или не назначена на вас")
        raise HTTPException(status_code=500, detail=str(result[1]))
    return {"success": True, "ticket_id": result["ticket_id"]}


@app.post("/services/buy", response_model=ServiceBuyResponse)
def buy_service(
    request: ServiceBuyRequest,
    current_user_id: int = Depends(get_current_user)
):
    """
    Покупка услуги пользователем.
    """
    result = SERVICES_buy_service(request.service_id, current_user_id)
    
    if isinstance(result, tuple):
        raise HTTPException(status_code=400, detail=str(result[1]))
    
    return result


@app.post("/meetings/create", response_model=CreateMeetingResponse)
def create_meeting(
    request: CreateMeetingRequest,
    current_user_id: int = Depends(get_current_user)
):
    """
    Создает новую встречу с уведомлением и фотографиями.
    """
    try:
        # Получаем информацию о пользователе для district
        user_info = USERS_get_info_by_id(current_user_id)
        if isinstance(user_info, tuple):
            raise HTTPException(status_code=500, detail=f"Failed to get user info: {user_info[1]}")
        
        user_district = user_info.get('district', '')
        
        # Формируем timestamps из даты и времени
        start_at = f"{request.meeting_date} {request.start_time}:00"
        end_at = f"{request.meeting_date} {request.end_time}:00"
        
        # 1. Создаем встречу в БД
        meeting_id = MEETINGS_create(
            creator_user_id=current_user_id,
            title=request.title,
            description=request.description,
            max_people=request.max_people,
            address=request.address,
            city="Москва",
            district=user_district,
            adults_only=request.adults_only,
            status="created",
            start_at=start_at,
            end_at=end_at
        )
        
        if isinstance(meeting_id, tuple):
            raise HTTPException(status_code=500, detail=f"Failed to create meeting: {meeting_id[1]}")
        
        if not meeting_id:
            raise HTTPException(status_code=500, detail="Failed to create meeting: no ID returned")
        
        # 2. Добавляем категории к встрече
        for category_id in request.category_ids:
            result = MEETINGS_add_category(meeting_id, category_id)
            if isinstance(result, tuple):
                print(f"Warning: Failed to add category {category_id}: {result[1]}")
        
        # 3. Добавляем предупреждения к встрече
        for group_id, option_id in request.selected_warnings.items():
            result = MEETINGS_add_warning(meeting_id, option_id)
            if isinstance(result, tuple):
                print(f"Warning: Failed to add warning {option_id}: {result[1]}")
        
        # 4. Создаем уведомление
        notification_id = NOTIFICATIONS_create(
            meeting_id=meeting_id,
            notification_type="встреча",
            notification_text=request.email_message
        )
        
        if isinstance(notification_id, tuple):
            raise HTTPException(status_code=500, detail=f"Failed to create notification: {notification_id[1]}")
        
        # 5. Загружаем фото в MinIO и сохраняем в БД
        photo_urls = []
        for i, photo_base64 in enumerate(request.photos):
            try:
                # Парсим Base64 data URL
                if ',' in photo_base64:
                    header, encoded = photo_base64.split(',', 1)
                else:
                    encoded = photo_base64
                
                # Определяем content-type из header
                content_type = 'image/jpeg'  # default
                if 'data:' in photo_base64:
                    content_type = photo_base64.split(';')[0].replace('data:', '')
                
                # Декодируем Base64
                file_data = base64.b64decode(encoded)
                
                # Генерируем имя файла
                extension = content_type.split('/')[-1] if '/' in content_type else 'jpg'
                filename = f"meeting_{meeting_id}_photo_{i}.{extension}"
                
                # Загружаем в MinIO
                upload_result = upload_meeting_photo(file_data, filename, content_type)
                
                if upload_result.get('success'):
                    photo_url = upload_result['url']
                    photo_urls.append(photo_url)
                    
                    # Сохраняем URL в БД
                    photo_record = NOTIFICATION_PHOTOS_create(notification_id, photo_url)
                    if isinstance(photo_record, tuple):
                        print(f"Warning: Failed to save photo record: {photo_record[1]}")
                else:
                    print(f"Warning: Failed to upload photo {i}: {upload_result.get('error')}")
                    
            except Exception as e:
                print(f"Warning: Error processing photo {i}: {str(e)}")
        
        # 6. Создаем уведомление для организатора о создании встречи
        organizer_notification_id = NOTIFICATIONS_create(
            meeting_id=meeting_id,
            notification_type="создание встречи",
            notification_text=request.email_message
        )
        
        if isinstance(organizer_notification_id, tuple):
            print(f"Warning: Failed to create organizer notification: {organizer_notification_id[1]}")
        else:
            # 7. Отправляем уведомление организатору
            send_result = NOTIFICATIONS_send_to_user(organizer_notification_id, current_user_id)
            if isinstance(send_result, tuple):
                print(f"Warning: Failed to send notification to organizer: {send_result[1]}")
            
            # 8. Копируем фото в уведомление организатора
            if photo_urls:
                copy_result = NOTIFICATION_PHOTOS_copy_by_notification(notification_id, organizer_notification_id)
                if isinstance(copy_result, tuple):
                    print(f"Warning: Failed to copy photos to organizer notification: {copy_result[1]}")
        
        return CreateMeetingResponse(
            success=True,
            meeting_id=meeting_id,
            notification_id=notification_id,
            message="Meeting created successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


#------------------------------------------------------------------------------------------------------
#roots to MEETINGS
#------------------------------------------------------------------------------------------------------


@app.post("/meetings", response_model=List[MeetingTypeOne])
def get_list_meetings(
    district: MeetingsListGet,
    user_id: int = Depends(get_current_user)  # ← защита
):
    result = MEETINGS_get_created_lsit(**district.model_dump())

    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=result[1])

    return result


@app.post("/meetings/sort", response_model=List[MeetingTypeOne])
def get_sorted_list_meetings(
    body: MeetingsRequest,
    user_id: int = Depends(get_current_user)
):
    try:
        return MEETINGS_no_sql_sort_by_params(
            meetings=body.meetings,
            meeting_title=body.meeting_title,
            districts=body.districts,
            categories=body.categories,
            max_people=body.max_people,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))  # ← увидишь реальную ошибку
    

#roots to CATEGORIES
@app.get("/meetings/categories", response_model=List[Category])
def get_all_categories(user_id: int = Depends(get_current_user)):
    result = CATEGORIES_get_all()

    if isinstance(result, tuple):
        raise HTTPException(
            status_code=500,
            detail=result[1]
        )
    
    return result
    

@app.get("/meetings/{meeting_id}", response_model=MeetingInfoRequest)
def get_meeting_info(meeting_id : int,
                     user_id: int = Depends(get_current_user)):
    result = MEETINGS_get_all_info(meeting_id)

    if isinstance(result, tuple): 
        raise HTTPException(status_code=500, detail=result[1])
    
    return result

@app.get("/meetings/{meeting_id}/reged_info", response_model=MeetingInfoRequestV2)
def get_meetings_all_info_new_page(meeting_id : int,user_id: int = Depends(get_current_user)):
    result = MEETINGS_reged_get_all_info(meeting_id)

    if isinstance(result, tuple):
        raise HTTPException(
            status_code=500,
            detail=result[1]
        )
    
    return result

@app.get("/meetings/{meeting_id}/atted_info", response_model=MeetingInfoRequestV2)
def get_meetings_history_all_info_new_page(meeting_id : int,user_id: int = Depends(get_current_user)):
    
    result = MEETINGS_atted_get_all_info(meeting_id)

    if isinstance(result, tuple):
        raise HTTPException(
            status_code=500,
            detail=result[1]
        )
    
    return result


@app.get("/meetings/{meeting_id}/info")
def get_meeting_basic_info(meeting_id: int, user_id: int = Depends(get_current_user)):
    """Получает базовую информацию о встрече (creator_user_id, start_at, status)"""
    result = MEETINGS_get_basic_info(meeting_id)

    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=str(result[1]))
    
    if not result:
        raise HTTPException(status_code=404, detail="Meeting not found")

    return {
        "meeting_id": result["meeting_id"],
        "creator_user_id": result["creator_user_id"],
        "start_at": result["start_at"],
        "status": result["status"]
    }


@app.post("/meetings/{meeting_id}/reg/{user_id}")
def post_reg_user_to_meeting(meeting_id : int, user_id : int, body : RegUserToMeetingRequest):
    result = USERS_post_reg_to_meet(meeting_id , user_id, body.user_action)

    if isinstance(result, tuple):
        error_message = str(result[1])
        # Если ошибка про нехватку валюты — возвращаем 400
        if "Вам не хватает встреч" in error_message:
            raise HTTPException(status_code=400, detail=error_message)
        raise HTTPException(status_code=500, detail=error_message)
    
    return result

@app.put("/meetings/{meeting_id}/canceledby/{user_id}")
def put_user_cancel_meeting(meeting_id : int, user_id : int):
    result = USERS_update_miss_meeting(meeting_id, user_id)

    if isinstance(result, tuple): 
        raise HTTPException(status_code=500, detail=result[1])
    
    return result   


@app.put("/meetings/{meeting_id}/cancel")
def cancel_meeting_by_organizer(meeting_id: int, user_id: int = Depends(get_current_user)):
    """
    Отменяет встречу организатором.
    Проверяет, что текущий пользователь является создателем встречи.
    """
    result = MEETINGS_cancel_by_organizer(meeting_id, user_id)
    
    if isinstance(result, tuple):
        raise HTTPException(status_code=400, detail=str(result[1]))
    
    return result


@app.put("/meetings/{meeting_id}/finish")
def finish_meeting_by_organizer(meeting_id: int, user_id: int = Depends(get_current_user)):
    """
    Завершает встречу организатором.
    Проверяет, что текущий пользователь является создателем встречи.
    """
    result = MEETINGS_finish_by_organizer(meeting_id, user_id)
    
    if isinstance(result, tuple):
        raise HTTPException(status_code=400, detail=str(result[1]))
    
    return result


@app.post("/meetings/save-ratings")
def save_participants_ratings(
    request: SaveRatingsRequest,
    user_id: int = Depends(get_current_user)
):
    """
    Сохраняет оценки участников встречи организатором.
    - Вставляет оценки в user_ratings_table_15 (для attended)
    - Обновляет user_action в meeting_rating_table_8 (для missed)
    - Обновляет israted = 1 в user_notifications_table_5
    """
    result = MEETINGS_save_participants_ratings(
        record_id=request.record_id,
        meeting_id=request.meeting_id,
        organizer_user_id=user_id,
        ratings=[r.model_dump() for r in request.ratings]
    )
    
    if isinstance(result, tuple):
        raise HTTPException(status_code=400, detail=str(result[1]))
    
    return result


@app.post("/meetings/save-user-ratings")
def save_user_ratings(
    request: SaveUserRatingsRequest,
    user_id: int = Depends(get_current_user)
):
    """
    Сохраняет оценки от участника встречи.
    - Вставляет оценку встречи в meeting_rating_info_table_26
    - Вставляет оценки пользователей в user_ratings_table_15
    - Обновляет israted = 1 в user_notifications_table_5
    """
    result = MEETINGS_save_user_ratings(
        record_id=request.record_id,
        meeting_id=request.meeting_id,
        user_id=user_id,
        meeting_rating=request.meeting_rating,
        user_ratings=[r.model_dump() for r in request.user_ratings],
        has_extra_people=request.has_extra_people
    )
    
    if isinstance(result, tuple):
        raise HTTPException(status_code=400, detail=str(result[1]))
    
    return result


@app.get("/meetings/{meeting_id}/reged_users", response_model=List[MeetingRegedMissedUser])
def get_reged_missed_users(meeting_id : int):
    result = MEETINGS_get_reged_missed_users(meeting_id)

    if isinstance(result, tuple):
        raise HTTPException(
            status_code=500,
            detail=result[1]
        )

    return result


@app.get("/meetings/{meeting_id}/registered_only", response_model=List[MeetingRegedMissedUser])
def get_registered_users_only(meeting_id : int):
    """Получить список только зарегистрированных пользователей (со статусом 'registered')"""
    result = MEETINGS_get_registered_users_only(meeting_id)

    if isinstance(result, tuple):
        raise HTTPException(
            status_code=500,
            detail=result[1]
        )

    return result


@app.get("/meetings/{meeting_id}/atted_users", response_model=List[MeetingRegedMissedUser])
def get_atted_missed_users(meeting_id : int):
    result = MEETINGS_get_atted_missed_users(meeting_id)

    if isinstance(result, tuple):
        raise HTTPException(
            status_code=500,
            detail=result[1]
        )
    
    return result


#------------------------------------------------------------------------------------------------------
#roots to USERS
#------------------------------------------------------------------------------------------------------


@app.post("/login", response_model=UserResp)
def post_login_user(user: UserLogin, response: Response):
    result = USERS_check_login(**user.model_dump())

    # Ошибка с БД
    if isinstance(result, tuple):
        raise HTTPException(
            status_code=500,
            detail="Ошибка базы данных"
        )

    # Пользователь не найден (пустой список)
    if not result:
        raise HTTPException(
            status_code=401,
            detail="Неверный email или пароль"
        )

    # Пользователь заблокирован
    if result["is_blocked"]:
        raise HTTPException(
            status_code=403,
            detail="Аккаунт заблокирован"
        )

    token = create_jwt_token(result["user_id"])
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=604800,
        samesite="lax"
    )

    return result


@app.get("/me", response_model=UserResp)
def get_me(access_token: str = Cookie(default=None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Не авторизован")
    try:    
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload["user_id"]
        result = USERS_get_info_by_id(user_id) 
        return result
    except Exception:
        raise HTTPException(status_code=401, detail="Токен невалиден")
    

@app.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Вышел успешно"}

# возвращаем только idшники встреч
@app.get("/users/{user_id}/reged_meetings", response_model=list[int])
def get_reged_meetings(user_id: int = Depends(get_current_user)):
    result = USERS_get_reged_meetings(user_id)

    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=str(result[1]))

    return result

@app.get("/users/{_user_id}/stats", response_model=UsersStatsReq)
def get_stats_of_user(_user_id : int, user_id: int = Depends(get_current_user)):
    result = USERS_get_all_stats_by_id(_user_id)

    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=str(result[1]))

    return result


@app.get("/users/{_user_id}/is_organizer")
def get_user_is_organizer(_user_id: int, user_id: int = Depends(get_current_user)):
    """Проверяет, является ли пользователь организатором"""
    result = PROFILE_get_user_is_organizer(_user_id)
    
    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=str(result[1]))
    
    return {"user_id": _user_id, "is_organizer": result}

@app.get("/users/{_user_id}/info_reged_meetings", response_model=List[MeetingTypeOne])
def get_info_of_reged_meetings(_user_id : int, user_id: int = Depends(get_current_user)):
    result = USERS_get_MEETINGS_info_reged(_user_id)

    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=str(result[1]))

    return result

@app.get("/users/{_user_id}/info_atted_meetings", response_model=List[MeetingTypeOne])
def get_info_of_atted_meetings(_user_id : int, user_id: int = Depends(get_current_user)):
    result = USERS_get_MEETINGS_info_finished(_user_id)

    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=str(result[1]))

    return result


@app.get("/users/{_user_id}/organizer_active_meetings", response_model=List[MeetingTypeOne])
def get_organizer_active_meetings(_user_id: int, user_id: int = Depends(get_current_user)):
    """Получает активные встречи организатора (created, in_progress)"""
    result = ORGANIZER_get_active_meetings(_user_id)

    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=str(result[1]))

    return result


@app.get("/users/{_user_id}/organizer_history_meetings", response_model=List[MeetingTypeOne])
def get_organizer_history_meetings(_user_id: int, user_id: int = Depends(get_current_user)):
    """Получает историю созданных встреч организатора (finished, canceled)"""
    result = ORGANIZER_get_history_meetings(_user_id)

    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=str(result[1]))

    return result


@app.get("/users/me/earned_currency")
def get_my_earned_currency(user_id: int = Depends(get_current_user)):
    """Получает earned_currency для авторизованного пользователя"""
    result = USERS_get_earned_currency(user_id)

    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=str(result[1]))

    return {"user_id": user_id, "earned_currency": result}


@app.post("/users/me/earned_currency/withdraw")
def withdraw_earned_currency(user_id: int = Depends(get_current_user)):
    """Обнуляет earned_currency при выводе средств"""
    result = USERS_reset_earned_currency(user_id)

    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=str(result[1]))

    return {"user_id": user_id, "earned_currency": 0, "success": True}


#------------------------------------------------------------------------------------------------------
# roots to NOTIFICATIONS (уведомления пользователя)
#------------------------------------------------------------------------------------------------------

@app.get("/users/{_user_id}/notifications", response_model=List[NotificationItem])
def get_user_notifications(_user_id: int, user_id: int = Depends(get_current_user)):
    """Получает все уведомления для пользователя"""
    result = USERS_get_notifications(_user_id)

    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=str(result[1]))

    # Защита: psycopg иногда возвращает PostgreSQL массив как строку-литерал
    for item in result:
        photo_urls = item.get('photo_urls')
        if isinstance(photo_urls, str):
            # PostgreSQL array literal: {elem1,elem2} или просто строка
            cleaned = photo_urls.strip('{}')
            if cleaned:
                item['photo_urls'] = [u.strip().strip('"') for u in cleaned.split(',') if u.strip()]
            else:
                item['photo_urls'] = []

    return result


@app.put("/notifications/{record_id}/read")
def mark_notification_as_read(record_id: int, user_id: int = Depends(get_current_user)):
    """Отмечает уведомление как прочитанное"""
    result = USERS_mark_notification_as_read(record_id, user_id)

    if isinstance(result, tuple):
        raise HTTPException(status_code=400, detail=str(result[1]))

    return result


#------------------------------------------------------------------------------------------------------
# roots to CONFLICTS (обработка missedbyorg + апелляции)
#------------------------------------------------------------------------------------------------------

@app.put("/notifications/{record_id}/conflict-respond")
def respond_to_conflict(record_id: int, body: ConflictRespondRequest, user_id: int = Depends(get_current_user)):
    """Обрабатывает ответ пользователя на конфликт (missedbyorg)"""
    result = CONFLICTS_respond(record_id, user_id, body.attended)
    
    if isinstance(result, tuple):
        raise HTTPException(status_code=400, detail=str(result[1]))
    
    return result


@app.post("/conflicts/appeal")
async def create_conflict_appeal(
    record_id: int = Form(...),
    proof_text: str | None = Form(None),
    files: list[UploadFile] = File(default=[]),
    user_id: int = Depends(get_current_user)
):
    """Отправляет апелляцию на конфликт (доказательства присутствия)"""
    photo_urls = []
    
    for file in files:
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Все файлы должны быть изображениями")
        
        file_data = await file.read()
        upload_result = upload_meeting_photo(file_data, file.filename, file.content_type)
        
        if not upload_result.get("success"):
            raise HTTPException(status_code=500, detail=upload_result.get("error", "Ошибка загрузки фото"))
        
        photo_urls.append(upload_result["url"])
    
    result = CONFLICTS_save_appeal(record_id, user_id, proof_text, photo_urls)
    
    if isinstance(result, tuple):
        raise HTTPException(status_code=400, detail=str(result[1]))
    
    return result


#------------------------------------------------------------------------------------------------------
# roots to SETTINGS (обновление данных пользователя)
#------------------------------------------------------------------------------------------------------

@app.put("/users/{user_id}/last_name", response_model=UpdateFieldResponse)
def update_last_name(
    user_id: int,
    body: UpdateLastNameRequest,
    current_user_id: int = Depends(get_current_user)
):
    # Проверяем, что пользователь обновляет свои данные
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Можно обновлять только свои данные")
    
    result = USERS_update_last_name(user_id, body.last_name)
    
    if isinstance(result, tuple):
        raise HTTPException(status_code=400, detail=str(result[1]))
    
    return UpdateFieldResponse(
        success=True,
        message="Фамилия успешно обновлена",
        field_name="last_name",
        new_value=result["last_name"]
    )


@app.put("/users/{user_id}/first_name", response_model=UpdateFieldResponse)
def update_first_name(
    user_id: int,
    body: UpdateFirstNameRequest,
    current_user_id: int = Depends(get_current_user)
):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Можно обновлять только свои данные")
    
    result = USERS_update_first_name(user_id, body.first_name)
    
    if isinstance(result, tuple):
        raise HTTPException(status_code=400, detail=str(result[1]))
    
    return UpdateFieldResponse(
        success=True,
        message="Имя успешно обновлено",
        field_name="first_name",
        new_value=result["first_name"]
    )


@app.put("/users/{user_id}/birth_date", response_model=UpdateFieldResponse)
def update_birth_date(
    user_id: int,
    body: UpdateBirthDateRequest,
    current_user_id: int = Depends(get_current_user)
):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Можно обновлять только свои данные")
    
    result = USERS_update_birth_date(user_id, body.birth_date)
    
    if isinstance(result, tuple):
        raise HTTPException(status_code=400, detail=str(result[1]))
    
    return UpdateFieldResponse(
        success=True,
        message="Дата рождения успешно обновлена",
        field_name="birth_date",
        new_value=str(result["birth_date"])
    )


@app.put("/users/{user_id}/gender", response_model=UpdateFieldResponse)
def update_gender(
    user_id: int,
    body: UpdateGenderRequest,
    current_user_id: int = Depends(get_current_user)
):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Можно обновлять только свои данные")
    
    result = USERS_update_gender(user_id, body.gender)
    
    if isinstance(result, tuple):
        raise HTTPException(status_code=400, detail=str(result[1]))
    
    return UpdateFieldResponse(
        success=True,
        message="Пол успешно обновлен",
        field_name="gender",
        new_value=result["gender"]
    )


@app.put("/users/{user_id}/district", response_model=UpdateFieldResponse)
def update_district(
    user_id: int,
    body: UpdateDistrictRequest,
    current_user_id: int = Depends(get_current_user)
):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Можно обновлять только свои данные")
    
    result = USERS_update_district(user_id, body.district)
    
    if isinstance(result, tuple):
        raise HTTPException(status_code=400, detail=str(result[1]))
    
    return UpdateFieldResponse(
        success=True,
        message="Район успешно обновлен",
        field_name="district",
        new_value=result["district"]
    )


@app.get("/districts")
def get_all_districts():
    """Возвращает список всех районов Москвы"""
    districts = [
        {"code": "ЦАО", "name": "Центральный административный округ"},
        {"code": "САО", "name": "Северный административный округ"},
        {"code": "СВАО", "name": "Северо-Восточный административный округ"},
        {"code": "ВАО", "name": "Восточный административный округ"},
        {"code": "ЮВАО", "name": "Юго-Восточный административный округ"},
        {"code": "ЮАО", "name": "Южный административный округ"},
        {"code": "ЮЗАО", "name": "Юго-Западный административный округ"},
        {"code": "ЗАО", "name": "Западный административный округ"},
        {"code": "СЗАО", "name": "Северо-Западный административный округ"},
        {"code": "ЗелАО", "name": "Зеленоградский административный округ"},
        {"code": "ТАО", "name": "Троицкий административный округ"},
        {"code": "НАО", "name": "Новомосковский административный округ"},
    ]
    return districts


@app.get("/users/{user_id}/settings", response_model=UserSettingsInfo)
def get_user_settings(user_id: int, current_user_id: int = Depends(get_current_user)):
    """Получает данные пользователя для страницы настроек"""
    # Проверяем, что пользователь получает свои данные
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Можно получать только свои данные")
    
    result = USERS_get_settings_info(user_id)
    
    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=str(result[1]))
    
    if not result:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Преобразуем gender в читаемый формат
    gender_map = {'M': 'Мужской', 'F': 'Женский'}
    result['gender'] = gender_map.get(result['gender'], result['gender'])
    
    # Форматируем дату рождения
    if result['birth_date']:
        result['birth_date'] = result['birth_date'].strftime('%d.%m.%Y')
    
    return result


@app.post("/users/{user_id}/photo", response_model=UploadPhotoResponse)
async def upload_user_photo(
    user_id: int,
    file: UploadFile = File(...),
    current_user_id: int = Depends(get_current_user)
):
    """Загружает фотографию пользователя в MinIO и сохраняет URL в БД"""
    # Проверяем, что пользователь загружает свою фотографию
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Можно загружать только свои фотографии")
    
    # Проверяем тип файла
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Файл должен быть изображением (JPEG, PNG, GIF, etc.)")
    
    try:
        # Читаем содержимое файла
        file_data = await file.read()
        
        # Загружаем в MinIO
        upload_result = upload_photo(file_data, file.filename, file.content_type)
        
        if not upload_result["success"]:
            raise HTTPException(status_code=500, detail=upload_result.get("error", "Ошибка загрузки файла"))
        
        photo_url = upload_result["url"]
        
        # Сохраняем URL в БД
        db_result = USERS_add_photo(user_id, photo_url)
        
        if isinstance(db_result, tuple):
            # Если ошибка в БД, удаляем файл из MinIO
            # TODO: добавить удаление файла из MinIO при ошибке БД
            raise HTTPException(status_code=500, detail=str(db_result[1]))
        
        return UploadPhotoResponse(
            success=True,
            message="Фотография успешно загружена",
            photo_url=photo_url,
            record_id=db_result["record_id"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/users/{user_id}/settings", response_model=UpdateSettingsResponse)
def update_user_settings(
    user_id: int,
    body: UpdateSettingsRequest,
    current_user_id: int = Depends(get_current_user)
):
    """Обновляет данные пользователя"""
    # Проверяем, что пользователь обновляет свои данные
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Можно обновлять только свои данные")
    
    # Формируем словарь с измененными полями
    update_data = body.model_dump(exclude_none=True)
    
    if not update_data:
        return UpdateSettingsResponse(
            success=True,
            message="Нет данных для обновления",
            data=None
        )
    
    # Вызываем SQL функцию
    result = USERS_update_settings(user_id, **update_data)
    
    if isinstance(result, tuple):
        raise HTTPException(status_code=400, detail=str(result[1]))
    
    # Форматируем ответ
    gender_map_reverse = {'M': 'Мужской', 'F': 'Женский'}
    response_data = UserSettingsInfo(
        first_name=result["first_name"],
        last_name=result["last_name"],
        birth_date=result["birth_date"].strftime('%d.%m.%Y') if result["birth_date"] else None,
        gender=gender_map_reverse.get(result["gender"], result["gender"]),
        district=result["district"],
        email=""  # email не обновляем в этой функции
    )
    
    return UpdateSettingsResponse(
        success=True,
        message="Данные успешно сохранены",
        data=response_data
    )



#------------------------------------------------------------------------------------------------------
#roots to Stats
#------------------------------------------------------------------------------------------------------

def calculate_rvru(rating: float, meetings_count: int, ratings_count: int) -> float:
    """Вычисляет RVRU рейтинг: R × ln(V + 1) × ln(O + 1)"""
    import math
    return rating * math.log(meetings_count + 1) * math.log(ratings_count + 1)


def process_stats_result(result, current_user_id: int):
    """Обрабатывает результат SQL запроса, вычисляет RVRU и формирует топ-10 + последнее место"""
    if isinstance(result, tuple):
        raise HTTPException(status_code=500, detail=str(result[1]))
    
    if not result:
        return [], None, None, 0
    
    # Вычисляем RVRU для всех пользователей
    users_with_rvru = []
    for user in result:
        # Безопасно получаем значения с дефолтами
        rating = float(user.get('rating') or 0)
        meetings_count = int(user.get('meetings_count') or 0)
        ratings_count = int(user.get('ratings_count') or 0)
        
        rvru = calculate_rvru(
            rating=rating,
            meetings_count=meetings_count,
            ratings_count=ratings_count
        )
        users_with_rvru.append({
            'user_id': int(user['user_id']),
            'first_name': str(user['first_name']),
            'last_name': str(user['last_name']),
            'district': str(user['district']),
            'meetings_count': meetings_count,
            'ratings_count': ratings_count,
            'rating': round(rating, 2),
            'rvru': round(rvru, 2),
            'rank': 0  # Будет назначен ниже
        })
    
    # Сортируем по RVRU (убывание)
    users_with_rvru.sort(key=lambda x: x['rvru'], reverse=True)
    
    # Присваиваем rank
    for i, user in enumerate(users_with_rvru, 1):
        user['rank'] = i
    
    # Находим текущего пользователя
    current_user = None
    top_10 = users_with_rvru[:10]
    last_place_user = users_with_rvru[-1] if len(users_with_rvru) > 0 else None
    
    # Проверяем, есть ли текущий пользователь в топ-10
    current_in_top = any(u['user_id'] == current_user_id for u in top_10)
    
    if not current_in_top:
        # Ищем текущего пользователя в полном списке
        for user in users_with_rvru:
            if user['user_id'] == current_user_id:
                current_user = user
                break
    
    return top_10, current_user, last_place_user, len(users_with_rvru)


@app.post("/stats_data", response_model=StatsResponse)
def get_stats(
    body: StatsRequest,
    current_user_id: int = Depends(get_current_user)
):
    """
    Получает статистику пользователей с учетом фильтров.
    Параметры:
    - district: район (None или пустая строка = все районы)
    - rating_type: 'overall' или 'intermediate'
    - user_type: 'guest' или 'organizer'
    """
    district = body.district if body.district else None
    
    # Выбираем SQL функцию в зависимости от параметров
    if body.user_type == "guest":
        if body.rating_type == "overall":
            result = STATS_get_guests_overall(district)
        else:  # intermediate
            result = STATS_get_guests_intermediate(district)
    else:  # organizer
        if body.rating_type == "overall":
            result = STATS_get_organizers_overall(district)
        else:  # intermediate
            result = STATS_get_organizers_intermediate(district)
    
    # Обрабатываем результат
    top_users, current_user, last_place_user, total_count = process_stats_result(result, current_user_id)
    
    # Формируем ответ
    return StatsResponse(
        top_users=[StatsUser(**user) for user in top_users],
        current_user=StatsUser(**current_user) if current_user else None,
        last_place_user=StatsUser(**last_place_user) if last_place_user else None,
        last_place=total_count,
        total_count=total_count,
        district=body.district,
        rating_type=body.rating_type,
        user_type=body.user_type
    )


@app.get("/stats/guests/overall")
def get_stats_guests_overall(
    district: str | None = None,
    current_user_id: int = Depends(get_current_user)
):
    """Упрощенный endpoint: Общий рейтинг, визитеры"""
    result = STATS_get_guests_overall(district)
    top_users, current_user, last_place = process_stats_result(result, current_user_id)
    
    return {
        "top_users": [StatsUser(**user) for user in top_users],
        "current_user": StatsUser(**current_user) if current_user else None,
        "last_place": last_place
    }


@app.get("/stats/guests/intermediate")
def get_stats_guests_intermediate(
    district: str | None = None,
    current_user_id: int = Depends(get_current_user)
):
    """Упрощенный endpoint: Промежуточный рейтинг, визитеры"""
    result = STATS_get_guests_intermediate(district)
    top_users, current_user, last_place = process_stats_result(result, current_user_id)
    
    return {
        "top_users": [StatsUser(**user) for user in top_users],
        "current_user": StatsUser(**current_user) if current_user else None,
        "last_place": last_place
    }


@app.get("/stats/organizers/overall")
def get_stats_organizers_overall(
    district: str | None = None,
    current_user_id: int = Depends(get_current_user)
):
    """Упрощенный endpoint: Общий рейтинг, организаторы"""
    result = STATS_get_organizers_overall(district)
    top_users, current_user, last_place = process_stats_result(result, current_user_id)
    
    return {
        "top_users": [StatsUser(**user) for user in top_users],
        "current_user": StatsUser(**current_user) if current_user else None,
        "last_place": last_place
    }


@app.get("/stats/organizers/intermediate")
def get_stats_organizers_intermediate(
    district: str | None = None,
    current_user_id: int = Depends(get_current_user)
):
    """Упрощенный endpoint: Промежуточный рейтинг, организаторы"""
    result = STATS_get_organizers_intermediate(district)
    top_users, current_user, last_place = process_stats_result(result, current_user_id)
    
    return {
        "top_users": [StatsUser(**user) for user in top_users],
        "current_user": StatsUser(**current_user) if current_user else None,
        "last_place": last_place
    }
