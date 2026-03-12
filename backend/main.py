#fastapi dev main.py
#uvicorn main:app --reload

from fastapi import Cookie, FastAPI, HTTPException, Response, Depends
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta, timezone
from jose import jwt

from get_sql import FAQ_get_all_rows, USERS_check_login, USERS_get_info_by_id,MEETINGS_get_created_lsit, MEETINGS_no_sql_sort_by_params, \
CATEGORIES_get_all
from models import FAQ, UserResp, UserLogin, MeetingsListGet, MeetingTypeOne, MeetingsRequest, Category
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


#------------------------------------------------------------------------------------------------------
#roots to CATEGORIES
#------------------------------------------------------------------------------------------------------


@app.get("/meetings/categories", response_model=List[Category])
def get_all_categories():
    result = CATEGORIES_get_all()

    if isinstance(result, tuple):
        raise HTTPException(
            status_code=500,
            detail=result[1]
        )
    
    return result