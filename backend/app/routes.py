from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from .database import SessionLocal
from . import models, schemas
from typing import List
import hashlib

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_password(password: str) -> str:
    """Hasha a senha usando SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

# ----------------------
# Rotas para Eventos
# ----------------------
async def create_event(evento: schemas.EventoCreate, db: Session = Depends(get_db)):
    db_event = models.Event(nome=evento.nome, slug=evento.sigla, admin_id=evento.admin_id)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

async def get_events(db: Session = Depends(get_db)):
    return db.query(models.Event).all()

# ----------------------
# Rotas para Edições
# ----------------------
async def create_edition(edicao: schemas.EditionCreate, db: Session = Depends(get_db)):
    db_edicao = models.Edition(**edicao.model_dump())
    db.add(db_edicao)
    db.commit()
    db.refresh(db_edicao)
    return db_edicao

async def get_editions(db: Session = Depends(get_db)):
    return db.query(models.Edition).all()

# ----------------------
# Rotas para Autores
# ----------------------
async def create_author(autor: schemas.AuthorCreate, db: Session = Depends(get_db)):
    db_autor = models.Author(**autor.model_dump())
    db.add(db_autor)
    db.commit()
    db.refresh(db_autor)
    return db_autor

async def get_authors(db: Session = Depends(get_db)):
    return db.query(models.Author).all()

# ----------------------
# Rotas para Artigos
# ----------------------
async def create_article(artigo: schemas.ArticleCreate, db: Session = Depends(get_db)):
    db_artigo = models.Article(
        titulo=artigo.titulo,
        area=artigo.area,
        palavras_chave=artigo.palavras_chave,
        edicao_id=artigo.edicao_id,
        pdf_path=artigo.pdf_path
    )
    db.add(db_artigo)
    
    # Adicionar autores ao artigo
    for author_id in artigo.author_ids:
        author = db.query(models.Author).filter(models.Author.id == author_id).first()
        if author:
            db_artigo.authors.append(author)
    
    db.commit()
    db.refresh(db_artigo)
    return db_artigo

async def get_articles(db: Session = Depends(get_db)):
    return db.query(models.Article).all()

# ----------------------
# Rotas para Usuários
# ----------------------
async def create_user(usuario: schemas.UserCreate, db: Session = Depends(get_db)):
    # Verifica se usuário já existe
    db_user = db.query(models.User).filter(models.User.email == usuario.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    db_usuario = models.User(
        nome=usuario.nome,
        email=usuario.email,
        senha_hash=hash_password(usuario.senha_hash),
        perfil=usuario.perfil,
        receive_notifications=1 if usuario.receive_notifications else 0
    )
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

async def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

# ----------------------
# Rotas para Autenticação
# ----------------------
async def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or user.senha_hash != hash_password(request.password):
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    
    return {
        "id": user.id,
        "nome": user.nome,
        "email": user.email,
        "perfil": user.perfil,
        "access_token": "token_placeholder"
    }

# ----------------------
# Rotas para Perfil do Usuário
# ----------------------
async def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    """Retorna o perfil do usuário logado"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

async def get_current_user_profile(db: Session = Depends(get_db)):
    """Retorna o perfil do usuário atualmente logado (via token)"""
    # Por enquanto, retorna um placeholder
    # TODO: Implementar autenticação via JWT token
    raise HTTPException(status_code=401, detail="Token não fornecido")

# ----------------------
# Rotas para Obter por ID ou Slug
# ----------------------
async def get_event_by_id_or_slug(event_id: str, db: Session = Depends(get_db)):
    """Retorna um evento por ID (número) ou slug (texto)"""
    event = None
    
    # Tenta buscar por ID se for número
    if event_id.isdigit():
        event = db.query(models.Event).filter(models.Event.id == int(event_id)).first()
    
    # Se não encontrou, tenta por slug
    if not event:
        event = db.query(models.Event).filter(models.Event.slug == event_id).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return event

async def get_author_by_id_or_slug(author_id: str, db: Session = Depends(get_db)):
    """Retorna um autor por ID (número) ou slug (texto)"""
    author = None
    
    if author_id.isdigit():
        author = db.query(models.Author).filter(models.Author.id == int(author_id)).first()
    
    if not author:
        author = db.query(models.Author).filter(models.Author.slug == author_id).first()
    
    if not author:
        raise HTTPException(status_code=404, detail="Autor não encontrado")
    return author

async def get_edition_by_id(edition_id: int, db: Session = Depends(get_db)):
    """Retorna uma edição específica"""
    edition = db.query(models.Edition).filter(models.Edition.id == edition_id).first()
    if not edition:
        raise HTTPException(status_code=404, detail="Edição não encontrada")
    return edition

async def get_article_by_id(article_id: int, db: Session = Depends(get_db)):
    """Retorna um artigo específico"""
    article = db.query(models.Article).filter(models.Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Artigo não encontrado")
    return article

def configure_routes(app: FastAPI):
    # Rotas para eventos
    app.post("/eventos/", response_model=schemas.EventoRead)(create_event)
    app.get("/eventos/", response_model=List[schemas.EventoRead])(get_events)
    
    # Rotas para edições
    app.post("/edicoes/", response_model=schemas.EditionRead)(create_edition)
    app.get("/edicoes/", response_model=List[schemas.EditionRead])(get_editions)
    
    # Rotas para autores
    app.post("/autores/", response_model=schemas.AuthorRead)(create_author)
    app.get("/autores/", response_model=List[schemas.AuthorRead])(get_authors)
    
    # Rotas para artigos
    app.post("/artigos/", response_model=schemas.ArticleRead)(create_article)
    app.get("/artigos/", response_model=List[schemas.ArticleRead])(get_articles)
    
    # Rotas para usuários
    app.post("/usuarios/", response_model=schemas.UserRead)(create_user)
    app.get("/usuarios/", response_model=List[schemas.UserRead])(get_users)
    
    # Rotas para autenticação
    app.post("/login/", response_model=schemas.LoginResponse)(login)
    
    # Rotas para perfil
    app.get("/perfil/{user_id}", response_model=schemas.UserRead)(get_user_profile)
    app.get("/me", response_model=schemas.UserRead)(get_current_user_profile)
    
    # Rotas para obter por ID ou slug (DEVEM VIR ANTES das rotas de lista genéricas)
    app.get("/eventos/{event_id}", response_model=schemas.EventoRead)(get_event_by_id_or_slug)
    app.get("/autores/{author_id}", response_model=schemas.AuthorRead)(get_author_by_id_or_slug)
    app.get("/edicoes/{edition_id}", response_model=schemas.EditionRead)(get_edition_by_id)
    app.get("/artigos/{article_id}", response_model=schemas.ArticleRead)(get_article_by_id)