from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .dependencies import get_db
from .routes import configure_routes

app = FastAPI()

origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Configurar as rotas
configure_routes(app)

@app.get("/")
def read_root():
    return {"message": "Hello World"}
