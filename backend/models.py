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
    creator_user_id : int
    creator_first_name : str
    creator_last_name : str
    registered_users_count : int
    max_people : int
    district : str
    adults_only : bool
    warnings : str
    meeting_description : str

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

class Category(BaseModel):
    category_id : int
    category_name : str
