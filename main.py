#fastapi dev main.py
#uvicorn main:app --reload
from typing import Union

from fastapi import FastAPI, File, UploadFile,HTTPException
from typing import List

from get_roots_to_bd import MEETINGS_get_info_for_main_page
from post_roots_to_bd import USERS_post_registration, MEETINGS_post_creation, SUPPORT_post_create_ticket_by_user
from models import UserCreate, UserResponse, MeetingCreate, MeetingCreated,SupportCreate,SupportCreated

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}


@app.get("/meetings")
def get_meetings(district : str):
    return MEETINGS_get_info_for_main_page(district)

@app.post("/users/registration", response_model=UserResponse)
def post_registr_user(user : UserCreate):
    result = USERS_post_registration(**user.model_dump())

    if isinstance(result, tuple) and result and result[0] is False:
        _, error, where = result
        raise HTTPException(status_code=400, detail=f"{where}: {error}")

    if isinstance(result, dict) and "user" in result:
        return result["user"]

    raise HTTPException(status_code=500, detail="Unexpected error in USERS_post_registration")

@app.post("/meetings/creation", response_model=MeetingCreated)
def post_creation_meeting(meeting : MeetingCreate):
    result = MEETINGS_post_creation(**meeting.model_dump())

    if isinstance(result, tuple) and result and result[0] is False:
        _, error, where = result
        raise HTTPException(status_code=400, detail=f"{where}: {error}")

    if isinstance(result, dict) and "meeting" in result:
        return result["meeting"]

    raise HTTPException(status_code=500, detail="Unexpected error in MEETINGS_post_creation")

@app.post("/support/creation", response_model=SupportCreated)
def post_creation_ticket(ticket : SupportCreate):
    result = SUPPORT_post_create_ticket_by_user(**ticket.model_dump())

    if isinstance(result, tuple) and result and result[0] is False:
        _, error, where = result
        raise HTTPException(status_code=400, detail=f"{where}: {error}")

    if isinstance(result, dict) and "ticket" in result:
        return result["ticket"]

    raise HTTPException(status_code=500, detail="Unexpected error in SUPPORT_post_create_ticket_by_user")

