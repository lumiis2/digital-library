from sqlalchemy import Column, Integer, String, ForeignKey, Date, Table, Index, func
from sqlalchemy.orm import relationship
from .database import Base
import re, unicodedata

# Tabela de associação entre artigos e autores
artigo_autor = Table(
    'artigo_autor',
    Base.metadata,
    Column('artigo_id', Integer, ForeignKey('artigo.id'), primary_key=True),
    Column('autor_id', Integer, ForeignKey('autor.id'), primary_key=True)
)

def gerar_slug(nome, sobrenome):
    texto = f"{nome}-{sobrenome}"
    texto = unicodedata.normalize('NFKD', texto).encode('ascii', 'ignore').decode('ascii')
    texto = texto.lower()
    texto = re.sub(r'[^a-z0-9]+', '-', texto).strip('-')
    return texto

class Event(Base):
    __tablename__ = "evento"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    admin_id = Column(Integer, ForeignKey("usuario.id"), nullable=True)  # MANTER admin_id
    
    # Relacionamentos
    editions = relationship("Edition", back_populates="event")
    admin = relationship("User", back_populates="events")

class Edition(Base):
    __tablename__ = "edicao"
    
    id = Column(Integer, primary_key=True, index=True)
    ano = Column(Integer, nullable=False)
    evento_id = Column(Integer, ForeignKey("evento.id"), nullable=False)
    slug = Column(String, unique=True, nullable=False)
    
    # Relacionamentos
    event = relationship("Event", back_populates="editions")
    articles = relationship("Article", back_populates="edition")

class Author(Base):
    __tablename__ = "autor"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    sobrenome = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=True)  # MANTER slug
    
    # Relacionamentos
    articles = relationship("Article", secondary=artigo_autor, back_populates="authors")
    notifications = relationship("Notification", back_populates="author")

    def __init__(self, nome, sobrenome, **kwargs):
        super().__init__(nome=nome, sobrenome=sobrenome, **kwargs)
        self.slug = gerar_slug(nome, sobrenome)

class Article(Base):
    __tablename__ = "artigo"
    
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    resumo = Column(String)
    area = Column(String)
    palavras_chave = Column(String)
    pdf_path = Column(String)
    data_publicacao = Column(Date)
    edicao_id = Column(Integer, ForeignKey("edicao.id"), nullable=False)
    
    # Relacionamentos
    edition = relationship("Edition", back_populates="articles")
    authors = relationship("Author", secondary=artigo_autor, back_populates="articles")

class User(Base):
    __tablename__ = "usuario"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    senha_hash = Column(String, nullable=False)
    perfil = Column(String, default="usuario")
    receive_notifications = Column(Integer, default=1)
    
    # Relacionamentos
    notifications = relationship("Notification", back_populates="user")
    events = relationship("Event", back_populates="admin")  # MANTER relacionamento

class Notification(Base):
    __tablename__ = "notificacao"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("autor.id"), nullable=False)
    is_active = Column(Integer, default=1)
    created_at = Column(Date, default=func.current_date())
    
    # Relacionamentos
    user = relationship("User", back_populates="notifications")
    author = relationship("Author", back_populates="notifications")

class EmailLog(Base):
    __tablename__ = "email_log"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)
    article_id = Column(Integer, ForeignKey("artigo.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("autor.id"), nullable=False)
    sent_at = Column(Date, default=func.current_date())
    email_subject = Column(String)
    status = Column(String, default="sent")
