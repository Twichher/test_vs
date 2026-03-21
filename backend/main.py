#fastapi dev main.py
#uvicorn main:app --reload

from fastapi import Cookie, FastAPI, HTTPException, Response, Depends
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta, timezone
from jose import jwt

from get_sql import FAQ_get_all_rows, MEETINGS_get_reged_missed_users, MEETINGS_reged_get_all_info, USERS_check_login, USERS_get_MEETINGS_info_finished, USERS_get_MEETINGS_info_reged, USERS_get_info_by_id,MEETINGS_get_created_lsit, MEETINGS_no_sql_sort_by_params, \
CATEGORIES_get_all, MEETINGS_get_all_info, USERS_get_reged_meetings, USERS_get_all_stats_by_id
from post_sql import USERS_post_reg_to_meet
from models import FAQ, MeetingInfoRequestV2, MeetingRegedMissedUser, UserResp, UserLogin, MeetingsListGet, MeetingTypeOne, MeetingsRequest, Category, MeetingInfoRequest, \
UsersStatsReq, RegUserToMeetingRequest
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

@app.get("/meetings/{meeting_id}/info", response_model=MeetingInfoRequestV2)
def get_meetings_all_info_new_page(meeting_id : int,user_id: int = Depends(get_current_user)):
    result = MEETINGS_reged_get_all_info(meeting_id)

    if isinstance(result, tuple):
        raise HTTPException(
            status_code=500,
            detail=result[1]
        )
    
    return result


@app.post("/meetings/{meeting_id}/user/{user_id}")
def post_reg_user_to_meeting(meeting_id : int, user_id : int, body : RegUserToMeetingRequest):
    result = USERS_post_reg_to_meet(meeting_id , user_id, body.user_action)

    if isinstance(result, tuple): 
        raise HTTPException(status_code=500, detail=result[1])
    
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

