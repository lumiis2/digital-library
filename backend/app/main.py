from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .dependencies import get_db
from .routes import configure_routes
import os

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

# Servir arquivos estáticos (PDFs)
uploads_dir = os.path.join(os.path.dirname(__file__), "../uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
