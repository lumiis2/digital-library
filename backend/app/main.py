from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .database import Base, engine, SessionLocal
from .models import Event, Edition, Article, Author, artigo_autor, User
from .schemas import EventoCreate, EventoRead, EditionCreate, EditionRead, AuthorCreate, AuthorRead, ArticleCreate, ArticleRead, UserCreate, UserRead, LoginRequest
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
import hashlib
import jwt  # pip install pyjwt
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import asyncio
from typing import List


# Configurações de email
EMAIL_CONFIG = {
    "SMTP_SERVER": "smtp.gmail.com",  # Configure conforme seu provedor
    "SMTP_PORT": 587,
    "EMAIL_FROM": "noreply@digitallibrary.com",  # Configure com seu email
    "EMAIL_PASSWORD": "your_app_password",  # Configure com a senha do app
}

# Função para enviar email
async def send_notification_email(to_email: str, author_name: str, article_title: str, event_name: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_CONFIG["EMAIL_FROM"]
        msg['To'] = to_email
        msg['Subject'] = f"Novo artigo publicado - {article_title}"
        
        body = f"""
        Olá {author_name},
        
        Temos o prazer de informar que um novo artigo de sua autoria foi publicado em nossa biblioteca digital:
        
        Título: {article_title}
        Evento: {event_name}
        
        Você pode visualizar o artigo acessando nossa plataforma.
        
        Atenciosamente,
        Equipe da Biblioteca Digital
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Comentado para evitar erro em ambiente de desenvolvimento
        # Em produção, descomente e configure as credenciais corretas
        """
        server = smtplib.SMTP(EMAIL_CONFIG["SMTP_SERVER"], EMAIL_CONFIG["SMTP_PORT"])
        server.starttls()
        server.login(EMAIL_CONFIG["EMAIL_FROM"], EMAIL_CONFIG["EMAIL_PASSWORD"])
        text = msg.as_string()
        server.sendmail(EMAIL_CONFIG["EMAIL_FROM"], to_email, text)
        server.quit()
        """
        
        print(f"Email de notificação enviado para {to_email} sobre o artigo '{article_title}'")
        return True
    except Exception as e:
        print(f"Erro ao enviar email: {str(e)}")
        return False

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
    evento_existente = db.query(Event).filter(
        Event.slug == evento.sigla,
        Event.admin_id == evento.admin_id).first()
    if evento_existente:
        raise HTTPException(
            status_code = 400,
            detail="Já existe um evento com essa sigla registrado no banco de dados"
        )
    novo_evento = Event(nome=evento.nome, slug=evento.sigla, admin_id=evento.admin_id)
    db.add(novo_evento)
    db.commit()
    db.refresh(novo_evento)
    return novo_evento

# Atualizar edição
@app.put("/edicoes/{edicao_id}", response_model=EditionRead)
def atualizar_edicao(edicao_id: int, edicao: EditionCreate, db: Session = Depends(get_db)):
    edicao_db = db.query(Edition).filter(Edition.id == edicao_id).first()
    if not edicao_db:
        raise HTTPException(status_code=404, detail="Edição não encontrada")
    
    edicao_db.ano = edicao.ano
    edicao_db.evento_id = edicao.evento_id
    db.commit()
    db.refresh(edicao_db)
    return edicao_db

# Deletar edição
@app.delete("/edicoes/{edicao_id}")
def deletar_edicao(edicao_id: int, db: Session = Depends(get_db)):
    edicao_db = db.query(Edition).filter(Edition.id == edicao_id).first()
    if not edicao_db:
        raise HTTPException(status_code=404, detail="Edição não encontrada")
    
    db.delete(edicao_db)
    db.commit()
    return {"message": "Edição deletada com sucesso"}

@app.get("/eventos", response_model=list[EventoRead])
def listar_eventos(db: Session = Depends(get_db)):
    return db.query(Event).all()

@app.get("/eventos/{slug}", response_model=EventoRead)
def obter_evento_por_slug(slug: str, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.slug == slug).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return evento

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

@app.get("/eventos/{evento_slug}/edicoes")
def listar_edicoes_do_evento(evento_slug: str, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.slug == evento_slug).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    edicoes = db.query(Edition).filter(Edition.evento_id == evento.id).all()
    
    # Adicionar contagem de artigos para cada edição
    result = []
    for edicao in edicoes:
        artigos_count = db.query(Article).filter(Article.edicao_id == edicao.id).count()
        edicao_dict = {
            "id": edicao.id,
            "evento_id": edicao.evento_id,
            "ano": edicao.ano,
            "slug": edicao.slug,
            "total_artigos": artigos_count
        }
        result.append(edicao_dict)
    
    return result

@app.get("/eventos/{evento_slug}/{ano}", response_model=EditionRead)
def obter_edicao_por_slug_e_ano(evento_slug: str, ano: int, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.slug == evento_slug).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    edicao = db.query(Edition).filter(Edition.evento_id == evento.id, Edition.ano == ano).first()
    if not edicao:
        raise HTTPException(status_code=404, detail="Edição não encontrada")
    return edicao

@app.get("/eventos/{evento_slug}/{ano}/artigos", response_model=list[ArticleRead])
def listar_artigos_da_edicao(evento_slug: str, ano: int, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.slug == evento_slug).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    edicao = db.query(Edition).filter(Edition.evento_id == evento.id, Edition.ano == ano).first()
    if not edicao:
        raise HTTPException(status_code=404, detail="Edição não encontrada")
    return db.query(Article).filter(Article.edicao_id == edicao.id).all()

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
    
    # Gerar slug amigável para o autor
    slug_base = f"{autor.nome.lower()}-{autor.sobrenome.lower()}"
    slug_base = slug_base.replace(" ", "-").replace(".", "").replace(",", "")
    
    # Verificar se o slug já existe e adicionar número se necessário
    slug = slug_base
    contador = 1
    while db.query(Author).filter(Author.slug == slug).first():
        slug = f"{slug_base}-{contador}"
        contador += 1
    
    novo_autor = Author(nome=autor.nome, sobrenome=autor.sobrenome, slug=slug)
    db.add(novo_autor)
    db.commit()
    db.refresh(novo_autor)
    return novo_autor

@app.get("/autores", response_model=list[AuthorRead])
def listar_autores(db: Session = Depends(get_db)):
    return db.query(Author).all()

@app.get("/autores/{slug}", response_model=AuthorRead)
def obter_autor_por_slug(slug: str, db: Session = Depends(get_db)):
    autor = db.query(Author).filter(Author.slug == slug).first()
    if not autor:
        raise HTTPException(status_code=404, detail="Autor não encontrado")
    return autor

@app.get("/autores/{slug}/artigos")
def listar_artigos_do_autor(slug: str, db: Session = Depends(get_db)):
    autor = db.query(Author).filter(Author.slug == slug).first()
    if not autor:
        raise HTTPException(status_code=404, detail="Autor não encontrado")
    
    # Buscar artigos do autor com informações das edições e eventos
    artigos = db.query(Article).join(Article.authors).filter(Author.slug == slug).all()
    
    # Organizar artigos por ano
    artigos_por_ano = {}
    for artigo in artigos:
        if artigo.edition and artigo.edition.ano:
            ano = artigo.edition.ano
            if ano not in artigos_por_ano:
                artigos_por_ano[ano] = []
            artigos_por_ano[ano].append(artigo)
    
    return {
        "autor": autor,
        "artigos_por_ano": artigos_por_ano,
        "total_artigos": len(artigos)
    }

# ----------------------
# Artigos
# ----------------------
@app.post("/artigos", response_model=ArticleRead)
async def criar_artigo(artigo: ArticleCreate, db: Session = Depends(get_db)):
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
        
        # Buscar informações da edição e evento para o email
        edicao = db.query(Edition).filter(Edition.id == artigo.edicao_id).first()
        evento_nome = edicao.event.nome if edicao and edicao.event else "Evento não identificado"
        
        # Enviar notificações por email para os autores
        for autor in autores:
            # Buscar o usuário correspondente ao autor (se existir)
            usuario = db.query(User).filter(
                User.nome.ilike(f"%{autor.nome}%"),
                User.notificar_novos_artigos == 1
            ).first()
            
            if usuario:
                # Enviar email de notificação de forma assíncrona
                try:
                    await send_notification_email(
                        str(usuario.email),
                        f"{autor.nome} {autor.sobrenome}",
                        artigo.titulo,
                        evento_nome
                    )
                except Exception as e:
                    print(f"Erro ao enviar notificação para {usuario.email}: {str(e)}")

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
    if not user or str(user.senha_hash) != sha256(password):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    # Se o usuário tentar logar como admin, mas não for admin
    if perfil == "admin" and str(user.perfil) != "admin":
        raise HTTPException(status_code=403, detail="Você não tem permissão de admin")

    # Gera um token simples (para produção, use JWT com expiração)
    token = jwt.encode({"user_id": user.id, "email": user.email}, SECRET_KEY, algorithm="HS256")
    return {"token": token, "user": UserRead.from_orm(user)}

@app.get("/usuarios", response_model=list[UserRead])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(User).all()

@app.put("/usuarios/{user_id}/notificacoes")
@app.put("/usuarios/{user_id}/notificacoes")
def atualizar_preferencias_notificacao(user_id: int, receber_notificacoes: bool, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Atualizar a preferência de notificação do usuário
    db.query(User).filter(User.id == user_id).update({
        User.notificar_novos_artigos: 1 if receber_notificacoes else 0
    })
    db.commit()
    
    return {
        "message": "Preferências de notificação atualizadas com sucesso",
        "receber_notificacoes": receber_notificacoes
    }

@app.get("/usuarios/{user_id}/notificacoes")
def obter_preferencias_notificacao(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    return {
        "user_id": user_id,
        "receber_notificacoes": bool(user.notificar_novos_artigos)
    }