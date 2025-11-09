import pytest
from fastapi.testclient import TestClient
from backend.app.models import Event, Edition, Author, Article
from backend.app.schemas import EventoCreate, EditionCreate, AuthorCreate, ArticleCreate

import pytest
from fastapi.testclient import TestClient
from backend.app.models import Event, Edition, Author, Article
from backend.app.schemas import EventoCreate, EditionCreate, AuthorCreate, ArticleCreate

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
