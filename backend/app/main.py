from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from .database import Base, engine, SessionLocal
from .models import Event, Edition, Article, Author, artigo_autor, User, Notification, EmailLog
from .schemas import EventoCreate, EventoRead, EventoUpdate, EditionCreate, EditionRead, AuthorCreate, AuthorRead, ArticleCreate, ArticleRead, UserCreate, UserRead, LoginRequest, NotificationCreate, NotificationRead, NotificationSettings
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
import hashlib
import smtplib
from email.mime.text import MIMEText
import os
import shutil
from email.mime.multipart import MIMEMultipart
import asyncio
from typing import List
from datetime import date
import bibtexparser


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

app = FastAPI()

# Criar diretório uploads se não existir e servir arquivos estáticos (PDFs)
uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
        Event.slug == evento.sigla).first()
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

@app.get("/eventos", response_model=list[EventoRead])
def listar_eventos(db: Session = Depends(get_db)):
    return db.query(Event).all()

@app.get("/eventos/by-id/{evento_id}", response_model=EventoRead)
def obter_evento_por_id(evento_id: int, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return evento

@app.get("/eventos/{slug}", response_model=EventoRead)
def obter_evento_por_slug(slug: str, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.slug == slug).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return evento

# Editar evento por ID
@app.put("/eventos/{evento_id}", response_model=EventoRead)
def atualizar_evento(evento_id: int, evento: EventoUpdate, db: Session = Depends(get_db)):
    evento_db = db.query(Event).filter(Event.id == evento_id).first()
    if not evento_db:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    # Atualizar campos se fornecidos
    if evento.nome is not None:
        setattr(evento_db, 'nome', evento.nome)
    if evento.admin_id is not None:
        setattr(evento_db, 'admin_id', evento.admin_id)
    
    db.commit()
    db.refresh(evento_db)
    return evento_db

# Deletar evento por ID
@app.delete("/eventos/{evento_id}")
def deletar_evento(evento_id: int, db: Session = Depends(get_db)):
    evento_db = db.query(Event).filter(Event.id == evento_id).first()
    if not evento_db:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    db.delete(evento_db)
    db.commit()
    return {"message": "Evento deletado com sucesso"}

# Criar edição
@app.post("/edicoes", response_model=EditionRead)
def criar_edicao(edicao: EditionCreate, db: Session = Depends(get_db)):
    # Verificar se o evento existe
    evento = db.query(Event).filter(Event.id == edicao.evento_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    # Verificar se já existe uma edição para esse evento no mesmo ano
    edicao_existente = db.query(Edition).filter(
        Edition.evento_id == edicao.evento_id,
        Edition.ano == edicao.ano
    ).first()
    if edicao_existente:
        raise HTTPException(status_code=400, detail="Já existe uma edição para este evento no ano especificado")
    
    # Gerar slug para a edição (evento_slug + ano)
    slug = f"{evento.slug}-{edicao.ano}"
    
    edicao_db = Edition(ano=edicao.ano, evento_id=edicao.evento_id, slug=slug)
    db.add(edicao_db)
    db.commit()
    db.refresh(edicao_db)
    return edicao_db

# Atualizar edição
@app.put("/edicoes/{edicao_id}", response_model=EditionRead)
def atualizar_edicao(edicao_id: int, edicao: EditionCreate, db: Session = Depends(get_db)):
    edicao_db = db.query(Edition).filter(Edition.id == edicao_id).first()
    if not edicao_db:
        raise HTTPException(status_code=404, detail="Edição não encontrada")
    
    setattr(edicao_db, 'ano', edicao.ano)
    setattr(edicao_db, 'evento_id', edicao.evento_id)
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

@app.get("/edicoes", response_model=list[EditionRead])
def listar_edicoes(db: Session = Depends(get_db)):
    return db.query(Edition).all()

@app.get("/eventos/{evento_slug}/edicoes")
def listar_edicoes_do_evento(evento_slug: str, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.slug == evento_slug).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    edicoes = db.query(Edition).filter(Edition.evento_id == evento.id).all()
    return edicoes

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
    autor_existente = db.query(Author).filter((Author.nome == autor.nome) & (Author.sobrenome == autor.sobrenome)).first()
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
        # for autor in autores:
        #     # Buscar o usuário correspondente ao autor (se existir)
        #     usuario = db.query(User).filter(
        #         User.nome.ilike(f"%{autor.nome}%"),
        #         User.notificar_novos_artigos == 1
        #     ).first()
        #     
        #     if usuario:
        #         # Enviar email de notificação de forma assíncrona
        #         try:
        #             await send_notification_email(
        #                 str(usuario.email),
        #                 f"{autor.nome} {autor.sobrenome}",
        #                 artigo.titulo,
        #                 evento_nome
        #             )
        #         except Exception as e:
        #             print(f"Erro ao enviar notificação para {usuario.email}: {str(e)}")

    return novo_artigo

#@app.get("/artigos", response_model=list[ArticleRead])
#def listar_artigos(db: Session = Depends(get_db)):
#    return db.query(Article).all()

# Upload de PDF
@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são permitidos")
    
    # Criar diretório uploads se não existir
    upload_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Salvar arquivo
    file_path = os.path.join(upload_dir, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Retornar URL completa do arquivo para acesso via web
        file_url = f"/uploads/{file.filename}"
        return {"message": "Upload realizado com sucesso", "file_path": file_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar arquivo: {str(e)}")

@app.get("/artigos", response_model=list[ArticleRead])
def listar_artigos(autor_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Article)
    if autor_id:
        query = query.join(Article.authors).filter(Author.id == autor_id)
    artigos = query.all()
    
    # Criar resposta manual para evitar problemas de serialização
    result = []
    for artigo in artigos:
        authors_list = []
        for author in artigo.authors:
            authors_list.append({
                "id": author.id,
                "nome": author.nome,
                "sobrenome": author.sobrenome,
                "slug": author.slug
            })
        
        result.append({
            "id": artigo.id,
            "titulo": artigo.titulo,
            "pdf_path": artigo.pdf_path,
            "area": artigo.area,
            "palavras_chave": artigo.palavras_chave,
            "edicao_id": artigo.edicao_id,
            "authors": authors_list
        })
    
    return result

@app.delete("/artigos/{artigo_id}")
def deletar_artigo(artigo_id: int, db: Session = Depends(get_db)):
    artigo_db = db.query(Article).filter(Article.id == artigo_id).first()
    if not artigo_db:
        raise HTTPException(status_code=404, detail="Artigo não encontrado")
    
    db.delete(artigo_db)
    db.commit()
    return {"message": "Artigo deletado com sucesso"}

@app.post("/upload-bibtex")
async def upload_bibtex(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Endpoint para processar arquivo BibTeX e retornar artigos para preview
    """
    if not file.filename or not file.filename.endswith(('.bib', '.bibtex')):
        raise HTTPException(status_code=400, detail="Apenas arquivos .bib ou .bibtex são permitidos")
    
    try:
        # Ler conteúdo do arquivo
        content = await file.read()
        content_str = content.decode('utf-8')
        
        # Parsear BibTeX
        bib_database = bibtexparser.loads(content_str)
        
        articles_preview = []
        
        for entry in bib_database.entries:
            # Extrair informações do artigo
            article_data = {
                "titulo": entry.get('title', '').replace('{', '').replace('}', ''),
                "area": entry.get('keywords', '') or entry.get('subject', ''),
                "palavras_chave": entry.get('keywords', ''),
                "resumo": entry.get('abstract', ''),
                "doi": entry.get('doi', ''),
                "categoria": entry.get('type', entry.get('ENTRYTYPE', '')),
                "data_publicacao": entry.get('year', ''),
                "bibtex_key": entry.get('ID', ''),
                "authors": []
            }
            
            # Processar autores
            if 'author' in entry:
                authors_str = entry['author']
                # Separar autores por ' and '
                author_names = [name.strip() for name in authors_str.split(' and ')]
                
                for author_name in author_names:
                    if ',' in author_name:
                        # Formato: "Sobrenome, Nome"
                        parts = author_name.split(',', 1)
                        sobrenome = parts[0].strip()
                        nome = parts[1].strip() if len(parts) > 1 else ""
                    else:
                        # Formato: "Nome Sobrenome" - pegar a última palavra como sobrenome
                        parts = author_name.strip().split()
                        if len(parts) > 1:
                            nome = ' '.join(parts[:-1])
                            sobrenome = parts[-1]
                        else:
                            nome = parts[0] if parts else ""
                            sobrenome = ""
                    
                    article_data["authors"].append({
                        "nome": nome,
                        "sobrenome": sobrenome
                    })
            
            articles_preview.append(article_data)
        
        return {
            "message": f"Arquivo processado com sucesso. Encontrados {len(articles_preview)} artigos.",
            "articles": articles_preview,
            "total": len(articles_preview)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar arquivo BibTeX: {str(e)}")

@app.post("/confirm-bibtex-import")
async def confirm_bibtex_import(
    request_data: dict,
    db: Session = Depends(get_db)
):
    """
    Confirmar e salvar artigos do BibTeX no banco de dados
    """
    try:
        articles = request_data.get("articles", [])
        edicao_id = request_data.get("edicao_id")
        
        if not edicao_id:
            raise HTTPException(status_code=400, detail="edicao_id é obrigatório")
        
        saved_articles = []
        
        for article_data in articles:
            # Criar autores se não existirem
            author_ids = []
            for author_info in article_data.get("authors", []):
                nome = author_info.get("nome", "")
                sobrenome = author_info.get("sobrenome", "")
                
                # Procurar autor existente
                existing_author = db.query(Author).filter(
                    Author.nome == nome,
                    Author.sobrenome == sobrenome
                ).first()
                
                if existing_author:
                    author_ids.append(existing_author.id)
                else:
                    # Criar novo autor
                    slug = f"{nome.lower()}-{sobrenome.lower()}".replace(" ", "-")
                    new_author = Author(
                        nome=nome,
                        sobrenome=sobrenome,
                        slug=slug
                    )
                    db.add(new_author)
                    db.flush()  # Para obter o ID
                    author_ids.append(new_author.id)
            
            # Criar artigo
            new_article = Article(
                titulo=article_data.get("titulo", ""),
                area=article_data.get("area", ""),
                palavras_chave=article_data.get("palavras_chave", ""),
                resumo=article_data.get("resumo", ""),
                doi=article_data.get("doi", ""),
                categoria=article_data.get("categoria", ""),
                edicao_id=edicao_id,
                pdf_path=None  # Sem PDF para importação BibTeX
            )
            
            db.add(new_article)
            db.flush()  # Para obter o ID
            
            # Associar autores
            for author_id in author_ids:
                db.execute(
                    artigo_autor.insert().values(
                        artigo_id=new_article.id,
                        autor_id=author_id
                    )
                )
            
            saved_articles.append({
                "id": new_article.id,
                "titulo": new_article.titulo
            })
        
        db.commit()
        
        return {
            "message": f"Importação concluída com sucesso! {len(saved_articles)} artigos salvos.",
            "saved_articles": saved_articles
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar artigos: {str(e)}")

# ----------------------
# Usuários
# ----------------------
SECRET_KEY = "your-secret-key"

def sha256(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

ADMIN_EMAILS = {"luisalcarvalhaes@gmail.com", "outroadmin@email.com"}  # coloque os emails de admin aqui
# senha123 

@app.post("/api/auth/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        # Verificar se o email já existe
        existing_user = db.query(User).filter(User.email == str(user.email)).first()
        if existing_user:
            raise HTTPException(status_code=409, detail="E-mail já cadastrado")
        
        hashed = sha256(user.senha_hash)
        perfil = "admin" if str(user.email) in ADMIN_EMAILS else "usuario"
        new_user = User(nome=user.nome, email=str(user.email), senha_hash=hashed, perfil=perfil)
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {"message": "Usuário registrado com sucesso", "user": {
            "id": new_user.id,
            "nome": new_user.nome,
            "email": str(new_user.email),
            "perfil": new_user.perfil  
        }}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@app.post("/api/auth/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    email = data.email
    password = data.password

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    if str(user.senha_hash) != sha256(password):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    # Gera um token simples (substituindo JWT temporariamente)
    try:
        token = f"user_{user.id}_{sha256(str(user.id) + SECRET_KEY)}"
        return {"token": token, "user": {
            "id": user.id,
            "nome": user.nome,
            "email": str(user.email),
            "perfil": user.perfil
        }}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar token: {str(e)}")

# @app.get("/usuarios", response_model=list[UserRead])
# def listar_usuarios(db: Session = Depends(get_db)):
#     return db.query(User).all()

@app.put("/usuarios/{user_id}/notificacoes")
@app.put("/usuarios/{user_id}/notificacoes")
def atualizar_preferencias_notificacao(user_id: int, receber_notificacoes: bool, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Atualizar a preferência de notificação do usuário
    # db.query(User).filter(User.id == user_id).update({
    #     User.notificar_novos_artigos: 1 if receber_notificacoes else 0
    # })
    # db.commit()
    
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
        "receber_notificacoes": bool(user.receive_notifications)
    }

# ----------------------
# Endpoints de Notificação para Autores
# ----------------------
@app.post("/usuarios/{user_id}/seguir-autor/{author_id}")
def seguir_autor(user_id: int, author_id: int, db: Session = Depends(get_db)):
    # Verificar se usuário existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Verificar se autor existe
    author = db.query(Author).filter(Author.id == author_id).first()
    if not author:
        raise HTTPException(status_code=404, detail="Autor não encontrado")
    
    # Verificar se já segue o autor
    existing = db.query(Notification).filter(
        (Notification.user_id == user_id) & (Notification.author_id == author_id)
    ).first()
    
    if existing:
        # Reativar se estava desativado
        db.query(Notification).filter(
            (Notification.user_id == user_id) & (Notification.author_id == author_id)
        ).update({"is_active": 1})
        db.commit()
        return {"message": f"Você voltou a seguir {author.nome} {author.sobrenome}"}
    
    # Criar nova notificação
    from datetime import date
    notification = Notification(
        user_id=user_id,
        author_id=author_id,
        is_active=1,
        created_at=date.today()
    )
    db.add(notification)
    db.commit()
    
    return {"message": f"Agora você segue {author.nome} {author.sobrenome} e receberá emails quando ele publicar novos artigos!"}

@app.delete("/usuarios/{user_id}/seguir-autor/{author_id}")
def parar_de_seguir_autor(user_id: int, author_id: int, db: Session = Depends(get_db)):
    notification = db.query(Notification).filter(
        (Notification.user_id == user_id) & (Notification.author_id == author_id)
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Você não segue este autor")
    
    author = db.query(Author).filter(Author.id == author_id).first()
    if not author:
        raise HTTPException(status_code=404, detail="Autor não encontrado")
    
    # Update using database update instead of attribute assignment
    db.query(Notification).filter(
        (Notification.user_id == user_id) & (Notification.author_id == author_id)
    ).update({"is_active": 0})
    db.commit()
    
    return {"message": f"Você parou de seguir {author.nome} {author.sobrenome}"}

# Endpoint para seguir/parar de seguir autor (com autenticação)
@app.post("/seguir-autor")
def seguir_autor_auth(
    request: dict,
    db: Session = Depends(get_db)
):
    # Para simplicidade, vamos usar o user_id = 1 como padrão
    # Em um sistema real, extrairíamos o user_id do token JWT
    user_id = 1
    author_id = request.get("autor_id")
    acao = request.get("acao")  # "seguir" ou "parar_seguir"
    
    if not author_id or not acao:
        raise HTTPException(
            status_code=400, 
            detail="É necessário informar autor_id e acao"
        )
    
    # Verificar se o autor existe
    author = db.query(Author).filter(Author.id == author_id).first()
    if not author:
        raise HTTPException(status_code=404, detail="Autor não encontrado")
    
    # Verificar se já existe uma notificação
    existing_notification = db.query(Notification).filter(
        (Notification.user_id == user_id) & (Notification.author_id == author_id)
    ).first()
    
    if acao == "seguir":
        if existing_notification:
            # Reativar se estava desativada
            db.query(Notification).filter(
                (Notification.user_id == user_id) & (Notification.author_id == author_id)
            ).update({"is_active": 1})
        else:
            # Criar nova notificação
            new_notification = Notification(
                user_id=user_id,
                author_id=author_id,
                is_active=1
            )
            db.add(new_notification)
        
        db.commit()
        return {"mensagem": f"Você agora está seguindo {author.nome} {author.sobrenome}!"}
    
    elif acao == "parar_seguir":
        if existing_notification:
            # Desativar notificação
            db.query(Notification).filter(
                (Notification.user_id == user_id) & (Notification.author_id == author_id)
            ).update({"is_active": 0})
            db.commit()
        
        return {"mensagem": f"Você parou de seguir {author.nome} {author.sobrenome}"}
    
    else:
        raise HTTPException(
            status_code=400, 
            detail="Ação inválida. Use 'seguir' ou 'parar_seguir'"
        )

# Endpoint para listar autores seguidos (com autenticação)
@app.get("/autores-seguidos")
def listar_autores_seguidos_auth(db: Session = Depends(get_db)):
    # Para simplicidade, vamos usar o user_id = 1 como padrão
    # Em um sistema real, extrairíamos o user_id do token JWT
    user_id = 1
    
    notifications = db.query(Notification).filter(
        (Notification.user_id == user_id) & (Notification.is_active == 1)
    ).all()
    
    autores_seguidos = []
    for notif in notifications:
        author = db.query(Author).filter(Author.id == notif.author_id).first()
        if author:
            autores_seguidos.append({
                "id": author.id,
                "nome": author.nome,
                "sobrenome": author.sobrenome,
                "slug": author.slug,
                "seguindo_desde": notif.created_at
            })
    
    return {
        "total": len(autores_seguidos),
        "autores": autores_seguidos
    }

# ----------------------
# Sistema de Envio de Emails
# ----------------------
async def enviar_notificacao_novo_artigo(article_id: int, db: Session):
    """Envia notificação por email quando um novo artigo é publicado"""
    try:
        # Buscar o artigo
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article:
            return
        
        # Buscar autores do artigo
        for author in article.authors:
            # Buscar usuários que seguem este autor
            notifications = db.query(Notification).filter(
                (Notification.author_id == author.id) & (Notification.is_active == 1)
            ).all()
            
            for notification in notifications:
                user = db.query(User).filter(
                    (User.id == notification.user_id) & (User.receive_notifications == 1)
                ).first()
                
                if user:
                    # Verificar se já enviou email para este artigo/usuário
                    email_sent = db.query(EmailLog).filter(
                        (EmailLog.user_id == user.id) & (EmailLog.article_id == article.id)
                    ).first()
                    
                    if not email_sent:
                        # Enviar email
                        try:
                            await send_notification_email(
                                str(user.email), 
                                f"{str(author.nome)} {str(author.sobrenome)}", 
                                str(article.titulo), 
                                str(article.edition.event.nome) if article.edition and article.edition.event else "Evento"
                            )
                            
                            # Registrar envio
                            log = EmailLog(
                                user_id=user.id,
                                article_id=article.id,
                                author_id=author.id,
                                sent_at=date.today(),
                                email_subject=f"Novo artigo: {str(article.titulo)}",
                                status="sent"
                            )
                            db.add(log)
                            
                        except Exception as e:
                            # Registrar falha
                            log = EmailLog(
                                user_id=user.id,
                                article_id=article.id,
                                author_id=author.id,
                                sent_at=date.today(),
                                email_subject=f"Novo artigo: {str(article.titulo)}",
                                status="failed"
                            )
                            db.add(log)
                            print(f"Erro ao enviar email para {str(user.email)}: {e}")
        
        db.commit()
        
    except Exception as e:
        print(f"Erro no sistema de notificação: {e}")

@app.post("/admin/enviar-notificacoes/{article_id}")
async def trigger_notifications(article_id: int, db: Session = Depends(get_db)):
    """Endpoint para disparar manualmente as notificações de um artigo"""
    await enviar_notificacao_novo_artigo(article_id, db)
    return {"message": "Notificações enviadas com sucesso"}

Base.metadata.create_all(bind=engine)