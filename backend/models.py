from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class FAQ(BaseModel):
    question_id: int
    question_text : str
    question_answer : str

class MeetingsListGet(BaseModel):
    district : str

class MeetingTypeOne(BaseModel):
    meeting_id : int
    meeting_title : str
    registered_users_count : int
    max_people_allowed : int
    district : str
    adults_only_18plus : bool
    category_ids : list[int]
    start_at : datetime
    end_at : datetime
    creator_user_id : int
    status : str | None = None
    user_action : str | None = None

class MeetingsRequest(BaseModel):
    meetings: List[MeetingTypeOne]
    meeting_title: Optional[str] = None
    districts: Optional[list[str]] = None
    categories: Optional[list[int]] = None
    max_people: Optional[int] = None

class MeetingInfoRequest(BaseModel):
    meeting_id : int
    status : str
    meeting_title : str
    meeting_start_at : datetime
    meeting_end_at : datetime
    creator_user_id : int
    creator_first_name : str
    creator_last_name : str
    registered_users_count : int
    max_people : int
    district : str
    adults_only : bool
    warnings : str
    meeting_description : str

class MeetingInfoRequestV2(BaseModel):
    meeting_id : int
    status : str
    meeting_title : str
    meeting_start_at : datetime
    meeting_end_at : datetime
    creator_user_id : int
    creator_first_name : str
    creator_last_name : str
    registered_users_count : int
    max_people : int
    district : str
    adults_only : bool
    warnings : str
    meeting_description : str
    meeting_city : str | None
    meeting_adress : str

class MeetingRegedMissedUser(BaseModel):
    user_id : int
    first_name : str
    last_name : str
    is_organizer : bool
    user_action : str
    photo_url : str | None

class UserLogin(BaseModel):
    email_user : str
    password : str

class UserResp(BaseModel):
    user_id : int
    first_name : str
    last_name : str
    district : str
    is_blocked : bool
    is_organizer : bool
    is_admin : bool
    is_registration_completed : bool
    meetings_as_currency : int

class UsersStatsReq(BaseModel):
    meetings_visited_as_guest: int
    count_period_meetings_guest : int
    rating_as_guest : int
    count_all_rating_guest : int
    intermediate_rating_as_guest : int
    count_period_rating_guest : int
    meetings_created_as_organizer : int
    rating_as_organizer : int
    count_period_meetings_as_organizer : int
    intermediate_rating_as_organizer : int
    photo_urls : list[str]

class RegUserToMeetingRequest(BaseModel):
    user_action: str

class Category(BaseModel):
    category_id : int
    category_name : str


class CategoryWithPhoto(BaseModel):
    """Модель категории с фото для отображения в списке"""
    category_id: int
    category_name: str
    photo_url: str


class CategoriesResponse(BaseModel):
    """Ответ со списком категорий"""
    categories: List[CategoryWithPhoto]


class Warning(BaseModel):
    """Модель предупреждения для встречи"""
    warning_id: int
    warning_name: str
    forAdults: bool


class WarningsResponse(BaseModel):
    """Ответ со списком предупреждений"""
    warnings: List[Warning]


#------------------------------------------------------------------------------------------------------
# Модели для создания встречи
#------------------------------------------------------------------------------------------------------

class CreateMeetingRequest(BaseModel):
    """Запрос на создание встречи"""
    title: str
    description: str
    max_people: int
    address: str
    meeting_date: str  # YYYY-MM-DD
    start_time: str    # HH:MM
    end_time: str      # HH:MM
    email_message: str
    adults_only: bool
    category_ids: List[int]
    selected_warnings: dict  # warning_group_id -> option_id
    photos: List[str]  # Base64 data URLs


class CreateMeetingResponse(BaseModel):
    """Ответ при создании встречи"""
    success: bool
    meeting_id: int | None = None
    notification_id: int | None = None
    message: str | None = None


#------------------------------------------------------------------------------------------------------
# Модели для обновления данных пользователя (Settings)
#------------------------------------------------------------------------------------------------------

class UpdateLastNameRequest(BaseModel):
    last_name: str

class UpdateFirstNameRequest(BaseModel):
    first_name: str

class UpdateBirthDateRequest(BaseModel):
    birth_date: str

class UpdateGenderRequest(BaseModel):
    gender: str  # 'M' или 'F'

class UpdateDistrictRequest(BaseModel):
    district: str

class UpdateFieldResponse(BaseModel):
    success: bool
    message: str | None = None
    field_name: str | None = None
    new_value: str | None = None


# Модель для данных пользователя (страница настроек)
class UserSettingsInfo(BaseModel):
    first_name: str
    last_name: str
    birth_date: str | None = None
    gender: str | None = None
    district: str | None = None
    email: str


# Модель для обновления настроек (все поля опциональные)
class UpdateSettingsRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    birth_date: str | None = None
    gender: str | None = None
    district: str | None = None


class UpdateSettingsResponse(BaseModel):
    success: bool
    message: str
    data: UserSettingsInfo | None = None


# Модель для ответа после загрузки фото
class UploadPhotoResponse(BaseModel):
    success: bool
    message: str
    photo_url: str | None = None
    record_id: int | None = None


#------------------------------------------------------------------------------------------------------
# Модели для статистики (Stats Page)
#------------------------------------------------------------------------------------------------------

class StatsUser(BaseModel):
    """Модель пользователя в таблице статистики"""
    user_id: int
    first_name: str
    last_name: str
    district: str
    meetings_count: int
    ratings_count: int
    rating: float
    rvru: float  # Вычисляемый рейтинг RVRU
    rank: int  # Позиция в рейтинге

class StatsRequest(BaseModel):
    """Запрос на получение статистики"""
    district: str | None = None  # Фильтр по району (None = все)
    rating_type: str = "overall"  # 'overall' или 'intermediate'
    user_type: str = "guest"  # 'guest' или 'organizer'

class StatsResponse(BaseModel):
    """Ответ со статистикой"""
    top_users: List[StatsUser]  # Топ-10 пользователей
    current_user: StatsUser | None = None  # Текущий пользователь (если не в топ-10)
    last_place_user: StatsUser | None = None  # Пользователь на последнем месте
    last_place: int  # Номер последнего места (всего участников)
    total_count: int  # Общее количество для отображения
    district: str | None = None  # Примененный фильтр
    rating_type: str  # Примененный тип рейтинга
    user_type: str  # Примененный тип пользователя


#------------------------------------------------------------------------------------------------------
# Модели для уведомлений
#------------------------------------------------------------------------------------------------------

class NotificationItem(BaseModel):
    """Модель уведомления для пользователя"""
    record_id: int
    notification_id: int
    user_id: int
    status: str  # 'read' или 'unread'
    sent_at: datetime
    notification_type: str
    notification_text: str
    meeting_title: str | None = None  # может быть NULL если уведомление не связано со встречей
    meeting_start_at: datetime | None = None
    meeting_end_at: datetime | None = None
    photo_urls: list[str] = []  # список URL фотографий из notification_photos_table_6
