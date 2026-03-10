from typing import Union

from fastapi import FastAPI
from fastapi import HTTPException

from get_roots_to_bd import MEETINGS_get_info_for_main_page
from post_roots_to_bd import USERS_post_registration
from models import UserCreate, UserResponse

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

    # если функция вернула dict с полем user
    if isinstance(result, dict) and "user" in result:
        return result["user"]

    # fallback
    raise HTTPException(status_code=500, detail="Unexpected error in USERS_post_registration")