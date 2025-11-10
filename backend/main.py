from fastapi import FastAPI
from .database import SessionLocal  # Import the database session

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}
