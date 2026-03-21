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

class MeetingInfoRequestV2(BaseModel):
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
    meeting_city : str
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
