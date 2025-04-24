from fastapi import FastAPI
from app.auth import auth_router
from app.database import create_db_and_tables

app = FastAPI(title="Kinetic SportSystem API", version="0.1")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.include_router(auth_router, prefix="/auth", tags=["Auth"])

@app.get("/")
def root():
    return {"message": "Kinetic SportSystem Backend Running..."}