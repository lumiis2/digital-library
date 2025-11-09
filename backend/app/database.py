from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool
import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

# Use SQLite para testes se a variável de ambiente TEST_MODE estiver definida
if os.getenv("TEST_MODE"):
    DATABASE_URL = "sqlite:///:memory:"
    # Para SQLite em memória, precisamos habilitar o suporte a chaves estrangeiras
    # e garantir que a conexão seja mantida para o mesmo banco em memória
    engine = create_engine(
        DATABASE_URL,
        connect_args={
            "check_same_thread": False,
        },
        poolclass=StaticPool,  # Mantém a mesma conexão para o banco em memória
        echo=True  # Habilita logs de SQL para debug
    )
    
    from sqlalchemy import event
    from sqlalchemy.engine import Engine
    import sqlite3
    
    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        if isinstance(dbapi_connection, sqlite3.Connection):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
else:
    DB_USER = os.getenv("DB_USER")
    DB_PASS = os.getenv("DB_PASS")
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT") or "5432"
    DB_NAME = os.getenv("DB_NAME")
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

if not os.getenv("TEST_MODE"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={} if not DATABASE_URL.startswith("sqlite") else {"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
