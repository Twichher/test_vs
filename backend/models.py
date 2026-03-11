from pydantic import BaseModel

class FAQ(BaseModel):
    question_id: int
    question_text : str
    question_answer : str

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