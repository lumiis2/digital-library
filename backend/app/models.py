from sqlalchemy import Column, Integer, String, ForeignKey, Date, Table, Index, func
from sqlalchemy.orm import relationship
from .database import Base
from datetime import date

# Tabela associativa N:N entre artigos e autores
artigo_autor = Table(
    "artigo_autor",
    Base.metadata,
    Column("artigo_id", Integer, ForeignKey("artigo.id"), primary_key=True),
    Column("autor_id", Integer, ForeignKey("autor.id"), primary_key=True)
)

# -------------------------
# Models principais
# -------------------------

class Event(Base):
    __tablename__ = "evento"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(64), unique=True, nullable=False, index=True)
    nome = Column(String(255), nullable=False)
    editions = relationship("Edition", back_populates="event")
    

class Edition(Base):
    __tablename__ = "edicao"
    id = Column(Integer, primary_key=True, index=True)
    evento_id = Column(Integer, ForeignKey("evento.id"))
    ano = Column(Integer, nullable=False)
    slug = Column(String(64), unique=True, nullable=False, index=True)  # Slug amigável para URLs
    event = relationship("Event", back_populates="editions")
    articles = relationship("Article", back_populates="edition")


class Article(Base):
    __tablename__ = "artigo"
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(255), nullable=False, index=True)
    pdf_path = Column(String(255))
    area = Column(String(100), index=True)
    palavras_chave = Column(String(255), index=True)
    resumo = Column(String(1000))  # Abstract
    doi = Column(String(255), unique=True, nullable=True)
    categoria = Column(String(100))
    edicao_id = Column(Integer, ForeignKey("edicao.id"))
    data_publicacao = Column(Date, index=True)  # Para filtragem por intervalo de datas

    edition = relationship("Edition", back_populates="articles")
    authors = relationship("Author", secondary="artigo_autor", back_populates="articles")

    # Índices compostos opcionais para otimizar buscas
    __table_args__ = (
        Index('idx_artigo_titulo_area', 'titulo', 'area'),
    )


class Author(Base):
    __tablename__ = "autor"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), index=True)
    sobrenome = Column(String(100), index=True)
    slug = Column(String(200), unique=True, nullable=True, index=True)  # Slug amigável para URLs
    articles = relationship("Article", secondary="artigo_autor", back_populates="authors")


class User(Base):
    __tablename__ = "usuario"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    senha_hash = Column(String(255), nullable=False)
    receive_notifications = Column(Integer, default=1)  # 1=sim, 0=não
    notifications = relationship("Notification", back_populates="user")


class Notification(Base):
    __tablename__ = "notificacao"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuario.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("autor.id"), nullable=False)  # Autor que o user quer seguir
    is_active = Column(Integer, default=1)  # 1=ativa, 0=desativa
    created_at = Column(Date, nullable=False, default=date.today)
    
    user = relationship("User", back_populates="notifications")
    author = relationship("Author")


class EmailLog(Base):
    __tablename__ = "email_log"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuario.id"))
    article_id = Column(Integer, ForeignKey("artigo.id"))
    author_id = Column(Integer, ForeignKey("autor.id"))
    sent_at = Column(Date, nullable=False)
    email_subject = Column(String(255))
    status = Column(String(50))  # 'sent', 'failed', 'pending'
