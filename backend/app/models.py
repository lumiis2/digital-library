from sqlalchemy import Column, Integer, String, ForeignKey, Date
from sqlalchemy.orm import relationship
from .database import Base

class Event(Base):
    __tablename__ = "evento"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(64), unique=True, nullable=False)
    nome = Column(String(255), nullable=False)
    editions = relationship("Edition", back_populates="event")

class Edition(Base):
    __tablename__ = "edicao"
    id = Column(Integer, primary_key=True, index=True)
    evento_id = Column(Integer, ForeignKey("evento.id"))
    ano = Column(Integer, nullable=False)
    event = relationship("Event", back_populates="editions")
    articles = relationship("Article", back_populates="edition")

class Article(Base):
    __tablename__ = "artigo"
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(255), nullable=False)
    pdf_path = Column(String(255))
    area = Column(String(100))
    palavras_chave = Column(String(255))
    edicao_id = Column(Integer, ForeignKey("edicao.id"))
    data_publicacao = Column(Date)
    edition = relationship("Edition", back_populates="articles")
    authors = relationship("Author", secondary="artigo_autor", back_populates="articles")

class Author(Base):
    __tablename__ = "autor"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100))
    sobrenome = Column(String(100))
    articles = relationship("Article", secondary="artigo_autor", back_populates="authors")

from sqlalchemy import Table

artigo_autor = Table(
    "artigo_autor",
    Base.metadata,
    Column("artigo_id", Integer, ForeignKey("artigo.id"), primary_key=True),
    Column("autor_id", Integer, ForeignKey("autor.id"), primary_key=True)
)
