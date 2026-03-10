from pydantic import BaseModel

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    password_hash: str
    middle_name: str | None = None
    birth_date: str | None = None
    gender: str | None = None
    district: str | None = None
    city: str = "Moscow"

class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    middle_name: str | None = None
    birth_date: str | None = None
    gender: str | None = None
    district: str | None = None
    city: str = "Moscow"

class MeetingCreate(BaseModel):
    creator_user_id : int
    title : str
    description : str
    description_for_notific : str
    max_people : int
    address : str
    district : str
    adults_only : bool
    start_at : str
    end_at : str
    list_of_photos : list[str]
    list_of_warnings : list[int]
    list_of_categories : list[int]
    city : str = 'Moscow'

class MeetingCreated(BaseModel):
    meeting_id : int
    notification_id : int
    creator_user_id : int
    title : str
    description : str
    max_people : int
    address : str
    district : str
    adults_only : bool
    start_at : str
    end_at : str
    list_of_photos : list[str]
    list_of_warnings : list[int]
    list_of_categories : list[int]
    city : str = 'Moscow'

class SupportCreate(BaseModel):
    requester_user_id : int
    category : str
    message_text : str
    photos_url : list[str] | None = None

class SupportCreated(BaseModel):
    ticket_id : int
    requester_user_id : int
    category : str
    message_text : str
    photos_url : list[str] | None = None