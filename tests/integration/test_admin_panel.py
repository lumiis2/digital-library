import pytest
from fastapi.testclient import TestClient
from backend.app.models import User, Event, Edition, Author, Article
import hashlib

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@pytest.mark.asyncio
async def test_admin_login(client, test_db):
    """Testa login de admin"""
    admin = User(
        nome="Admin",
        email="admin@example.com",
        senha_hash=hash_password("admin123"),
        perfil="admin"
    )
    test_db.add(admin)
    test_db.commit()
    
    response = client.post(
        "/login/",
        json={"email": "admin@example.com", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["perfil"] == "admin"
    assert data["email"] == "admin@example.com"

@pytest.mark.asyncio
async def test_usuario_login(client, test_db):
    """Testa login de usuário comum"""
    user = User(
        nome="Usuario",
        email="user@example.com",
        senha_hash=hash_password("user123"),
        perfil="usuario"
    )
    test_db.add(user)
    test_db.commit()
    
    response = client.post(
        "/login/",
        json={"email": "user@example.com", "password": "user123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["perfil"] == "usuario"
    assert data["email"] == "user@example.com"

@pytest.mark.asyncio
async def test_get_events_in_admin_panel(client, test_db):
    """Testa se admin pode listar eventos"""
    event1 = Event(nome="Evento 1", slug="evento-1")
    event2 = Event(nome="Evento 2", slug="evento-2")
    test_db.add(event1)
    test_db.add(event2)
    test_db.commit()
    
    response = client.get("/eventos/")
    assert response.status_code == 200
    events = response.json()
    assert len(events) == 2
    assert events[0]["nome"] == "Evento 1"

@pytest.mark.asyncio
async def test_get_authors_in_admin_panel(client, test_db):
    """Testa se admin pode listar autores"""
    author1 = Author(nome="Alan", sobrenome="Turing")
    author2 = Author(nome="Ada", sobrenome="Lovelace")
    test_db.add(author1)
    test_db.add(author2)
    test_db.commit()
    
    response = client.get("/autores/")
    assert response.status_code == 200
    authors = response.json()
    assert len(authors) == 2
    assert authors[0]["nome"] == "Alan"

@pytest.mark.asyncio
async def test_get_articles_in_admin_panel(client, test_db):
    """Testa se admin pode listar artigos"""
    event = Event(nome="Conferência", slug="conf")
    test_db.add(event)
    test_db.commit()
    
    edition = Edition(ano=2024, evento_id=event.id)
    test_db.add(edition)
    test_db.commit()
    
    article = Article(
        titulo="Artigo 1",
        area="Computação",
        edicao_id=edition.id
    )
    test_db.add(article)
    test_db.commit()
    
    response = client.get("/artigos/")
    assert response.status_code == 200
    articles = response.json()
    assert len(articles) == 1
    assert articles[0]["titulo"] == "Artigo 1"

@pytest.mark.asyncio
async def test_create_event_requires_all_fields(client, test_db):
    """Testa validação de criação de evento"""
    response = client.post(
        "/eventos/",
        json={"nome": "Novo Evento", "sigla": "novo-ev"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == "Novo Evento"
    assert data["slug"] == "novo-ev"
