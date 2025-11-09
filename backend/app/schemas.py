from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import date
from typing import List, Optional

# ----------------------
# Evento
# ----------------------
class EventoCreate(BaseModel):
    nome: str
    sigla: str  # será usado como slug
    admin_id: Optional[int] = None

class EventoRead(BaseModel):
    id: int
    nome: str
    slug: str
    admin_id: Optional[int] = None

    model_config = {
        "from_attributes": True  # <- substitui orm_mode
    }

class EventoUpdate(BaseModel):
    nome: str | None = None

# ----------------------
# Edição
# ----------------------
class EditionBase(BaseModel):
    ano: int
    evento_id: int
    slug: str | None = None
    descricao: str | None = None
    data_inicio: date | None = None
    data_fim: date | None = None
    local: str | None = None
    site_url: str | None = None

class EditionCreate(EditionBase):
    pass

class EditionRead(EditionBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

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
    edicao_id: int | None
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
    perfil: str = "usuario"
    receive_notifications: bool = True

class UserRead(BaseModel):
    id: int
    nome: str
    email: EmailStr
    perfil: str
    receive_notifications: bool = True
    
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