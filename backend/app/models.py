from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Table, Text, Index, func
from sqlalchemy.orm import relationship
from .database import Base
import re, unicodedata

# ============================================================
# Função universal para gerar slug
# ============================================================

def gerar_slug_generico(*partes):
    """
    Gera um slug a partir de múltiplas partes (nome, sobrenome, ano, etc.)
    Exemplo:
        gerar_slug_generico("Alan", "Turing") -> 'alan-turing'
        gerar_slug_generico("Congresso", 2024) -> 'congresso-2024'
    """
    # Junta apenas as partes que não estão vazias ou nulas
    texto = "-".join(str(p).strip() for p in partes if p and str(p).strip())

    # Remove acentos
    texto = unicodedata.normalize('NFKD', texto).encode('ascii', 'ignore').decode('ascii')
    # Deixa minúsculo
    texto = texto.lower()
    # Substitui tudo que não for letra/número por hífen
    texto = re.sub(r'[^a-z0-9]+', '-', texto)
    # Remove hífens duplicados e dos extremos
    texto = texto.strip('-')

    return texto or None  # Retorna None se tudo for vazio


# ============================================================
# Tabelas e Modelos
# ============================================================

# Tabela de associação entre artigos e autores
artigo_autor = Table(
    'artigo_autor',
    Base.metadata,
    Column('artigo_id', Integer, ForeignKey('artigos.id'), primary_key=True),
    Column('autor_id', Integer, ForeignKey('autores.id'), primary_key=True)
)


# -------------------------------
# Modelo: Evento
# -------------------------------
class Event(Base):
    __tablename__ = "eventos"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    admin_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    
    # Relacionamentos
    editions = relationship("Edition", back_populates="event")
    admin = relationship("User", back_populates="events")

    def __init__(self, nome, admin_id=None, **kwargs):
        super().__init__(nome=nome, admin_id=admin_id, **kwargs)
        if not kwargs.get('slug'):  # Só gera slug se não foi fornecido
            self.slug = gerar_slug_generico(nome)


# -------------------------------
# Modelo: Edição
# -------------------------------
class Edition(Base):
    __tablename__ = "edicoes"
    
    id = Column(Integer, primary_key=True, index=True)
    ano = Column(Integer, nullable=False)
    evento_id = Column(Integer, ForeignKey("eventos.id"), nullable=False)
    slug = Column(String(200), unique=True, index=True)
    descricao = Column(Text, nullable=True)
    data_inicio = Column(Date, nullable=True)
    data_fim = Column(Date, nullable=True)
    local = Column(String(500), nullable=True)
    site_url = Column(String(500), nullable=True)
    
    # Relacionamentos
    event = relationship("Event", back_populates="editions")
    articles = relationship("Article", back_populates="edition")


# -------------------------------
# Modelo: Autor
# -------------------------------
class Author(Base):
    __tablename__ = "autores"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    sobrenome = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=True)
    
    # Relacionamentos
    articles = relationship("Article", secondary=artigo_autor, back_populates="authors")
    notifications = relationship("Notification", back_populates="author")

    def __init__(self, nome, sobrenome=None, **kwargs):
        super().__init__(nome=nome, sobrenome=sobrenome, **kwargs)
        if not kwargs.get('slug'):  # Só gera slug se não foi fornecido
            self.slug = gerar_slug_generico(nome, sobrenome)


# -------------------------------
# Modelo: Artigo
# -------------------------------
class Article(Base):
    __tablename__ = "artigos"
    
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    resumo = Column(String)
    area = Column(String)
    palavras_chave = Column(String)
    pdf_path = Column(String)
    data_publicacao = Column(Date)
    edicao_id = Column(Integer, ForeignKey("edicoes.id"), nullable=False)
    
    # Relacionamentos
    edition = relationship("Edition", back_populates="articles")
    authors = relationship("Author", secondary=artigo_autor, back_populates="articles")


# -------------------------------
# Modelo: Usuário
# -------------------------------
class User(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    senha_hash = Column(String, nullable=False)
    perfil = Column(String, default="usuario")
    receive_notifications = Column(Integer, default=1)
    
    # Relacionamentos
    notifications = relationship("Notification", back_populates="user")
    events = relationship("Event", back_populates="admin")


# -------------------------------
# Modelo: Notificação
# -------------------------------
class Notification(Base):
    __tablename__ = "notificacoes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("autores.id"), nullable=False)
    is_active = Column(Integer, default=1)
    created_at = Column(Date, default=func.current_date())
    
    # Relacionamentos
    user = relationship("User", back_populates="notifications")
    author = relationship("Author", back_populates="notifications")


# -------------------------------
# Modelo: Log de Emails
# -------------------------------
class EmailLog(Base):
    __tablename__ = "email_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    article_id = Column(Integer, ForeignKey("artigos.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("autores.id"), nullable=False)
    sent_at = Column(Date, default=func.current_date())
    email_subject = Column(String)
    status = Column(String, default="sent")