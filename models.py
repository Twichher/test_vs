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