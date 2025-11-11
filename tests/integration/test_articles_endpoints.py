import pytest
from fastapi.testclient import TestClient
from backend.app.models import Event, Edition, Author, Article
from backend.app.schemas import EventoCreate, EditionCreate, AuthorCreate, ArticleCreate
import hashlib

import pytest
from fastapi.testclient import TestClient
from backend.app.models import Event, Edition, Author, Article
from backend.app.schemas import EventoCreate, EditionCreate, AuthorCreate, ArticleCreate

def hash_password(password: str) -> str:
    """Hasha a senha usando SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

@pytest.mark.asyncio
async def test_create_event(client, test_db):
    response = client.post(
        "/eventos/",
        json={"nome": "Conferência de IA", "sigla": "conf-ia", "admin_id": None}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == "Conferência de IA"
    assert data["slug"] == "conf-ia"

@pytest.mark.asyncio
async def test_get_events(client, test_db):
    # Criar alguns eventos primeiro
    eventos = [
        Event(nome="Conferência 1", slug="conf-1"),
        Event(nome="Conferência 2", slug="conf-2")
    ]
    for evento in eventos:
        test_db.add(evento)
    test_db.commit()
    
    response = client.get("/eventos/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["nome"] == "Conferência 1"
    assert data[1]["nome"] == "Conferência 2"

@pytest.mark.asyncio
async def test_create_edition(client, test_db):
    # Criar um evento primeiro
    event = Event(nome="Conferência de IA", slug="conf-ia")
    test_db.add(event)
    test_db.commit()
    
    response = client.post(
        "/edicoes/",
        json={
            "ano": 2024,
            "evento_id": event.id,
            "descricao": "Edição 2024",
            "data_inicio": "2024-06-01",
            "data_fim": "2024-06-05",
            "local": "São Paulo",
            "site_url": "http://exemplo.com"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ano"] == 2024
    assert data["descricao"] == "Edição 2024"

@pytest.mark.asyncio
async def test_create_author(client, test_db):
    response = client.post(
        "/autores/",
        json={"nome": "Alan", "sobrenome": "Turing"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == "Alan"
    assert data["sobrenome"] == "Turing"
    assert "slug" in data

@pytest.mark.asyncio
async def test_get_authors(client, test_db):
    # Criar alguns autores primeiro
    autores = [
        Author(nome="Alan", sobrenome="Turing"),
        Author(nome="Ada", sobrenome="Lovelace")
    ]
    for autor in autores:
        test_db.add(autor)
    test_db.commit()
    
    response = client.get("/autores/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["nome"] == "Alan"
    assert data[1]["nome"] == "Ada"

@pytest.mark.asyncio
async def test_create_article(client, test_db):
    # Criar evento, edição e autor primeiro
    event = Event(nome="Conferência de IA", slug="conf-ia")
    test_db.add(event)
    test_db.commit()
    
    edition = Edition(ano=2024, evento_id=event.id)
    test_db.add(edition)
    
    author = Author(nome="Alan", sobrenome="Turing")
    test_db.add(author)
    test_db.commit()
    
    response = client.post(
        "/artigos/",
        json={
            "titulo": "Inteligência Artificial",
            "area": "Computação",
            "palavras_chave": "IA, Machine Learning",
            "edicao_id": edition.id,
            "author_ids": [author.id]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["titulo"] == "Inteligência Artificial"
    assert data["area"] == "Computação"
    assert len(data["authors"]) == 1

@pytest.mark.asyncio
async def test_get_articles(client, test_db):
    # Criar evento, edição e autores primeiro
    event = Event(nome="Conferência de IA", slug="conf-ia")
    test_db.add(event)
    test_db.commit()
    
    edition = Edition(ano=2024, evento_id=event.id)
    test_db.add(edition)
    
    author1 = Author(nome="Alan", sobrenome="Turing")
    author2 = Author(nome="Ada", sobrenome="Lovelace")
    test_db.add(author1)
    test_db.add(author2)
    test_db.commit()
    
    # Criar alguns artigos
    article1 = Article(
        titulo="Inteligência Artificial",
        area="Computação",
        palavras_chave="IA, Machine Learning",
        edicao_id=edition.id
    )
    article1.authors.append(author1)
    
    article2 = Article(
        titulo="Computação Quântica",
        area="Física",
        palavras_chave="Quântica, Algoritmos",
        edicao_id=edition.id
    )
    article2.authors.append(author2)
    
    test_db.add(article1)
    test_db.add(article2)
    test_db.commit()
    
    # Fazer requisição GET para listar artigos
    response = client.get("/artigos/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["titulo"] == "Inteligência Artificial"
    assert data[1]["titulo"] == "Computação Quântica"

@pytest.mark.asyncio
async def test_get_editions(client, test_db):
    # Criar alguns eventos primeiro
    event1 = Event(nome="Conferência 1", slug="conf-1")
    event2 = Event(nome="Conferência 2", slug="conf-2")
    test_db.add(event1)
    test_db.add(event2)
    test_db.commit()
    
    # Criar edições
    edition1 = Edition(ano=2024, evento_id=event1.id, descricao="Edição 2024")
    edition2 = Edition(ano=2023, evento_id=event2.id, descricao="Edição 2023")
    test_db.add(edition1)
    test_db.add(edition2)
    test_db.commit()
    
    response = client.get("/edicoes/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["ano"] == 2024
    assert data[1]["ano"] == 2023

@pytest.mark.asyncio
async def test_create_user(client, test_db):
    response = client.post(
        "/usuarios/",
        json={
            "nome": "João Silva",
            "email": "joao@example.com",
            "senha_hash": "senha123",
            "perfil": "usuario",
            "receive_notifications": True
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == "João Silva"
    assert data["email"] == "joao@example.com"

@pytest.mark.asyncio
async def test_get_users(client, test_db):
    from backend.app.models import User
    
    # Criar alguns usuários
    users = [
        User(nome="João", email="joao@example.com", senha_hash="senha1", perfil="usuario"),
        User(nome="Maria", email="maria@example.com", senha_hash="senha2", perfil="admin")
    ]
    for user in users:
        test_db.add(user)
    test_db.commit()
    
    response = client.get("/usuarios/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["nome"] == "João"
    assert data[1]["nome"] == "Maria"

@pytest.mark.asyncio
async def test_login(client, test_db):
    from backend.app.models import User
    
    # Criar um usuário com senha hasheada
    user = User(
        nome="João",
        email="joao@example.com",
        senha_hash=hash_password("senha123"),
        perfil="usuario"
    )
    test_db.add(user)
    test_db.commit()
    
    # Fazer login com senha em plain text (será hasheada pela API)
    response = client.post(
        "/login/",
        json={
            "email": "joao@example.com",
            "password": "senha123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "joao@example.com"
    assert data["perfil"] == "usuario"
    assert "access_token" in data

@pytest.mark.asyncio
async def test_login_invalid(client, test_db):
    response = client.post(
        "/login/",
        json={
            "email": "inexistente@example.com",
            "password": "senha"
        }
    )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_register_user(client, test_db):
    response = client.post(
        "/usuarios/",
        json={
            "nome": "Maria Silva",
            "email": "maria@example.com",
            "senha_hash": "senha456",
            "perfil": "usuario",
            "receive_notifications": True
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == "Maria Silva"
    assert data["email"] == "maria@example.com"
    assert data["perfil"] == "usuario"

@pytest.mark.asyncio
async def test_register_duplicate_email(client, test_db):
    # Primeiro registro
    client.post(
        "/usuarios/",
        json={
            "nome": "João",
            "email": "joao@example.com",
            "senha_hash": "senha123",
            "perfil": "usuario",
            "receive_notifications": True
        }
    )
    
    # Segundo registro com mesmo email
    response = client.post(
        "/usuarios/",
        json={
            "nome": "Outro João",
            "email": "joao@example.com",
            "senha_hash": "outrasenha",
            "perfil": "usuario",
            "receive_notifications": True
        }
    )
    assert response.status_code == 400
    assert "Email já cadastrado" in response.json()["detail"]

@pytest.mark.asyncio
async def test_register_with_receive_notifications_true(client, test_db):
    """Testa se receive_notifications boolean é convertido corretamente para integer"""
    response = client.post(
        "/usuarios/",
        json={
            "nome": "Test User",
            "email": "testuser@example.com",
            "senha_hash": "senha123",
            "perfil": "usuario",
            "receive_notifications": True
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["receive_notifications"] == True
    
    # Validar no banco de dados que foi armazenado como 1
    from backend.app.models import User
    user = test_db.query(User).filter(User.email == "testuser@example.com").first()
    assert user is not None
    assert user.receive_notifications == 1

@pytest.mark.asyncio
async def test_register_with_receive_notifications_false(client, test_db):
    """Testa se receive_notifications false é convertido corretamente para integer 0"""
    response = client.post(
        "/usuarios/",
        json={
            "nome": "Test User 2",
            "email": "testuser2@example.com",
            "senha_hash": "senha123",
            "perfil": "usuario",
            "receive_notifications": False
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["receive_notifications"] == False
    
    # Validar no banco de dados que foi armazenado como 0
    from backend.app.models import User
    user = test_db.query(User).filter(User.email == "testuser2@example.com").first()
    assert user is not None
    assert user.receive_notifications == 0
