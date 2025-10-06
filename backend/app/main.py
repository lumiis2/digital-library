# =====================================================================
# IMPORTS
# =====================================================================
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from datetime import date
import hashlib
import smtplib
import zipfile
import tempfile
import os
import shutil
import asyncio
import bibtexparser
import time
import re
import unicodedata
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


# Local imports
from .database import Base, engine, SessionLocal
from .models import Event, Edition, Article, Author, artigo_autor, User, Notification, EmailLog
from .schemas import (
    EventoCreate, EventoRead, EventoUpdate, 
    EditionCreate, EditionRead, 
    AuthorCreate, AuthorRead, 
    ArticleCreate, ArticleRead, 
    UserCreate, UserRead, LoginRequest, 
    NotificationCreate, NotificationRead, NotificationSettings
)

# =====================================================================
# CONFIGURAÇÕES
# =====================================================================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # origem do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurações de email
EMAIL_CONFIG = {
    "SMTP_SERVER": "smtp.gmail.com",
    "SMTP_PORT": 587,
    "EMAIL_FROM": "dldigitallibrary1@gmail.com",
    "EMAIL_PASSWORD": "rgnk oekd wian uytf",
}

# Configurações de autenticação
SECRET_KEY = "your-secret-key"
ADMIN_EMAILS = {"luisalcarvalhaes@gmail.com", "outroadmin@email.com"}

# =====================================================================
# FUNÇÕES UTILITÁRIAS
# =====================================================================

def sha256(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def generate_slug(text: str) -> str:
    """Gera um slug amigável a partir de um texto"""
    import re
    import unicodedata
    
    # Normalizar unicode e remover acentos
    text = unicodedata.normalize('NFD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    
    # Converter para minúsculo
    text = text.lower()
    
    # Substituir espaços e caracteres especiais por hífens
    text = re.sub(r'[^a-z0-9]+', '-', text)
    
    # Remover hífens no início e fim
    text = text.strip('-')
    
    # Aumentar limite de tamanho para 100 caracteres
    text = text[:100]
    
    return text

def get_db():
    """Dependência de sessão do banco de dados"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def send_notification_email(to_email: str, author_name: str, article_title: str, event_name: str):
    """Função para enviar email de notificação"""
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
        
        # Tentar enviar email real se as configurações estiverem válidas
        if EMAIL_CONFIG["EMAIL_PASSWORD"] != "your_app_password" and EMAIL_CONFIG["EMAIL_FROM"] != "noreply@digitallibrary.com":
            server = smtplib.SMTP(EMAIL_CONFIG["SMTP_SERVER"], EMAIL_CONFIG["SMTP_PORT"])
            server.starttls()
            server.login(EMAIL_CONFIG["EMAIL_FROM"], EMAIL_CONFIG["EMAIL_PASSWORD"])
            text = msg.as_string()
            server.sendmail(EMAIL_CONFIG["EMAIL_FROM"], to_email, text)
            server.quit()
            print(f"Email real enviado para {to_email} sobre o artigo '{article_title}'")
        else:
            print(f"Email simulado enviado para {to_email} sobre o artigo '{article_title}' (configuração não finalizada)")
        
        return True
    except Exception as e:
        print(f"Erro ao enviar email: {str(e)}")
        return False

async def enviar_notificacao_novo_artigo(article_id: int, db: Session):
    """Envia notificação por email quando um novo artigo é publicado"""
    try:
        print(f"🔔 Iniciando notificações para artigo ID: {article_id}")
        
        # Buscar o artigo
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article:
            print(f"❌ Artigo {article_id} não encontrado")
            return
        
        print(f"📄 Artigo encontrado: {article.titulo}")
        
        # Buscar autores do artigo
        for author in article.authors:
            print(f"👤 Processando autor: {author.nome} {author.sobrenome} (ID: {author.id})")
            
            # 1. Verificar se o próprio autor é um usuário cadastrado
            user_author = db.query(User).filter(
                User.nome.ilike(f"%{author.nome}%"),
                User.receive_notifications == 1
            ).first()
            
            if user_author:
                print(f"✅ Autor é usuário cadastrado: {user_author.email}")
                
                # Verificar se já enviou email para este artigo/usuário (remover para permitir reenvios)
                # Comentando esta verificação para permitir envios
                # email_sent = db.query(EmailLog).filter(
                #     (EmailLog.user_id == user_author.id) & (EmailLog.article_id == article.id)
                # ).first()
                
                # if not email_sent:
                try:
                    print(f"📧 Enviando email para o próprio autor: {user_author.email}")
                    await send_notification_email(
                        str(user_author.email), 
                        f"{str(author.nome)} {str(author.sobrenome)}", 
                        str(article.titulo), 
                        str(article.edition.event.nome) if article.edition and article.edition.event else "Evento"
                    )
                    
                    # Registrar envio
                    log = EmailLog(
                        user_id=user_author.id,
                        article_id=article.id,
                        author_id=author.id,
                        sent_at=date.today(),
                        email_subject=f"Novo artigo: {str(article.titulo)}",
                        status="sent"
                    )
                    db.add(log)
                    print(f"✅ Email enviado para autor: {user_author.email}")
                    
                except Exception as e:
                    print(f"❌ Erro ao enviar email para autor {user_author.email}: {e}")
                    # Registrar falha
                    log = EmailLog(
                        user_id=user_author.id,
                        article_id=article.id,
                        author_id=author.id,
                        sent_at=date.today(),
                        email_subject=f"Novo artigo: {str(article.titulo)}",
                        status="failed"
                    )
                    db.add(log)
            
            # 2. Buscar usuários que seguem este autor
            notifications = db.query(Notification).filter(
                Notification.author_id == author.id,
                Notification.is_active == 1
            ).all()
            
            print(f"🔔 Encontradas {len(notifications)} notificações ativas para o autor {author.nome}")
            
            for notification in notifications:
                user = db.query(User).filter(
                    User.id == notification.user_id,
                    User.receive_notifications == 1
                ).first()
                
                if user:
                    print(f"👤 Usuário seguidor encontrado: {user.nome} ({user.email})")
                    
                    # Verificar se já enviou email para este artigo/usuário (remover para permitir reenvios)
                    # Comentando esta verificação para permitir envios
                    # email_sent = db.query(EmailLog).filter(
                    #     (EmailLog.user_id == user.id) & (EmailLog.article_id == article.id)
                    # ).first()
                    
                    # if not email_sent:
                    try:
                        print(f"📧 Enviando email para seguidor: {user.email}")
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
                            email_subject=f"Novo artigo de {author.nome}: {str(article.titulo)}",
                            status="sent"
                        )
                        db.add(log)
                        print(f"✅ Email enviado para seguidor: {user.email}")
                        
                    except Exception as e:
                        print(f"❌ Erro ao enviar email para seguidor {user.email}: {e}")
                        # Registrar falha
                        log = EmailLog(
                            user_id=user.id,
                            article_id=article.id,
                            author_id=author.id,
                            sent_at=date.today(),
                            email_subject=f"Novo artigo de {author.nome}: {str(article.titulo)}",
                            status="failed"
                        )
                        db.add(log)
                else:
                    print(f"❌ Usuário ID {notification.user_id} não encontrado ou com notificações desabilitadas")
        
        db.commit()
        print(f"✅ Processamento de notificações concluído para artigo {article_id}")
        
    except Exception as e:
        print(f"❌ Erro no sistema de notificação: {e}")
        import traceback
        traceback.print_exc()


# =====================================================================
# CONFIGURAÇÃO DA APLICAÇÃO
# =====================================================================

app = FastAPI(title="Digital Library API")

# Criar diretório uploads e servir arquivos estáticos
uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import time

@app.middleware("http")
async def log_requests(request, call_next):
    start_time = time.time()
    print(f"🚀 REQUISIÇÃO INICIADA: {request.method} {request.url}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    print(f"⏱️ REQUISIÇÃO FINALIZADA: {request.method} {request.url} - {process_time:.2f}s")
    
    if process_time > 1:  # Log requisições que demoram mais de 1 segundo
        print(f"🐌 REQUISIÇÃO LENTA: {request.method} {request.url} - {process_time:.2f}s")
    
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Criar tabelas no banco de dados
Base.metadata.create_all(bind=engine)

# =====================================================================
# ENDPOINTS BÁSICOS
# =====================================================================

@app.get("/")
def read_root():
    return {"message": "API Digital Library está funcionando!"}

@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str = ""):
    return JSONResponse(content={"message": "OK"})

# =====================================================================
# ENDPOINTS DE EVENTOS
# =====================================================================

@app.post("/eventos", response_model=EventoRead)
def criar_evento(evento: EventoCreate, db: Session = Depends(get_db)):
    evento_existente = db.query(Event).filter(Event.slug == evento.sigla).first()
    if evento_existente:
        raise HTTPException(
            status_code=400,
            detail="Já existe um evento com essa sigla registrado no banco de dados"
        )
    # USAR admin_id do payload:
    novo_evento = Event(
        nome=evento.nome, 
        slug=evento.sigla,
        admin_id=evento.admin_id  # MANTER admin_id
    )
    db.add(novo_evento)
    db.commit()
    db.refresh(novo_evento)
    return novo_evento

@app.get("/eventos", response_model=list[EventoRead])
def listar_eventos(db: Session = Depends(get_db)):
    print(f"🔍 DEBUG - Iniciando listagem de eventos")
    
    try:
        print(f"🔍 DEBUG - Executando query de eventos...")
        eventos = db.query(Event).all()
        print(f"🔍 DEBUG - Encontrados {len(eventos)} eventos no banco")
        
        for i, evento in enumerate(eventos):
            print(f"🔍 DEBUG - Evento {i+1}: ID={evento.id}, Nome={evento.nome[:50]}{'...' if len(evento.nome) > 50 else ''}")
            print(f"🔍 DEBUG - Slug completo: '{evento.slug}' (tamanho: {len(evento.slug)})")
        
        print(f"🔍 DEBUG - Retornando {len(eventos)} eventos")
        return eventos
        
    except Exception as e:
        print(f"❌ ERRO CRÍTICO ao listar eventos: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

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

@app.put("/eventos/{evento_id}", response_model=EventoRead)
def atualizar_evento(evento_id: int, evento_data: dict, db: Session = Depends(get_db)):
    """Atualizar um evento específico"""
    try:
        print(f"🔄 Atualizando evento ID: {evento_id}")
        print(f"📝 Dados recebidos: {evento_data}")
        
        # Buscar evento existente
        evento_db = db.query(Event).filter(Event.id == evento_id).first()
        if not evento_db:
            print(f"❌ Evento {evento_id} não encontrado")
            raise HTTPException(status_code=404, detail="Evento não encontrado")
        
        print(f"📄 Evento encontrado: {evento_db.nome}")
        
        # Atualizar campos se fornecidos
        if 'nome' in evento_data and evento_data['nome']:
            evento_db.nome = evento_data['nome'].strip()
            print(f"✅ Nome atualizado para: {evento_db.nome}")
        
        if 'sigla' in evento_data and evento_data['sigla']:
            nova_sigla = evento_data['sigla'].strip().lower()
            
            # Verificar se a nova sigla já existe em outro evento
            evento_existente = db.query(Event).filter(
                Event.slug == nova_sigla,
                Event.id != evento_id  # Excluir o próprio evento
            ).first()
            
            if evento_existente:
                raise HTTPException(
                    status_code=400,
                    detail=f"Já existe outro evento com a sigla '{nova_sigla}'"
                )
            
            evento_db.slug = nova_sigla
            print(f"✅ Sigla atualizada para: {evento_db.slug}")
        
        if 'admin_id' in evento_data and evento_data['admin_id']:
            evento_db.admin_id = evento_data['admin_id']
            print(f"✅ Admin ID atualizado para: {evento_db.admin_id}")
        
        db.commit()
        db.refresh(evento_db)
        
        print(f"✅ Evento {evento_id} atualizado com sucesso")
        return evento_db
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao atualizar evento {evento_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")

@app.delete("/eventos/{evento_id}")
def deletar_evento(evento_id: int, db: Session = Depends(get_db)):
    """
    Deletar evento apenas se não houver artigos vinculados.
    Verifica se há artigos publicados em qualquer edição do evento.
    """
    try:
        print(f"🗑️ Tentando deletar evento ID: {evento_id}")
        
        # Buscar o evento
        evento_db = db.query(Event).filter(Event.id == evento_id).first()
        if not evento_db:
            print(f"❌ Evento {evento_id} não encontrado")
            raise HTTPException(status_code=404, detail="Evento não encontrado")
        
        print(f"📅 Evento encontrado: {evento_db.nome}")
        
        # Buscar todas as edições do evento
        edicoes = db.query(Edition).filter(Edition.evento_id == evento_id).all()
        print(f"📊 Encontradas {len(edicoes)} edições vinculadas ao evento")
        
        # Verificar se há artigos em qualquer edição deste evento
        total_artigos = 0
        detalhes_edicoes = []
        
        for edicao in edicoes:
            artigos_count = db.query(Article).filter(Article.edicao_id == edicao.id).count()
            total_artigos += artigos_count
            
            if artigos_count > 0:  # Só incluir edições que têm artigos
                detalhes_edicoes.append({
                    "ano": edicao.ano,
                    "edicao_id": edicao.id,
                    "artigos": artigos_count
                })
            
            print(f"📄 Edição {edicao.ano}: {artigos_count} artigos")
        
        print(f"📝 Total de artigos vinculados ao evento: {total_artigos}")
        
        # Se há artigos, impedir exclusão
        if total_artigos > 0:
            print(f"❌ Exclusão impedida: evento tem {total_artigos} artigos")
            
            raise HTTPException(
                status_code=400, 
                detail={
                    "error": "Não é possível excluir o evento",
                    "motivo": "Há artigos científicos publicados neste evento",
                    "evento": {
                        "id": evento_db.id,
                        "nome": evento_db.nome,
                        "slug": evento_db.slug
                    },
                    "estatisticas": {
                        "total_edicoes": len(edicoes),
                        "edicoes_com_artigos": len(detalhes_edicoes),
                        "total_artigos": total_artigos
                    },
                    "detalhes_edicoes": detalhes_edicoes,
                    "sugestao": "Para excluir este evento, é necessário primeiro excluir todos os artigos de suas edições.",
                    "passos_recomendados": [
                        "1. Acesse cada edição do evento no dashboard",
                        "2. Exclua todos os artigos de cada edição",
                        "3. Exclua as edições vazias",
                        "4. Finalmente, exclua o evento"
                    ],
                    "alternativa": "Considere manter o evento para preservar o histórico científico"
                }
            )
        
        # Se não há artigos, verificar se há edições vazias
        if edicoes:
            print(f"🗑️ Deletando {len(edicoes)} edições vazias primeiro...")
            for edicao in edicoes:
                db.delete(edicao)
            print(f"✅ Edições vazias deletadas")
        
        # Agora pode deletar o evento
        print(f"🗑️ Deletando evento sem artigos vinculados...")
        db.delete(evento_db)
        db.commit()
        
        print(f"✅ Evento {evento_id} deletado com sucesso")
        return {
            "message": f"Evento '{evento_db.nome}' deletado com sucesso",
            "detalhes": {
                "evento_deletado": evento_db.nome,
                "edicoes_deletadas": len(edicoes),
                "artigos_preservados": 0
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao deletar evento {evento_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")

# =====================================================================
# ENDPOINTS DE EDIÇÕES
# =====================================================================

@app.post("/edicoes", response_model=EditionRead)
def criar_edicao(edicao_data: dict, db: Session = Depends(get_db)):
    """Criar uma nova edição com todos os campos"""
    try:
        print(f"🆕 Criando nova edição")
        print(f"📝 Dados recebidos: {edicao_data}")
        
        # Verificar campos obrigatórios
        if not edicao_data.get('evento_id'):
            raise HTTPException(status_code=400, detail="evento_id é obrigatório")
        if not edicao_data.get('ano'):
            raise HTTPException(status_code=400, detail="ano é obrigatório")
        
        evento_id = int(edicao_data['evento_id'])
        ano = int(edicao_data['ano'])
        
        # Verificar se o evento existe
        evento = db.query(Event).filter(Event.id == evento_id).first()
        if not evento:
            raise HTTPException(status_code=404, detail="Evento não encontrado")
        
        # Verificar se já existe uma edição para esse evento no mesmo ano
        edicao_existente = db.query(Edition).filter(
            Edition.evento_id == evento_id,
            Edition.ano == ano
        ).first()
        if edicao_existente:
            raise HTTPException(status_code=400, detail="Já existe uma edição para este evento no ano especificado")
        
        # Gerar slug para a edição
        slug = f"{evento.slug}-{ano}"
        
        # Criar edição com todos os campos
        edicao_db = Edition(
            ano=ano,
            evento_id=evento_id,
            slug=slug,
            descricao=edicao_data.get('descricao', ''),
            data_inicio=edicao_data.get('data_inicio'),
            data_fim=edicao_data.get('data_fim'),
            local=edicao_data.get('local', ''),
            site_url=edicao_data.get('site_url', '')
        )
        
        db.add(edicao_db)
        db.commit()
        db.refresh(edicao_db)
        
        print(f"✅ Edição criada com sucesso: {edicao_db.slug}")
        return edicao_db
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao criar edição: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")

@app.get("/edicoes", response_model=list[EditionRead])
def listar_edicoes(db: Session = Depends(get_db)):
    return db.query(Edition).all()

@app.get("/edicoes/{edicao_id}", response_model=EditionRead)
def obter_edicao_por_id(edicao_id: int, db: Session = Depends(get_db)):
    """Buscar uma edição específica por ID"""
    try:
        print(f"🔍 Buscando edição ID: {edicao_id}")
        
        edicao = db.query(Edition).filter(Edition.id == edicao_id).first()
        if not edicao:
            print(f"❌ Edição {edicao_id} não encontrada")
            raise HTTPException(status_code=404, detail="Edição não encontrada")
        
        print(f"✅ Edição encontrada: {edicao.ano} (Evento ID: {edicao.evento_id})")
        return edicao
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro ao buscar edição {edicao_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.put("/edicoes/{edicao_id}", response_model=EditionRead)
def atualizar_edicao(edicao_id: int, edicao_data: dict, db: Session = Depends(get_db)):
    """Atualizar uma edição específica"""
    try:
        print(f"🔄 Atualizando edição ID: {edicao_id}")
        print(f"📝 Dados recebidos: {edicao_data}")
        
        # Buscar edição existente
        edicao_db = db.query(Edition).filter(Edition.id == edicao_id).first()
        if not edicao_db:
            print(f"❌ Edição {edicao_id} não encontrada")
            raise HTTPException(status_code=404, detail="Edição não encontrada")
        
        print(f"📄 Edição encontrada: {edicao_db.ano} (Evento ID: {edicao_db.evento_id})")
        
        # Atualizar campos se fornecidos
        if 'ano' in edicao_data and edicao_data['ano']:
            novo_ano = int(edicao_data['ano'])
            
            # Verificar se já existe uma edição para o mesmo evento no novo ano
            if novo_ano != edicao_db.ano:  # Só verificar se mudou o ano
                edicao_existente = db.query(Edition).filter(
                    Edition.evento_id == edicao_db.evento_id,
                    Edition.ano == novo_ano,
                    Edition.id != edicao_id  # Excluir a própria edição
                ).first()
                
                if edicao_existente:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Já existe uma edição para este evento no ano {novo_ano}"
                    )
            
            edicao_db.ano = novo_ano
            print(f"✅ Ano atualizado para: {edicao_db.ano}")
        
        if 'evento_id' in edicao_data and edicao_data['evento_id']:
            novo_evento_id = int(edicao_data['evento_id'])
            
            # Verificar se o evento existe
            evento = db.query(Event).filter(Event.id == novo_evento_id).first()
            if not evento:
                raise HTTPException(status_code=404, detail="Evento não encontrado")
            
            # Verificar se já existe uma edição para o novo evento no mesmo ano
            if novo_evento_id != edicao_db.evento_id:  # Só verificar se mudou o evento
                edicao_existente = db.query(Edition).filter(
                    Edition.evento_id == novo_evento_id,
                    Edition.ano == edicao_db.ano,
                    Edition.id != edicao_id  # Excluir a própria edição
                ).first()
                
                if edicao_existente:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Já existe uma edição para o evento selecionado no ano {edicao_db.ano}"
                    )
            
            edicao_db.evento_id = novo_evento_id
            print(f"✅ Evento ID atualizado para: {edicao_db.evento_id}")
        
        # Atualizar o slug se ano ou evento mudaram
        if 'ano' in edicao_data or 'evento_id' in edicao_data:
            evento = db.query(Event).filter(Event.id == edicao_db.evento_id).first()
            if evento:
                novo_slug = f"{evento.slug}-{edicao_db.ano}"
                edicao_db.slug = novo_slug
                print(f"✅ Slug atualizado para: {edicao_db.slug}")
        
        # Atualizar campos adicionais
        if 'descricao' in edicao_data:
            edicao_db.descricao = edicao_data['descricao'] or ''
            print(f"✅ Descrição atualizada")
        
        if 'data_inicio' in edicao_data:
            edicao_db.data_inicio = edicao_data['data_inicio']
            print(f"✅ Data início atualizada: {edicao_db.data_inicio}")
        
        if 'data_fim' in edicao_data:
            edicao_db.data_fim = edicao_data['data_fim']
            print(f"✅ Data fim atualizada: {edicao_db.data_fim}")
        
        if 'local' in edicao_data:
            edicao_db.local = edicao_data['local'] or ''
            print(f"✅ Local atualizado: {edicao_db.local}")
        
        if 'site_url' in edicao_data:
            edicao_db.site_url = edicao_data['site_url'] or ''
            print(f"✅ Site URL atualizado: {edicao_db.site_url}")
        
        db.commit()
        db.refresh(edicao_db)
        
        print(f"✅ Edição {edicao_id} atualizada com sucesso")
        return edicao_db
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao atualizar edição {edicao_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")

@app.delete("/edicoes/{edicao_id}")
def deletar_edicao(edicao_id: int, db: Session = Depends(get_db)):
    edicao_db = db.query(Edition).filter(Edition.id == edicao_id).first()
    if not edicao_db:
        raise HTTPException(status_code=404, detail="Edição não encontrada")
    
    db.delete(edicao_db)
    db.commit()
    return {"message": "Edição deletada com sucesso"}

@app.get("/eventos/{evento_slug}/edicoes")
def listar_edicoes_do_evento(evento_slug: str, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.slug == evento_slug).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    edicoes = db.query(Edition).filter(Edition.evento_id == evento.id).all()
    return edicoes

@app.get("/eventos/{evento_slug}/{ano}", response_model=EditionRead)
def obter_edicao_por_slug_e_ano(evento_slug: str, ano: int, db: Session = Depends(get_db)):
    """Buscar edição completa por slug do evento e ano"""
    try:
        print(f"🔍 Buscando edição: {evento_slug}/{ano}")
        
        evento = db.query(Event).filter(Event.slug == evento_slug).first()
        if not evento:
            print(f"❌ Evento '{evento_slug}' não encontrado")
            raise HTTPException(status_code=404, detail="Evento não encontrado")
        
        edicao = db.query(Edition).filter(
            Edition.evento_id == evento.id, 
            Edition.ano == ano
        ).first()
        if not edicao:
            print(f"❌ Edição {ano} do evento '{evento_slug}' não encontrada")
            raise HTTPException(status_code=404, detail="Edição não encontrada")
        
        print(f"✅ Edição encontrada: {edicao.slug}")
        print(f"📊 Dados da edição: desc={edicao.descricao}, local={edicao.local}")
        
        return edicao
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro ao buscar edição: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.get("/eventos/{evento_slug}/{ano}/artigos", response_model=list[ArticleRead])
def listar_artigos_da_edicao(evento_slug: str, ano: int, db: Session = Depends(get_db)):
    evento = db.query(Event).filter(Event.slug == evento_slug).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    edicao = db.query(Edition).filter(Edition.evento_id == evento.id, Edition.ano == ano).first()
    if not edicao:
        raise HTTPException(status_code=404, detail="Edição não encontrada")
    return db.query(Article).filter(Article.edicao_id == edicao.id).all()

# =====================================================================
# ENDPOINTS DE AUTORES
# =====================================================================

@app.post("/autores", response_model=AuthorRead)
def criar_autor(autor: AuthorCreate, db: Session = Depends(get_db)):
    autor_existente = db.query(Author).filter(
        (Author.nome == autor.nome) & (Author.sobrenome == autor.sobrenome)
    ).first()
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

# =====================================================================
# ENDPOINTS DE ARTIGOS
# =====================================================================

@app.post("/artigos", response_model=ArticleRead)
async def create_artigo(
    titulo: str = Form(...),
    area: str = Form(None),
    palavras_chave: str = Form(None),
    edicao_id: int = Form(...),
    autores: str = Form(...),  # JSON string com lista de autores
    pdf_file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    try:
        # Parse da lista de autores
        import json
        autores_data = json.loads(autores)
        
        # Processar upload do PDF se fornecido
        pdf_path = None
        if pdf_file and pdf_file.filename:
            # Criar nome único para o arquivo
            timestamp = str(int(time.time()))
            file_extension = os.path.splitext(pdf_file.filename)[1]
            unique_filename = f"{timestamp}_{pdf_file.filename}"
            
            # Salvar arquivo
            uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
            os.makedirs(uploads_dir, exist_ok=True)
            file_path = os.path.join(uploads_dir, unique_filename)
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(pdf_file.file, buffer)
            
            pdf_path = f"/uploads/{unique_filename}"
        
        # Criar o artigo
        db_artigo = Article(
            titulo=titulo,
            pdf_path=pdf_path,
            area=area,
            palavras_chave=palavras_chave,
            edicao_id=edicao_id
        )
        db.add(db_artigo)
        db.flush()  # Para obter o ID do artigo
        
        # Processar autores
        for autor_data in autores_data:
            nome = autor_data.get('nome', '').strip()
            sobrenome = autor_data.get('sobrenome', '').strip()
            
            if not nome or not sobrenome:
                continue
            
            # CORREÇÃO: Procurar autor existente em vez de impedir reutilização
            existing_author = db.query(Author).filter(
                Author.nome == nome,
                Author.sobrenome == sobrenome
            ).first()
            
            if existing_author:
                # Usar autor existente
                autor_id = existing_author.id
                print(f"Reutilizando autor existente: {nome} {sobrenome} (ID: {autor_id})")
            else:
                # Criar novo autor
                slug = generate_slug(f"{nome} {sobrenome}")
                
                # Verificar se o slug já existe e torná-lo único
                base_slug = slug
                counter = 1
                while db.query(Author).filter(Author.slug == slug).first():
                    slug = f"{base_slug}-{counter}"
                    counter += 1
                
                new_author = Author(
                    nome=nome,
                    sobrenome=sobrenome,
                    slug=slug
                )
                db.add(new_author)
                db.flush()
                autor_id = new_author.id
                print(f"Criado novo autor: {nome} {sobrenome} (ID: {autor_id})")
            
            # Verificar se a associação já existe para evitar duplicatas
            existing_association = db.query(artigo_autor).filter(
                artigo_autor.c.artigo_id == db_artigo.id,
                artigo_autor.c.autor_id == autor_id
            ).first()
            
            if not existing_association:
                # Criar associação artigo-autor
                association = artigo_autor.insert().values(
                    artigo_id=db_artigo.id,
                    autor_id=autor_id
                )
                db.execute(association)
                print(f"Associação criada: Artigo {db_artigo.id} <-> Autor {autor_id}")
        
        db.commit()
        
        # Buscar o artigo completo com autores
        artigo_completo = db.query(Article).filter(Article.id == db_artigo.id).first()
        
        # Enviar notificações para usuários que seguem os autores
        try:
            await enviar_notificacao_novo_artigo(db_artigo.id, db)
        except Exception as e:
            print(f"Erro ao enviar notificações: {e}")
            # Não falhar a criação do artigo por causa de erro de notificação
        
        return artigo_completo
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Formato inválido de dados dos autores")
    except Exception as e:
        db.rollback()
        print(f"Erro ao criar artigo: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")


@app.get("/artigos", response_model=list[ArticleRead])
def listar_artigos(autor_id: int | None = None, db: Session = Depends(get_db)):
    print(f"🔍 DEBUG - Iniciando listagem de artigos, autor_id: {autor_id}")
    
    try:
        query = db.query(Article)
        if autor_id:
            query = query.join(Article.authors).filter(Author.id == autor_id)
        
        print(f"🔍 DEBUG - Executando query...")
        artigos = query.all()
        print(f"🔍 DEBUG - Encontrados {len(artigos)} artigos no banco")
        
        # Criar resposta manual para evitar problemas de serialização
        result = []
        for i, artigo in enumerate(artigos):
            print(f"🔍 DEBUG - Processando artigo {i+1}: ID={artigo.id}, Título={artigo.titulo}")
            
            try:
                authors_list = []
                print(f"🔍 DEBUG - Carregando autores do artigo {artigo.id}...")
                for j, author in enumerate(artigo.authors):
                    print(f"🔍 DEBUG - Autor {j+1}: {author.nome} {author.sobrenome}")
                    authors_list.append({
                        "id": author.id,
                        "nome": author.nome,
                        "sobrenome": author.sobrenome,
                        "slug": author.slug
                    })
                
                article_data = {
                    "id": artigo.id,
                    "titulo": artigo.titulo,
                    "resumo": artigo.resumo,
                    "area": artigo.area,
                    "palavras_chave": artigo.palavras_chave,
                    "pdf_path": artigo.pdf_path,
                    "data_publicacao": str(artigo.data_publicacao) if artigo.data_publicacao else None,
                    "edicao_id": artigo.edicao_id,
                    "authors": authors_list
                }
                
                result.append(article_data)
                print(f"✅ DEBUG - Artigo {i+1} processado com sucesso")
                
            except Exception as e:
                print(f"❌ DEBUG - Erro ao processar artigo {artigo.id}: {e}")
                continue
        
        print(f"🔍 DEBUG - Retornando {len(result)} artigos processados")
        return result
        
    except Exception as e:
        print(f"❌ ERRO CRÍTICO ao listar artigos: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.get("/artigos/{artigo_id}", response_model=ArticleRead)
def obter_artigo(artigo_id: int, db: Session = Depends(get_db)):
    artigo = db.query(Article).filter(Article.id == artigo_id).first()
    if not artigo:
        raise HTTPException(status_code=404, detail="Artigo não encontrado")
    return artigo

@app.put("/artigos/{artigo_id}", response_model=ArticleRead)
async def atualizar_artigo(artigo_id: int, artigo: ArticleCreate, db: Session = Depends(get_db)):
    artigo_existente = db.query(Article).filter(Article.id == artigo_id).first()
    if not artigo_existente:
        raise HTTPException(status_code=404, detail="Artigo não encontrado")
    
    # Atualizar dados do artigo
    artigo_existente.titulo = artigo.titulo
    artigo_existente.pdf_path = artigo.pdf_path
    artigo_existente.area = artigo.area
    artigo_existente.palavras_chave = artigo.palavras_chave
    artigo_existente.edicao_id = artigo.edicao_id
    
    # Atualizar autores
    if artigo.author_ids:
        autores = db.query(Author).filter(Author.id.in_(artigo.author_ids)).all()
        artigo_existente.authors = autores
    else:
        artigo_existente.authors = []
    
    db.commit()
    db.refresh(artigo_existente)
    return artigo_existente

@app.put("/artigos/{artigo_id}/form")
async def atualizar_artigo_form(
    artigo_id: int,
    titulo: str = Form(...),
    area: str = Form(None),
    palavras_chave: str = Form(None),
    edicao_id: int = Form(...),
    autores: str = Form(...),
    pdf_file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    """Endpoint específico para atualizar artigo via FormData"""
    try:
        print(f"🔄 Atualizando artigo ID: {artigo_id}")
        
        # Buscar artigo existente
        artigo_existente = db.query(Article).filter(Article.id == artigo_id).first()
        if not artigo_existente:
            raise HTTPException(status_code=404, detail="Artigo não encontrado")
        
        # Parse da lista de autores
        import json
        autores_data = json.loads(autores)
        
        # Processar upload do PDF se fornecido
        pdf_path = artigo_existente.pdf_path  # Manter o PDF existente se não houver novo
        if pdf_file and pdf_file.filename:
            # Criar nome único para o arquivo
            timestamp = str(int(time.time()))
            file_extension = os.path.splitext(pdf_file.filename)[1]
            unique_filename = f"{timestamp}_{pdf_file.filename}"
            
            # Salvar arquivo
            uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
            os.makedirs(uploads_dir, exist_ok=True)
            file_path = os.path.join(uploads_dir, unique_filename)
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(pdf_file.file, buffer)
            
            pdf_path = f"/uploads/{unique_filename}"
        
        # Atualizar dados do artigo
        artigo_existente.titulo = titulo
        artigo_existente.area = area
        artigo_existente.palavras_chave = palavras_chave
        artigo_existente.edicao_id = edicao_id
        artigo_existente.pdf_path = pdf_path
        
        # Limpar autores existentes
        artigo_existente.authors = []
        db.flush()
        
        # Processar novos autores
        for autor_data in autores_data:
            nome = autor_data.get('nome', '').strip()
            sobrenome = autor_data.get('sobrenome', '').strip()
            
            if not nome or not sobrenome:
                continue
            
            # Procurar autor existente
            existing_author = db.query(Author).filter(
                Author.nome == nome,
                Author.sobrenome == sobrenome
            ).first()
            
            if existing_author:
                artigo_existente.authors.append(existing_author)
                print(f"Reutilizando autor existente: {nome} {sobrenome}")
            else:
                # Criar novo autor
                slug = generate_slug(f"{nome} {sobrenome}")
                
                # Verificar se o slug já existe e torná-lo único
                base_slug = slug
                counter = 1
                while db.query(Author).filter(Author.slug == slug).first():
                    slug = f"{base_slug}-{counter}"
                    counter += 1
                
                new_author = Author(
                    nome=nome,
                    sobrenome=sobrenome,
                    slug=slug
                )
                db.add(new_author)
                db.flush()
                artigo_existente.authors.append(new_author)
                print(f"Criado novo autor: {nome} {sobrenome}")
        
        db.commit()
        db.refresh(artigo_existente)
        
        print(f"✅ Artigo {artigo_id} atualizado com sucesso")
        return artigo_existente
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Formato inválido de dados dos autores")
    except Exception as e:
        db.rollback()
        print(f"Erro ao atualizar artigo: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")

@app.delete("/artigos/{artigo_id}")
def deletar_artigo(artigo_id: int, db: Session = Depends(get_db)):
    """Deletar um artigo específico"""
    try:
        print(f"🗑️ Tentando deletar artigo ID: {artigo_id}")
        
        # Buscar o artigo
        artigo_db = db.query(Article).filter(Article.id == artigo_id).first()
        if not artigo_db:
            print(f"❌ Artigo {artigo_id} não encontrado")
            raise HTTPException(status_code=404, detail="Artigo não encontrado")
        
        print(f"📄 Artigo encontrado: {artigo_db.titulo}")
        
        # Deletar arquivo PDF se existir
        if artigo_db.pdf_path:
            try:
                # Remover "/uploads/" do início do path
                filename = artigo_db.pdf_path.replace("/uploads/", "")
                uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
                file_path = os.path.join(uploads_dir, filename)
                
                if os.path.exists(file_path):
                    os.remove(file_path)
                    print(f"🗑️ Arquivo PDF deletado: {file_path}")
                else:
                    print(f"⚠️ Arquivo PDF não encontrado: {file_path}")
            except Exception as e:
                print(f"⚠️ Erro ao deletar arquivo PDF: {e}")
                # Continuar mesmo se não conseguir deletar o arquivo
        
        # As associações artigo-autor serão deletadas automaticamente devido ao CASCADE
        # definido no relacionamento SQLAlchemy
        
        # Deletar logs de email relacionados
        db.query(EmailLog).filter(EmailLog.article_id == artigo_id).delete()
        print(f"🗑️ Logs de email deletados para artigo {artigo_id}")
        
        # Deletar o artigo
        db.delete(artigo_db)
        db.commit()
        
        print(f"✅ Artigo {artigo_id} deletado com sucesso")
        return {"message": "Artigo deletado com sucesso"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao deletar artigo {artigo_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")

# =====================================================================
# ENDPOINTS DE UPLOAD
# =====================================================================

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

# REMOVA os dois endpoints existentes e substitua por este:

@app.post("/upload-bibtex")
async def upload_bibtex(
    bibtex_file: UploadFile = File(...),
    pdf_zip: UploadFile = File(None),
    action: str = Form("preview"),
    authorization: str = Header(None),  # MUDANÇA: Header em vez de Form
    db: Session = Depends(get_db)
):
    """
    Endpoint unificado para BibTeX:
    - action="preview": Retorna preview dos artigos (sem salvar)
    - action="save": Salva automaticamente (com ou sem PDFs)
    """
    
    if not bibtex_file.filename.endswith(('.bib', '.bibtex')):
        raise HTTPException(status_code=400, detail="Apenas arquivos .bib ou .bibtex são permitidos")
    
    if pdf_zip and not pdf_zip.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Arquivo ZIP deve ter extensão .zip")
    
    # Verificar se usuário está logado e é admin (para action="save")
    current_user = None
    if action == "save":
        if not authorization:
            raise HTTPException(status_code=401, detail="Necessário estar logado como admin para salvar artigos")
        
        current_user = get_current_user_from_token(authorization, db)
        if not current_user:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        if current_user.perfil != "admin":
            raise HTTPException(status_code=403, detail="Apenas administradores podem salvar artigos via BibTeX")
    
    try:
        # Ler e processar BibTeX
        bibtex_content = await bibtex_file.read()
        bibtex_str = bibtex_content.decode('utf-8')
        bib_database = bibtexparser.loads(bibtex_str)
        
        # Se é apenas preview
        if action == "preview":
            articles_preview = []
            
            for entry in bib_database.entries:
                article_data = {
                    "titulo": entry.get('title', '').replace('{', '').replace('}', ''),
                    "area": entry.get('keywords', '') or entry.get('subject', ''),
                    "palavras_chave": entry.get('keywords', ''),
                    "resumo": entry.get('abstract', ''),
                    "doi": entry.get('doi', ''),
                    "categoria": entry.get('type', entry.get('ENTRYTYPE', '')),
                    "data_publicacao": entry.get('year', ''),
                    "bibtex_key": entry.get('ID', ''),
                    "booktitle": entry.get('booktitle', ''),
                    "authors": []
                }
                
                # Processar autores
                if 'author' in entry:
                    authors_str = entry['author']
                    author_names = [name.strip() for name in authors_str.split(' and ')]
                    
                    for author_name in author_names:
                        if ',' in author_name:
                            parts = author_name.split(',', 1)
                            sobrenome = parts[0].strip()
                            nome = parts[1].strip() if len(parts) > 1 else ""
                        else:
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
        
        # Se é para salvar automaticamente
        elif action == "save":
            relatorio = {
                "processados": 0,
                "cadastrados": 0,
                "pulados": [],
                "erros": [],
                "edicoes_criadas": []
            }
            
            # Processar PDFs se fornecidos
            pdf_files = {}
            if pdf_zip:
                with tempfile.TemporaryDirectory() as temp_dir:
                    zip_path = os.path.join(temp_dir, "pdfs.zip")
                    with open(zip_path, "wb") as f:
                        f.write(await pdf_zip.read())
                    
                    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                        for file_info in zip_ref.infolist():
                            if file_info.filename.endswith('.pdf'):
                                pdf_name = os.path.splitext(file_info.filename)[0]
                                pdf_content = zip_ref.read(file_info.filename)
                                pdf_files[pdf_name] = pdf_content
            
            # Processar cada entrada
            for entry in bib_database.entries:
                relatorio["processados"] += 1
                entry_id = entry.get('ID', f'entry_{relatorio["processados"]}')
                
                try:
                    # Validar campos obrigatórios
                    campos_obrigatorios = ['title', 'author']
                    if pdf_files:  # Se tem PDFs, exigir booktitle e year
                        campos_obrigatorios.extend(['booktitle', 'year'])
                    
                    campos_faltando = [campo for campo in campos_obrigatorios if not entry.get(campo)]
                    
                    if campos_faltando:
                        relatorio["pulados"].append({
                            "id": entry_id,
                            "motivo": f"Campos obrigatórios faltando: {', '.join(campos_faltando)}"
                        })
                        continue
                    
                    # Se tem PDFs, verificar se existe correspondente
                    if pdf_files and entry_id not in pdf_files:
                        relatorio["pulados"].append({
                            "id": entry_id,
                            "motivo": f"PDF não encontrado: {entry_id}.pdf"
                        })
                        continue
                    
                    # Identificar ou criar evento e edição automaticamente
                    edicao_id = None
                    
                    if entry.get('booktitle') and entry.get('year'):
                        booktitle = entry['booktitle']
                        year = int(entry['year'])
                        
                        # Tentar encontrar evento pelo booktitle (busca flexível)
                        evento = db.query(Event).filter(
                            Event.nome.ilike(f"%{booktitle}%")
                        ).first()
                        
                        if not evento:
                            # Criar evento baseado no booktitle
                            # Gerar slug do evento
                            import re
                            slug_evento = re.sub(r'[^a-zA-Z0-9]', '-', booktitle.lower())
                            slug_evento = re.sub(r'-+', '-', slug_evento).strip('-')[:50]
                            
                            # Garantir slug único
                            contador = 1
                            slug_original = slug_evento
                            while db.query(Event).filter(Event.slug == slug_evento).first():
                                slug_evento = f"{slug_original}-{contador}"
                                contador += 1
                            
                            # USAR O ID DO USUÁRIO LOGADO COMO ADMIN
                            evento = Event(
                                nome=booktitle,
                                slug=slug_evento,
                                admin_id=current_user.id  # Usar o ID do usuário logado
                            )
                            db.add(evento)
                            db.flush()
                            relatorio["edicoes_criadas"].append(f"Evento: {booktitle}")
                        
                        # Buscar ou criar edição
                        edicao = db.query(Edition).filter(
                            Edition.evento_id == evento.id,
                            Edition.ano == year
                        ).first()
                        
                        if not edicao:
                            # Criar edição
                            slug_edicao = f"{evento.slug}-{year}"
                            edicao = Edition(
                                ano=year,
                                evento_id=evento.id,
                                slug=slug_edicao
                            )
                            db.add(edicao)
                            db.flush()
                            relatorio["edicoes_criadas"].append(f"Edição: {booktitle} {year}")
                        
                        edicao_id = edicao.id
                    else:
                        # Se não tem booktitle/year, usar primeira edição disponível
                        edicao_default = db.query(Edition).first()
                        if edicao_default:
                            edicao_id = edicao_default.id
                        else:
                            relatorio["pulados"].append({
                                "id": entry_id,
                                "motivo": "Nenhuma edição disponível no sistema e sem booktitle/year para criar nova"
                            })
                            continue
                    
                    # Verificar duplicatas
                    titulo = entry['title'].replace('{', '').replace('}', '')
                    artigo_existente = db.query(Article).filter(
                        Article.titulo == titulo,
                        Article.edicao_id == edicao_id
                    ).first()
                    
                    if artigo_existente:
                        relatorio["pulados"].append({
                            "id": entry_id,
                            "motivo": "Artigo já existe nesta edição"
                        })
                        continue
                    
                    # Processar autores
                    author_ids = []
                    authors_str = entry['author']
                    author_names = [name.strip() for name in authors_str.split(' and ')]
                    
                    for author_name in author_names:
                        if ',' in author_name:
                            parts = author_name.split(',', 1)
                            sobrenome = parts[0].strip()
                            nome = parts[1].strip() if len(parts) > 1 else ""
                        else:
                            parts = author_name.strip().split()
                            if len(parts) > 1:
                                nome = ' '.join(parts[:-1])
                                sobrenome = parts[-1]
                            else:
                                nome = parts[0] if parts else ""
                                sobrenome = ""
                        
                        # Buscar ou criar autor
                        autor_existente = db.query(Author).filter(
                            Author.nome == nome,
                            Author.sobrenome == sobrenome
                        ).first()
                        
                        if not autor_existente:
                            slug = f"{nome.lower()}-{sobrenome.lower()}"
                            autor_slug = slug
                            contador = 1
                            while db.query(Author).filter(Author.slug == autor_slug).first():
                                autor_slug = f"{slug}-{contador}"
                                contador += 1
                            
                            novo_autor = Author(nome=nome, sobrenome=sobrenome, slug=autor_slug)
                            db.add(novo_autor)
                            db.flush()
                            author_ids.append(novo_autor.id)
                        else:
                            author_ids.append(autor_existente.id)
                    
                    # Salvar PDF se existe
                    pdf_path_final = None
                    if entry_id in pdf_files:
                        pdf_filename = f"{entry_id}.pdf"
                        pdf_path_final = f"/uploads/{pdf_filename}"
                        
                        full_pdf_path = os.path.join(uploads_dir, pdf_filename)
                        with open(full_pdf_path, "wb") as pdf_file:
                            pdf_file.write(pdf_files[entry_id])
                    
                    # Criar artigo
                    novo_artigo = Article(
                        titulo=titulo,
                        resumo=entry.get('abstract', ''),
                        area=entry.get('keywords', '') or entry.get('subject', ''),
                        palavras_chave=entry.get('keywords', ''),
                        pdf_path=pdf_path_final,
                        edicao_id=edicao_id
                    )
                    
                    db.add(novo_artigo)
                    db.flush()
                    
                    # Associar autores
                    for author_id in author_ids:
                        db.execute(
                            artigo_autor.insert().values(
                                artigo_id=novo_artigo.id,
                                autor_id=author_id
                            )
                        )
                    
                    relatorio["cadastrados"] += 1
                    
                    # Enviar notificações
                    await enviar_notificacao_novo_artigo(novo_artigo.id, db)
                    
                except Exception as e:
                    relatorio["erros"].append({
                        "id": entry_id,
                        "erro": str(e)
                    })
                    db.rollback()
                    continue
            
            db.commit()
            
            return {
                "message": "Processamento concluído",
                "relatorio": relatorio
            }
        
        else:
            raise HTTPException(status_code=400, detail="Ação inválida. Use 'preview' ou 'save'")
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro no processamento: {str(e)}")

# =====================================================================
# ENDPOINTS DE AUTENTICAÇÃO
# =====================================================================

@app.post("/api/auth/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        # Verificar se o email já existe
        existing_user = db.query(User).filter(User.email == str(user.email)).first()
        if existing_user:
            raise HTTPException(status_code=409, detail="E-mail já cadastrado")

        hashed = sha256(user.senha_hash)
        # Usa o perfil enviado pelo frontend, se for 'admin' ou 'usuario'
        perfil = user.perfil if hasattr(user, 'perfil') and user.perfil in ["admin", "usuario"] else "usuario"
        
        # Usar o campo receive_notifications se fornecido, senão usar True como padrão
        receive_notifications = getattr(user, 'receive_notifications', True)
        
        new_user = User(
            nome=user.nome, 
            email=str(user.email), 
            senha_hash=hashed, 
            perfil=perfil,
            receive_notifications=1 if receive_notifications else 0
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {"message": "Usuário registrado com sucesso", "user": {
            "id": new_user.id,
            "nome": new_user.nome,
            "email": str(new_user.email),
            "perfil": new_user.perfil,
            "receive_notifications": bool(new_user.receive_notifications)
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

    # Gera um token simples
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

# =====================================================================
# ENDPOINTS DE NOTIFICAÇÕES
# =====================================================================

@app.put("/usuarios/{user_id}/notificacoes")
def atualizar_preferencias_notificacao(user_id: int, request: dict, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    receber_notificacoes = request.get("receber_notificacoes", True)
    
    # Atualizar no banco de dados
    db.query(User).filter(User.id == user_id).update({
        "receive_notifications": 1 if receber_notificacoes else 0
    })
    db.commit()
    
    return {
        "message": "Preferências de notificação atualizadas com sucesso",
        "user_id": user_id,
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
    
    # Update usando database update ao invés de atribuição de atributo
    db.query(Notification).filter(
        (Notification.user_id == user_id) & (Notification.author_id == author_id)
    ).update({"is_active": 0})
    db.commit()
    
    return {"message": f"Você parou de seguir {author.nome} {author.sobrenome}"}

@app.post("/seguir-autor")
def seguir_autor_auth(request: dict, authorization: str = Header(None), db: Session = Depends(get_db)):
    # CORREÇÃO: Usar usuário logado em vez de fixo
    if not authorization:
        raise HTTPException(status_code=401, detail="Token de autenticação necessário")
    
    current_user = get_current_user_from_token(authorization, db)
    if not current_user:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user_id = current_user.id  # Usar ID do usuário logado
    author_id = request.get("autor_id")
    acao = request.get("acao")  # "seguir" ou "parar_seguir"
    
    print(f"🔔 Usuário {user_id} ({current_user.nome}) quer {acao} autor {author_id}")
    
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
        Notification.user_id == user_id,
        Notification.author_id == author_id
    ).first()
    
    if acao == "seguir":
        if existing_notification:
            # Reativar se estava desativada
            db.query(Notification).filter(
                Notification.user_id == user_id,
                Notification.author_id == author_id
            ).update({"is_active": 1})
            print(f"✅ Reativada notificação existente")
        else:
            # Criar nova notificação
            new_notification = Notification(
                user_id=user_id,
                author_id=author_id,
                is_active=1,
                created_at=date.today()
            )
            db.add(new_notification)
            print(f"✅ Nova notificação criada")
        
        db.commit()
        return {"mensagem": f"Você agora está seguindo {author.nome} {author.sobrenome}!"}
    
    elif acao == "parar_seguir":
        if existing_notification:
            # Desativar notificação
            db.query(Notification).filter(
                Notification.user_id == user_id,
                Notification.author_id == author_id
            ).update({"is_active": 0})
            db.commit()
            print(f"✅ Notificação desativada")
        
        return {"mensagem": f"Você parou de seguir {author.nome} {author.sobrenome}"}
    
    else:
        raise HTTPException(
            status_code=400, 
            detail="Ação inválida. Use 'seguir' ou 'parar_seguir'"
        )

@app.get("/autores-seguidos")
def listar_autores_seguidos_auth(authorization: str = Header(None), db: Session = Depends(get_db)):
    # CORREÇÃO: Usar usuário logado em vez de fixo
    if not authorization:
        raise HTTPException(status_code=401, detail="Token de autenticação necessário")
    
    current_user = get_current_user_from_token(authorization, db)
    if not current_user:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user_id = current_user.id  # Usar ID do usuário logado
    
    notifications = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_active == 1
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


# =====================================================================
# ENDPOINTS ADMINISTRATIVOS
# =====================================================================

@app.post("/admin/enviar-notificacoes/{article_id}")
async def trigger_notifications(article_id: int, db: Session = Depends(get_db)):
    """Endpoint para disparar manualmente as notificações de um artigo"""
    await enviar_notificacao_novo_artigo(article_id, db)
    return {"message": "Notificações enviadas com sucesso"}

@app.post("/admin/test-email")
async def test_email(email_data: dict):
    """Endpoint para testar configuração de email"""
    try:
        to_email = email_data.get("to_email", "test@example.com")
        author_name = email_data.get("author_name", "Teste Autor")
        article_title = email_data.get("article_title", "Artigo de Teste")
        event_name = email_data.get("event_name", "Evento de Teste")
        
        success = await send_notification_email(to_email, author_name, article_title, event_name)
        
        return {
            "success": success,
            "message": "Email de teste enviado com sucesso!" if success else "Falha ao enviar email de teste",
            "email_config": {
                "smtp_server": EMAIL_CONFIG["SMTP_SERVER"],
                "smtp_port": EMAIL_CONFIG["SMTP_PORT"],
                "email_from": EMAIL_CONFIG["EMAIL_FROM"],
                "configured": EMAIL_CONFIG["EMAIL_PASSWORD"] != "your_app_password"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Erro ao testar email: {str(e)}",
            "email_config": {
                "smtp_server": EMAIL_CONFIG["SMTP_SERVER"],
                "smtp_port": EMAIL_CONFIG["SMTP_PORT"],
                "email_from": EMAIL_CONFIG["EMAIL_FROM"],
                "configured": EMAIL_CONFIG["EMAIL_PASSWORD"] != "your_app_password"
            }
        }

@app.post("/admin/setup-test-user")
async def setup_test_user(user_data: dict, db: Session = Depends(get_db)):
    """Configura um usuário de teste para demonstração de email"""
    try:
        nome = user_data.get("nome", "Rafael")
        sobrenome = user_data.get("sobrenome", "Paniago")
        email = user_data.get("email", "rafaelpaniago@example.com")
        
        # Criar ou atualizar usuário
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Criar novo usuário
            import bcrypt
            senha_hash = bcrypt.hashpw("123456".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            user = User(
                nome=nome,
                email=email,
                senha_hash=senha_hash,
                perfil="autor",
                receive_notifications=1
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Criar ou encontrar autor correspondente
        author = db.query(Author).filter(
            Author.nome == nome, 
            Author.sobrenome == sobrenome
        ).first()
        
        if not author:
            # Criar autor
            slug = f"{nome.lower()}-{sobrenome.lower()}"
            author = Author(
                nome=nome,
                sobrenome=sobrenome,
                slug=slug
            )
            db.add(author)
            db.commit()
            db.refresh(author)
        
        return {
            "success": True,
            "user": {
                "id": user.id,
                "nome": user.nome,
                "email": user.email,
                "notificacoes": user.receive_notifications
            },
            "author": {
                "id": author.id,
                "nome": author.nome,
                "sobrenome": author.sobrenome,
                "slug": author.slug
            },
            "message": "Usuário e autor de teste configurados com sucesso!"
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Erro ao configurar usuário de teste: {str(e)}"
        }

@app.get("/admin/email-logs")
async def get_email_logs(db: Session = Depends(get_db)):
    """Consulta os logs de emails enviados"""
    try:
        logs = db.query(EmailLog).order_by(EmailLog.sent_at.desc()).limit(10).all()
        
        result = []
        for log in logs:
            # Buscar informações do usuário e artigo
            user = db.query(User).filter(User.id == log.user_id).first()
            article = db.query(Article).filter(Article.id == log.article_id).first()
            
            result.append({
                "id": log.id,
                "user_id": log.user_id,
                "user_email": user.email if user else "N/A",
                "user_name": user.nome if user else "N/A",
                "article_id": log.article_id,
                "article_title": article.titulo if article else "N/A",
                "email_subject": log.email_subject,
                "sent_at": str(log.sent_at) if log.sent_at else None,
                "status": log.status
            })
        
        return {
            "total_logs": len(result),
            "logs": result
        }
        
    except Exception as e:
        return {
            "error": f"Erro ao consultar logs: {str(e)}"
        }

# Adicione o import do Header no topo do arquivo:
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form, Header

# Função para extrair usuário do token:
def get_current_user_from_token(authorization: str = None, db: Session = None):
    """Extrai usuário atual do token de autorização"""
    if not authorization or not db:
        return None
    
    try:
        # Remover "Bearer " se presente
        if authorization.startswith("Bearer "):
            authorization = authorization.replace("Bearer ", "")
        
        # Token tem formato "user_ID_hash"
        token_parts = authorization.split("_")
        if len(token_parts) >= 2 and token_parts[0] == "user":
            user_id = int(token_parts[1])
            user = db.query(User).filter(User.id == user_id).first()
            
            # Debug: Imprimir informações do usuário
            if user:
                print(f"Usuário encontrado: ID={user.id}, Nome={user.nome}, Perfil={user.perfil}")
            else:
                print(f"Usuário não encontrado para ID={user_id}")
            
            return user
    except Exception as e:
        print(f"Erro ao extrair usuário do token: {e}")
        pass
    
    return None

# Adicione endpoint para obter dados do usuário atual:
@app.get("/api/auth/me")
def get_current_user_info(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Retorna informações do usuário atual baseado no token"""
    print(f"🔍 DEBUG - Authorization header recebido: {authorization}")
    
    if not authorization:
        print("❌ Token não fornecido no header")
        raise HTTPException(status_code=401, detail="Token não fornecido")
    
    user = get_current_user_from_token(authorization, db)
    if not user:
        print("❌ Token inválido ou usuário não encontrado")
        raise HTTPException(status_code=401, detail="Token inválido")
    
    print(f"✅ Usuário encontrado: {user.nome}, Perfil: {user.perfil}")
    
    return {
        "id": user.id,
        "nome": user.nome,
        "email": user.email,
        "perfil": user.perfil,
        "receive_notifications": user.receive_notifications
    }

@app.post("/admin/test-notifications/{article_id}")
async def test_notifications_for_article(article_id: int, db: Session = Depends(get_db)):
    """Endpoint para testar notificações de um artigo específico"""
    try:
        print(f"🧪 Testando notificações para artigo ID: {article_id}")
        
        # Buscar o artigo
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article:
            return {"error": f"Artigo {article_id} não encontrado"}
        
        # Chamar função de notificação
        await enviar_notificacao_novo_artigo(article_id, db)
        
        return {
            "success": True,
            "message": f"Notificações processadas para o artigo '{article.titulo}'",
            "article_id": article_id,
            "article_title": article.titulo
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Erro ao processar notificações: {str(e)}"
        }

@app.get("/debug/autores")
def debug_autores(db: Session = Depends(get_db)):
    """Debug dos autores no banco de dados"""
    try:
        autores = db.query(Author).all()
        
        result = []
        for autor in autores:
            # Contar artigos do autor
            artigos_count = db.query(Article).join(Article.authors).filter(Author.id == autor.id).count()
            
            result.append({
                "id": autor.id,
                "nome": autor.nome,
                "sobrenome": autor.sobrenome,
                "slug": autor.slug,
                "artigos_count": artigos_count
            })
        
        return {
            "total_autores": len(result),
            "autores": result
        }
        
    except Exception as e:
        return {"error": f"Erro ao buscar autores: {str(e)}"}

@app.post("/admin/sync-autores")
def sync_autores_from_artigos(db: Session = Depends(get_db)):
    """Sincroniza autores baseado nos artigos existentes"""
    try:
        # Buscar todos os artigos
        artigos = db.query(Article).all()
        
        contador_sincronizados = 0
        
        for artigo in artigos:
            print(f"📄 Sincronizando autores do artigo: {artigo.titulo}")
            
            # Verificar se o artigo tem autores
            if not artigo.authors:
                print(f"⚠️ Artigo sem autores: {artigo.titulo}")
                continue
            
            for author in artigo.authors:
                print(f"👤 Autor encontrado: {author.nome} {author.sobrenome}")
                contador_sincronizados += 1
        
        # Contar total de autores únicos
        total_autores = db.query(Author).count()
        
        return {
            "message": "Sincronização concluída",
            "total_autores_no_banco": total_autores,
            "autores_em_artigos": contador_sincronizados,
            "artigos_processados": len(artigos)
        }
        
    except Exception as e:
        return {"error": f"Erro na sincronização: {str(e)}"}

@app.get("/admin/debug-user-notifications/{user_id}")
def debug_user_notifications(user_id: int, db: Session = Depends(get_db)):
    """Debug das notificações de um usuário específico"""
    try:
        # Buscar usuário
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": f"Usuário {user_id} não encontrado"}
        
        # Buscar notificações ativas
        notifications = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_active == 1
        ).all()
        
        # Buscar logs de email
        email_logs = db.query(EmailLog).filter(
            EmailLog.user_id == user_id
        ).order_by(EmailLog.sent_at.desc()).limit(5).all()
        
        autores_seguidos = []
        for notif in notifications:
            author = db.query(Author).filter(Author.id == notif.author_id).first()
            if author:
                autores_seguidos.append({
                    "id": author.id,
                    "nome": f"{author.nome} {author.sobrenome}",
                    "seguindo_desde": str(notif.created_at)
                })
        
        logs_recentes = []
        for log in email_logs:
            article = db.query(Article).filter(Article.id == log.article_id).first()
            logs_recentes.append({
                "article_title": article.titulo if article else "N/A",
                "sent_at": str(log.sent_at),
                "status": log.status,
                "subject": log.email_subject
            })
        
        return {
            "user": {
                "id": user.id,
                "nome": user.nome,
                "email": user.email,
                "receive_notifications": bool(user.receive_notifications)
            },
            "autores_seguidos": autores_seguidos,
            "logs_recentes": logs_recentes,
            "total_seguindo": len(autores_seguidos)
        }
        
    except Exception as e:
        return {"error": f"Erro no debug: {str(e)}"}