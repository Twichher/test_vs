#fastapi dev main.py
#uvicorn main:app --reload

from fastapi import FastAPI
from typing import List
from fastapi.middleware.cors import CORSMiddleware

from get_sql import FAQ_get_all_rows, USERS_check_login
from models import FAQ, UserResp, UserLogin

app = FastAPI()



app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # порт твоего Vite
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/faq", response_model=List[FAQ])
def get_faq():
    result = FAQ_get_all_rows()

    if isinstance(result, tuple):
        return result[1]

    return result

@app.post("/login", response_model=UserResp)
def get_login_uer(user : UserLogin):
    result = USERS_check_login(**user.model_dump())

    if isinstance(result, tuple):
        return result[1]
    
    if not result["is_blocked"]:
        return result

