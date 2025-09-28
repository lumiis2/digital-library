from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import date
from typing import Optional

# ----------------------
# Evento
# ----------------------
class EventoCreate(BaseModel):
    nome: str
    sigla: str

class EventoRead(BaseModel):
    id: int
    nome: str
    slug: str

    model_config = {
        "from_attributes": True  # <- substitui orm_mode
    }

# ----------------------
# Edição
# ----------------------
class EditionCreate(BaseModel):
    evento_id: int
    ano: int

class EditionRead(BaseModel):
    id: int
    evento_id: int
    ano: int

    model_config = {
        "from_attributes": True  # <- substitui orm_mode
    }

# ----------------------
# Autor
# ----------------------
class AuthorCreate(BaseModel):
    nome: str
    sobrenome: str

class AuthorRead(BaseModel):
    id: int
    nome: str
    sobrenome: str
    slug: Optional[str] = None

    model_config = {
        "from_attributes": True  # <- substitui orm_mode
    }

# ----------------------
# Artigo
# ----------------------
class ArticleCreate(BaseModel):
    titulo: str
    pdf_path: Optional[str] = None
    area: Optional[str] = None
    palavras_chave: Optional[str] = None
    edicao_id: int
    author_ids: list[int] = []

class ArticleRead(BaseModel):
    id: int
    titulo: str
    pdf_path: str | None
    area: str | None
    palavras_chave: str | None
    edicao_id: int
    authors: list[AuthorRead] = []

    model_config = {
        "from_attributes": True  # <- substitui orm_mode
    }

# ----------------------
# Usuário
# ----------------------
class UserCreate(BaseModel):
    nome: str
    email: EmailStr
    senha_hash: str

class UserRead(BaseModel):
    id: int
    nome: str
    email: EmailStr
    receive_notifications: Optional[int] = 1

    model_config = ConfigDict(from_attributes=True)

# ----------------------
# Notificações
# ----------------------
class NotificationCreate(BaseModel):
    author_id: int

class NotificationRead(BaseModel):
    id: int
    user_id: int
    author_id: int
    is_active: int
    created_at: date

    model_config = ConfigDict(from_attributes=True)

class NotificationSettings(BaseModel):
    receive_notifications: bool

class LoginRequest(BaseModel):
    email: EmailStr
    password: str