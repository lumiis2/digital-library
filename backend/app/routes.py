from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from .database import SessionLocal
from . import models, schemas
from typing import List

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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

def configure_routes(app: FastAPI):
    # Rotas para eventos
    app.post("/eventos/", response_model=schemas.EventoRead)(create_event)
    app.get("/eventos/", response_model=List[schemas.EventoRead])(get_events)
    
    # Rotas para edições
    app.post("/edicoes/", response_model=schemas.EditionRead)(create_edition)
    
    # Rotas para autores
    app.post("/autores/", response_model=schemas.AuthorRead)(create_author)
    app.get("/autores/", response_model=List[schemas.AuthorRead])(get_authors)
    
    # Rotas para artigos
    app.post("/artigos/", response_model=schemas.ArticleRead)(create_article)