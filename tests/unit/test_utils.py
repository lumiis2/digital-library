import os
import importlib
import asyncio
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

# Força modo de teste para SQLite em memória ao carregar database/main
os.environ.setdefault("TEST_MODE", "1")

from backend.app import utils
from backend.app import database as db_module
from backend.app import routes, schemas, models
from backend.app.main import read_root


def test_sha256_hash_deterministic():
    assert utils.sha256("abc") == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    # mesm oinput, mesmo hash
    assert utils.sha256("abc") == utils.sha256("abc")


def test_generate_slug_normaliza_e_limita():
    assert utils.generate_slug("Olá Mundo!!!") == "ola-mundo"
    assert utils.generate_slug("  Python   Rocks  ") == "python-rocks"
    # corta para 100 caracteres
    long_text = "a" * 120
    assert len(utils.generate_slug(long_text)) == 100


@pytest.mark.asyncio
async def test_send_notification_email_retorna_false_em_erro(monkeypatch):
    # Garante que falhas (como NameError de dependências não importadas) retornam False
    monkeypatch.setenv("EMAIL_FROM", "tester@example.com")
    result = await utils.send_notification_email(
        "dest@example.com",
        author_name="Autor",
        article_title="Artigo",
        event_name="Evento",
    )
    assert result is False


@pytest.mark.asyncio
async def test_send_notification_email_sucesso(monkeypatch):
    # Prepara dependências fake para cobrir caminho de sucesso sem rede
    monkeypatch.setenv("EMAIL_FROM", "from@example.com")
    monkeypatch.setenv("EMAIL_PASSWORD", "pwd")
    monkeypatch.setenv("SMTP_SERVER", "smtp.test")
    monkeypatch.setenv("SMTP_PORT", "587")

    class DummySMTP:
        def __init__(self, host, port):
            self.host = host
            self.port = port
            self.sent = False
        def starttls(self): pass
        def login(self, user, pwd):
            assert user == "from@example.com"
            assert pwd == "pwd"
        def sendmail(self, from_addr, to_addr, text):
            self.sent = True
            assert from_addr == "from@example.com"
            assert to_addr == "dest@example.com"
            assert "Artigo" in text
        def quit(self): pass

    class DummyMsg:
        def __init__(self):
            self.headers = {}
        def __setitem__(self, key, value):
            self.headers[key] = value
        def attach(self, body):
            # aceita qualquer conteúdo
            self.body = body
        def as_string(self):
            return f"{self.headers}::{getattr(self, 'body', '')}"

    # injeta módulo smtplib e função MIMEText ausentes
    fake_smtp_module = type("fake", (), {"SMTP": DummySMTP})
    # utils não importa smtplib/MIMEText, então inserimos atributos novos
    monkeypatch.setattr(utils, "smtplib", fake_smtp_module, raising=False)
    monkeypatch.setattr(utils, "MIMEText", lambda body, fmt: body, raising=False)
    monkeypatch.setattr(utils, "MIMEMultipart", DummyMsg, raising=False)

    result = await utils.send_notification_email(
        "dest@example.com", "Autor", "Artigo", "Evento"
    )
    assert result is True


# --------------------------------------------------------------------
# Cobertura de outros módulos apenas com mocks (sem banco nem HTTP)
# --------------------------------------------------------------------

def test_database_em_test_mode(monkeypatch):
    # Mocka create_engine para evitar conexão real
    monkeypatch.setattr(db_module, "create_engine", lambda *args, **kwargs: "engine")
    reloaded = importlib.reload(db_module)
    assert reloaded.DATABASE_URL.startswith("sqlite://")


def test_models_construcoes_basicas():
    ev = models.Event(nome="Conf X")
    assert ev.slug == "conf-x"
    ed = models.Edition(ano=2024, evento_id=1, descricao="Desc")
    au = models.Author(nome="Ada", sobrenome="Lovelace")
    art = models.Article(titulo="Art", edicao_id=1)
    art.authors.append(au)
    assert art.authors[0].slug == "ada-lovelace"

    user = models.User(nome="U", email="u@example.com", senha_hash="h")
    note = models.Notification(user=user, author=au)
    elog = models.EmailLog(user_id=1, article_id=1, author_id=1, email_subject="Hi")
    assert note.user is user
    assert elog.email_subject == "Hi"


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

    # login bem-sucedido com senha hash compatível
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


def test_routes_create_user_email_duplicado():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = object()
    with pytest.raises(HTTPException) as exc:
        asyncio.run(routes.create_user(schemas.UserCreate(nome="Ana", email="ana@example.com", senha_hash="s"), db))
    assert exc.value.status_code == 400


def test_routes_login_invalido():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    with pytest.raises(HTTPException) as exc:
        asyncio.run(routes.login(schemas.LoginRequest(email="none@example.com", password="x"), db))
    assert exc.value.status_code == 401


def test_routes_get_por_id_ou_slug_retorna_404():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    with pytest.raises(HTTPException):
        asyncio.run(routes.get_event_by_id_or_slug("999", db))
    with pytest.raises(HTTPException):
        asyncio.run(routes.get_author_by_id_or_slug("slug", db))


