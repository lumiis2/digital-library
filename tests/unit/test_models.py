import os
import importlib
import asyncio
from unittest.mock import MagicMock

import pytest
from datetime import date
from fastapi import HTTPException

# Garante modo de teste em memória para módulos do backend
os.environ.setdefault("TEST_MODE", "1")

from backend.app import utils, dependencies
from backend.app import database as db_module
from backend.app import routes, schemas
from backend.app.models import (
    Event,
    Edition,
    Author,
    Article,
    User,
    Notification,
    EmailLog,
    gerar_slug_generico,
)

def test_gerar_slug_generico():
    # Teste com string simples
    assert gerar_slug_generico("Hello World") == "hello-world"
    
    # Teste com acentos
    assert gerar_slug_generico("São Paulo") == "sao-paulo"
    
    # Teste com múltiplos parâmetros
    assert gerar_slug_generico("Alan", "Turing", 1954) == "alan-turing-1954"
    
    # Teste com caracteres especiais
    assert gerar_slug_generico("C++ & Python") == "c-python"
    
    # Teste com string vazia
    assert gerar_slug_generico("") is None
    
    # Teste com espaços em branco
    assert gerar_slug_generico("   ") is None

def test_event_model():
    # Teste criação de evento com nome
    event = Event(nome="Conferência de IA")
    assert event.nome == "Conferência de IA"
    assert event.slug == "conferencia-de-ia"
    
    # Teste criação de evento com slug personalizado
    event = Event(nome="Conferência de IA", slug="conf-ia-2024")
    assert event.slug == "conf-ia-2024"

def test_event_admin_id_and_slug_override():
    event = Event(nome="Evento X", admin_id=42, slug="evento-x")
    assert event.admin_id == 42
    # Quando já vem slug, não deve regenerar
    assert event.slug == "evento-x"

def test_author_model():
    # Teste criação básica de autor
    author = Author(nome="Alan", sobrenome="Turing")
    assert author.nome == "Alan"
    assert author.sobrenome == "Turing"
    
    # Teste artigos vazios inicialmente
    assert author.articles == []

def test_author_custom_slug():
    author = Author(nome="Grace", sobrenome="Hopper", slug="grace-hopper-custom")
    assert author.slug == "grace-hopper-custom"

def test_edition_model():
    # Criar um evento primeiro
    event = Event(nome="Conferência de IA")
    
    # Teste criação de edição
    edition = Edition(
        ano=2024,
        evento_id=1,
        descricao="Edição de 2024",
        data_inicio=date(2024, 6, 1),
        data_fim=date(2024, 6, 5),
        local="São Paulo",
        site_url="http://exemplo.com"
    )
    
    assert edition.ano == 2024
    assert edition.descricao == "Edição de 2024"
    assert edition.local == "São Paulo"
    assert edition.site_url == "http://exemplo.com"
    assert edition.data_inicio == date(2024, 6, 1)
    assert edition.data_fim == date(2024, 6, 5)

def test_article_author_relationship():
    article = Article(
        titulo="Deep Learning",
        area="IA",
        palavras_chave="redes neurais",
        edicao_id=1
    )
    author = Author(nome="Yann", sobrenome="LeCun")
    article.authors.append(author)
    assert article.authors[0].nome == "Yann"
    # relação inversa também deve ser populada em memória
    assert author.articles[0].titulo == "Deep Learning"

def test_user_defaults_and_fields():
    user = User(nome="Alice", email="alice@example.com", senha_hash="hash123")
    # Defaults do SQLAlchemy só são aplicados ao persistir; em memória ficam None
    assert user.perfil is None
    assert user.receive_notifications is None
    assert user.events == []
    # Campos explícitos funcionam
    admin = User(nome="Admin", email="admin@example.com", senha_hash="hash456", perfil="admin", receive_notifications=0)
    assert admin.perfil == "admin"
    assert admin.receive_notifications == 0

def test_notification_and_email_log_defaults():
    user = User(nome="Bob", email="bob@example.com", senha_hash="h")
    author = Author(nome="Ada", sobrenome="Lovelace")
    notification = Notification(user=user, author=author)
    assert notification.is_active is None  # default do banco não aplica em memória
    assert notification.user is user
    assert notification.author is author

    email_log = EmailLog(user_id=1, article_id=2, author_id=3, email_subject="Hello")
    assert email_log.status is None  # default é aplicado no insert
    assert email_log.email_subject == "Hello"

    # Quando informado, deve manter o valor
    delivered = EmailLog(user_id=1, article_id=2, author_id=3, email_subject="Hello", status="delivered")
    assert delivered.status == "delivered"

def test_dependencies_get_db_yields_session(monkeypatch):
    calls = []
    class DummySession:
        def __init__(self):
            calls.append("init")
        def close(self):
            calls.append("close")

    monkeypatch.setattr(dependencies, "SessionLocal", DummySession)
    gen = dependencies.get_db()
    session = next(gen)
    assert isinstance(session, DummySession)
    with pytest.raises(StopIteration):
        next(gen)
    assert calls == ["init", "close"]

def test_utils_hash_and_slug_unit():
    assert utils.sha256("abc") == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    assert utils.generate_slug("Olá Mundo!") == "ola-mundo"


# Coberturas adicionais com mocks (mantendo unitário)

def test_database_em_test_mode(monkeypatch):
    # Mocka engine para evitar conexão real
    monkeypatch.setattr(db_module, "create_engine", lambda *_, **__: "engine")
    reloaded = importlib.reload(db_module)
    assert reloaded.DATABASE_URL.startswith("sqlite://")


def test_schemas_instanciacao():
    ev = schemas.EventoCreate(nome="Conf", sigla="conf")
    assert ev.sigla == "conf"
    user = schemas.UserCreate(nome="Ana", email="ana@example.com", senha_hash="s")
    assert user.perfil == "usuario"
    art = schemas.ArticleCreate(titulo="T", edicao_id=1)
    assert art.author_ids == []


def test_routes_create_user_e_login_mockado():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    db.refresh = lambda obj: None

    payload = schemas.UserCreate(nome="Ana", email="ana@example.com", senha_hash="senha", perfil="usuario", receive_notifications=True)
    user = asyncio.run(routes.create_user(payload, db))
    assert user.email == "ana@example.com"

    hashed = routes.hash_password("senha")
    fake_user = MagicMock()
    fake_user.senha_hash = hashed
    fake_user.id = 1
    fake_user.nome = "Ana"
    fake_user.email = "ana@example.com"
    fake_user.perfil = "usuario"
    db.query.return_value.filter.return_value.first.return_value = fake_user
    login_resp = asyncio.run(routes.login(schemas.LoginRequest(email="ana@example.com", password="senha"), db))
    assert login_resp["email"] == "ana@example.com"


def test_routes_erros():
    db = MagicMock()
    # email duplicado
    db.query.return_value.filter.return_value.first.return_value = object()
    with pytest.raises(HTTPException) as exc:
        asyncio.run(routes.create_user(schemas.UserCreate(nome="Ana", email="ana@example.com", senha_hash="s"), db))
    assert exc.value.status_code == 400

    # login inválido
    db.query.return_value.filter.return_value.first.return_value = None
    with pytest.raises(HTTPException) as exc:
        asyncio.run(routes.login(schemas.LoginRequest(email="none@example.com", password="x"), db))
    assert exc.value.status_code == 401

    with pytest.raises(HTTPException):
        asyncio.run(routes.get_event_by_id_or_slug("999", db))
    with pytest.raises(HTTPException):
        asyncio.run(routes.get_author_by_id_or_slug("slug", db))
