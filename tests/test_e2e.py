"""
Testes End-to-End (E2E)
Testam fluxos completos do usuário através da aplicação
"""
import pytest
import os
import sys

# Define TEST_MODE antes de qualquer import
os.environ["TEST_MODE"] = "1"

# Adiciona backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from fastapi.testclient import TestClient
from backend.app.database import Base, engine, SessionLocal
from backend.app.main import app
from backend.app.models import User, Event, Edition, Author, Article
import hashlib

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@pytest.fixture(scope="function")
def test_db():
    """Cria banco de testes"""
    db = SessionLocal()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    try:
        yield db
    finally:
        db.rollback()
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(test_db):
    """Override get_db para usar test_db"""
    from backend.app.routes import get_db
    
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()

# ==================== TESTES E2E ====================

@pytest.mark.asyncio
async def test_e2e_usuario_completo(client, test_db):
    """E2E: Usuário se registra, faz login, cria um evento e lista eventos"""
    # 1. Registro
    register_response = client.post(
        "/usuarios/",
        json={
            "nome": "João da Silva",
            "email": "joao@example.com",
            "senha_hash": "senha123",
            "perfil": "usuario",
            "receive_notifications": True
        }
    )
    assert register_response.status_code == 200
    print("✓ Usuário registrado")
    
    # 2. Login
    login_response = client.post(
        "/login/",
        json={"email": "joao@example.com", "password": "senha123"}
    )
    assert login_response.status_code == 200
    assert login_response.json()["perfil"] == "usuario"
    print("✓ Login realizado")
    
    # 3. Criar evento
    event_response = client.post(
        "/eventos/",
        json={"nome": "Conferência Python 2024", "sigla": "conf-py-2024"}
    )
    assert event_response.status_code == 200
    print("✓ Evento criado")
    
    # 4. Listar eventos
    list_response = client.get("/eventos/")
    assert list_response.status_code == 200
    assert len(list_response.json()) >= 1
    print("✓ Eventos listados")

@pytest.mark.asyncio
async def test_e2e_admin_painel_completo(client, test_db):
    """E2E: Admin cria evento, edição, autores e artigos"""
    # 1. Registro do admin
    client.post(
        "/usuarios/",
        json={
            "nome": "Admin Silva",
            "email": "admin@example.com",
            "senha_hash": "admin123",
            "perfil": "admin",
            "receive_notifications": True
        }
    )
    print("✓ Admin registrado")
    
    # 2. Criar evento
    event_response = client.post(
        "/eventos/",
        json={"nome": "Simpósio IA", "sigla": "simposio-ia"}
    )
    event_id = event_response.json()["id"]
    print("✓ Evento criado")
    
    # 3. Criar edição
    edition_response = client.post(
        "/edicoes/",
        json={
            "ano": 2024,
            "evento_id": event_id,
            "descricao": "Edição 2024",
            "local": "São Paulo"
        }
    )
    edition_id = edition_response.json()["id"]
    print("✓ Edição criada")
    
    # 4. Criar autores
    author1_response = client.post(
        "/autores/",
        json={"nome": "Alan", "sobrenome": "Turing"}
    )
    author1_id = author1_response.json()["id"]
    
    author2_response = client.post(
        "/autores/",
        json={"nome": "Ada", "sobrenome": "Lovelace"}
    )
    author2_id = author2_response.json()["id"]
    print("✓ 2 autores criados")
    
    # 5. Criar artigo
    article_response = client.post(
        "/artigos/",
        json={
            "titulo": "Machine Learning na Prática",
            "area": "Inteligência Artificial",
            "palavras_chave": "ML, IA, Python",
            "edicao_id": edition_id,
            "author_ids": [author1_id, author2_id]
        }
    )
    assert article_response.status_code == 200
    print("✓ Artigo criado com 2 autores")

@pytest.mark.asyncio
async def test_e2e_fluxo_completo_com_erros(client, test_db):
    """E2E: Testa cenários com erros"""
    # 1. Registrar primeiro usuário
    client.post(
        "/usuarios/",
        json={
            "nome": "Maria",
            "email": "maria@example.com",
            "senha_hash": "senha123",
            "perfil": "usuario",
            "receive_notifications": True
        }
    )
    print("✓ Primeiro usuário registrado")
    
    # 2. Email duplicado deve falhar
    duplicate = client.post(
        "/usuarios/",
        json={
            "nome": "Outro Maria",
            "email": "maria@example.com",
            "senha_hash": "outrasenha",
            "perfil": "usuario",
            "receive_notifications": True
        }
    )
    assert duplicate.status_code == 400
    print("✓ Email duplicado rejeitado")
    
    # 3. Login com senha errada deve falhar
    wrong = client.post(
        "/login/",
        json={"email": "maria@example.com", "password": "errada"}
    )
    assert wrong.status_code == 401
    print("✓ Login com senha errada rejeitado")
    
    # 4. Login correto deve funcionar
    correct = client.post(
        "/login/",
        json={"email": "maria@example.com", "password": "senha123"}
    )
    assert correct.status_code == 200
    print("✓ Login correto funcionou")
