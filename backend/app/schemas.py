from pydantic import BaseModel
from datetime import date

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

    class Config:
        orm_mode = True

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

    class Config:
        orm_mode = True

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

    class Config:
        orm_mode = True

# ----------------------
# Artigo
# ----------------------
class ArticleCreate(BaseModel):
    titulo: str
    pdf_path: str = None
    area: str = None
    palavras_chave: str = None
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

    class Config:
        orm_mode = True
