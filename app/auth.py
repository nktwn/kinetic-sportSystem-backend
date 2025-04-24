from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlmodel import Session, select
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional
from app.database import get_session
from app.models import User, UserCreate, Token, TokenData

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

auth_router = APIRouter()

ARMY_RANKS = [
    "Рядовой", "Ефрейтор", "Младший сержант", "Сержант",
    "Старший сержант", "Старшина", "Прапорщик", "Старший прапорщик",
    "Младший лейтенант", "Лейтенант", "Старший лейтенант", "Капитан",
    "Майор", "Подполковник", "Полковник", "Генерал-майор", "Генерал-лейтенант"
]

def create_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return TokenData(username=payload.get("sub"), role=payload.get("role"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@auth_router.post("/register")
def register(user: UserCreate, session: Session = Depends(get_session)):
    if user.rank not in ARMY_RANKS:
        raise HTTPException(status_code=400, detail="Invalid rank")
    existing_user = session.exec(select(User).where(User.username == user.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    new_user = User.from_orm(user)
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return {"message": f"User {new_user.username} registered successfully"}

@auth_router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or user.password != form_data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"sub": user.username, "role": user.role}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": token, "token_type": "bearer"}

@auth_router.get("/me")
def read_current_user(current_user: TokenData = Depends(get_current_user)):
    return current_user