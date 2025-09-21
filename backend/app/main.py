from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .database import Base, engine, SessionLocal
from .models import Event, Edition, Article, Author, artigo_autor, User
from .schemas import EventoCreate, EventoRead, EditionCreate, EditionRead, AuthorCreate, AuthorRead, ArticleCreate, ArticleRead, UserCreate, UserRead, LoginRequest
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
import hashlib
import jwt  # pip install pyjwt


# Cria tabelas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Digital Library API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        ],  # Or restrict to ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import JSONResponse

@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str = ""):
    return JSONResponse(content={"message": "OK"})


# Dependência de sessão
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ----------------------
# Root
# ----------------------
@app.get("/")
def read_root():
    return {"message": "API Digital Library está funcionando!"}

# ----------------------
# Eventos
# ----------------------
@app.post("/eventos", response_model=EventoRead)
def criar_evento(evento: EventoCreate, db: Session = Depends(get_db)):
    evento_existente = db.query(Event).filter(Event.slug == evento.sigla).first()
    if evento_existente:
        raise HTTPException(
            status_code = 400,
            detail="Já existe um evento com essa sigla registrado no banco de dados"
        )
    novo_evento = Event(nome=evento.nome, slug=evento.sigla)
    db.add(novo_evento)
    db.commit()
    db.refresh(novo_evento)
    return novo_evento

@app.get("/eventos", response_model=list[EventoRead])
def listar_eventos(db: Session = Depends(get_db)):
    return db.query(Event).all()

# ----------------------
# Edições
# ----------------------
@app.post("/edicoes", response_model=EditionRead)
def criar_edicao(edicao: EditionCreate, db: Session = Depends(get_db)):
    edicao_existente = db.query(Edition).filter(Edition.ano == edicao.ano and Edition.evento_id == edicao.evento_id)
    if edicao_existente:
        raise HTTPException(
            status_code = 400,
            detail = "Já existe um evento com essa sigla"
        )
    nova_edicao = Edition(evento_id=edicao.evento_id, ano=edicao.ano)
    db.add(nova_edicao)
    db.commit()
    db.refresh(nova_edicao)
    return nova_edicao

@app.get("/edicoes", response_model=list[EditionRead])
def listar_edicoes(db: Session = Depends(get_db)):
    return db.query(Edition).all()

# ----------------------
# Autores
# ----------------------
@app.post("/autores", response_model=AuthorRead)
def criar_autor(autor: AuthorCreate, db: Session = Depends(get_db)):
    autor_existente = db.query(Author).filter(Author.nome == autor.nome and Author.sobrenome == autor.sobrenome)
    if autor_existente:
        raise HTTPException(
            status_code=400,
            detail="Um autor de mesmo nome já está inserido no banco de dados"
        )
    novo_autor = Author(nome=autor.nome, sobrenome=autor.sobrenome)
    db.add(novo_autor)
    db.commit()
    db.refresh(novo_autor)
    return novo_autor

@app.get("/autores", response_model=list[AuthorRead])
def listar_autores(db: Session = Depends(get_db)):
    return db.query(Author).all()

# ----------------------
# Artigos
# ----------------------
@app.post("/artigos", response_model=ArticleRead)
def criar_artigo(artigo: ArticleCreate, db: Session = Depends(get_db)):
    novo_artigo = Article(
        titulo=artigo.titulo,
        pdf_path=artigo.pdf_path,
        area=artigo.area,
        palavras_chave=artigo.palavras_chave,
        edicao_id=artigo.edicao_id
    )
    db.add(novo_artigo)
    db.commit()
    db.refresh(novo_artigo)

    # Relacionar autores
    if artigo.author_ids:
        autores = db.query(Author).filter(Author.id.in_(artigo.author_ids)).all()
        novo_artigo.authors = autores
        db.commit()
        db.refresh(novo_artigo)

    return novo_artigo

#@app.get("/artigos", response_model=list[ArticleRead])
#def listar_artigos(db: Session = Depends(get_db)):
#    return db.query(Article).all()
@app.get("/artigos", response_model=list[ArticleRead])
def listar_artigos(autor_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Article)
    if autor_id:
        query = query.join(Article.authors).filter(Author.id == autor_id)
    return query.all()

# ----------------------
# Usuários
# ----------------------
SECRET_KEY = "your-secret-key"

def sha256(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

ADMIN_EMAILS = {"luisalcarvalhaes@gmail.com", "outroadmin@email.com"}  # coloque os emails de admin aqui

@app.post("/api/auth/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    perfil = "admin" if user.email in ADMIN_EMAILS else "usuario"
    hashed = sha256(user.senha_hash)
    new_user = User(nome=user.nome, email=user.email, senha_hash=hashed, perfil=perfil)
    db.add(new_user)
    try:
        db.commit()
    except:
        db.rollback()
        raise HTTPException(status_code=409, detail="E-mail já cadastrado")
    db.refresh(new_user)
    return {"message": "Usuário registrado com sucesso", "user": UserRead.from_orm(new_user)}


@app.post("/api/auth/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    email = data.email
    password = data.password
    perfil = data.perfil  # <-- receba o perfil do frontend

    user = db.query(User).filter(User.email == email).first()
    if not user or user.senha_hash != sha256(password):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    # Se o usuário tentar logar como admin, mas não for admin
    if perfil == "admin" and user.perfil != "admin":
        raise HTTPException(status_code=403, detail="Você não tem permissão de admin")

    # Gera um token simples (para produção, use JWT com expiração)
    token = jwt.encode({"user_id": user.id, "email": user.email}, SECRET_KEY, algorithm="HS256")
    return {"token": token, "user": UserRead.from_orm(user)}

@app.get("/usuarios", response_model=list[UserRead])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(User).all()