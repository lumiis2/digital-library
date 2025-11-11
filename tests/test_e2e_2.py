"""
Teste End-to-End (E2E) #2
Testa fluxo de pesquisa e consulta de dados na biblioteca digital
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

# ==================== TESTE E2E #2 ====================

@pytest.mark.asyncio
async def test_e2e_pesquisa_biblioteca_digital(client, test_db):
    """E2E: Fluxo completo de pesquisa e consulta de dados da biblioteca digital"""
    print("\n=== INICIANDO TESTE E2E #2: PESQUISA E CONSULTA ===")
    
    # 1. Criar dados base para pesquisa
    print("1. Criando dados base...")
    
    # Criar eventos
    eventos_data = [
        {"nome": "Simpósio Brasileiro de Engenharia de Software", "sigla": "sbes-2024"},
        {"nome": "Conferência Brasileira de Inteligência Artificial", "sigla": "cbai-2024"},
        {"nome": "Workshop de Computação Científica", "sigla": "wcc-2024"}
    ]
    
    eventos_ids = []
    for evento in eventos_data:
        response = client.post("/eventos/", json=evento)
        assert response.status_code == 200
        eventos_ids.append(response.json()["id"])
    
    print(f"✓ {len(eventos_ids)} eventos criados")
    
    # 2. Criar edições para cada evento
    print("2. Criando edições...")
    
    edicoes_ids = []
    for i, evento_id in enumerate(eventos_ids):
        edicao_data = {
            "ano": 2024,
            "evento_id": evento_id,
            "descricao": f"Edição 2024 do evento {evento_id}",
            "local": ["São Paulo", "Rio de Janeiro", "Belo Horizonte"][i],
            "data_inicio": "2024-11-01",
            "data_fim": "2024-11-03"
        }
        response = client.post("/edicoes/", json=edicao_data)
        assert response.status_code == 200
        edicoes_ids.append(response.json()["id"])
    
    print(f"✓ {len(edicoes_ids)} edições criadas")
    
    # 3. Criar autores diversos
    print("3. Criando autores...")
    
    autores_data = [
        {"nome": "Alan", "sobrenome": "Turing"},
        {"nome": "Ada", "sobrenome": "Lovelace"},
        {"nome": "Donald", "sobrenome": "Knuth"},
        {"nome": "Edsger", "sobrenome": "Dijkstra"},
        {"nome": "Grace", "sobrenome": "Hopper"},
        {"nome": "John", "sobrenome": "McCarthy"}
    ]
    
    autores_ids = []
    for autor in autores_data:
        response = client.post("/autores/", json=autor)
        assert response.status_code == 200
        autores_ids.append(response.json()["id"])
    
    print(f"✓ {len(autores_ids)} autores criados")
    
    # 4. Criar artigos variados
    print("4. Criando artigos...")
    
    artigos_data = [
        {
            "titulo": "Fundamentos de Inteligência Artificial",
            "area": "Inteligência Artificial",
            "palavras_chave": "IA, Machine Learning, Deep Learning",
            "edicao_id": edicoes_ids[0],
            "author_ids": [autores_ids[0], autores_ids[1]]
        },
        {
            "titulo": "Algoritmos e Estruturas de Dados Avançadas",
            "area": "Algoritmos",
            "palavras_chave": "Algoritmos, Estruturas, Complexidade",
            "edicao_id": edicoes_ids[1],
            "author_ids": [autores_ids[2], autores_ids[3]]
        },
        {
            "titulo": "Programação Funcional em Python",
            "area": "Linguagens de Programação",
            "palavras_chave": "Python, Funcional, Lambda",
            "edicao_id": edicoes_ids[2],
            "author_ids": [autores_ids[4]]
        },
        {
            "titulo": "Redes Neurais e Aprendizado Profundo",
            "area": "Inteligência Artificial",
            "palavras_chave": "Neural Networks, Deep Learning, CNN",
            "edicao_id": edicoes_ids[0],
            "author_ids": [autores_ids[1], autores_ids[5]]
        }
    ]
    
    artigos_ids = []
    for artigo in artigos_data:
        response = client.post("/artigos/", json=artigo)
        assert response.status_code == 200
        artigos_ids.append(response.json()["id"])
    
    print(f"✓ {len(artigos_ids)} artigos criados")
    
    # 5. Testar consultas e filtros
    print("5. Testando consultas...")
    
    # 5.1. Listar todos os artigos
    response = client.get("/artigos/")
    assert response.status_code == 200
    artigos = response.json()
    assert len(artigos) >= 4
    print(f"✓ Total de artigos encontrados: {len(artigos)}")
    
    # 5.2. Listar todos os autores
    response = client.get("/autores/")
    assert response.status_code == 200
    autores = response.json()
    assert len(autores) >= 6
    print(f"✓ Total de autores encontrados: {len(autores)}")
    
    # 5.3. Listar todos os eventos
    response = client.get("/eventos/")
    assert response.status_code == 200
    eventos = response.json()
    assert len(eventos) >= 3
    print(f"✓ Total de eventos encontrados: {len(eventos)}")
    
    # 5.4. Listar todas as edições
    response = client.get("/edicoes/")
    assert response.status_code == 200
    edicoes = response.json()
    assert len(edicoes) >= 3
    print(f"✓ Total de edições encontradas: {len(edicoes)}")
    
    # 6. Verificar integridade dos dados
    print("6. Verificando integridade dos dados...")
    
    # 6.1. Verificar se artigos têm autores corretos
    for artigo in artigos:
        assert "authors" in artigo
        assert len(artigo["authors"]) > 0
        print(f"✓ Artigo '{artigo['titulo']}' tem {len(artigo['authors'])} autor(es)")
    
    # 6.2. Verificar se autores têm slugs únicos
    slugs_autores = [autor["slug"] for autor in autores if autor["slug"]]
    assert len(slugs_autores) == len(set(slugs_autores)), "Slugs de autores devem ser únicos"
    print("✓ Slugs de autores são únicos")
    
    # 6.3. Verificar se eventos têm slugs únicos
    slugs_eventos = [evento["slug"] for evento in eventos]
    assert len(slugs_eventos) == len(set(slugs_eventos)), "Slugs de eventos devem ser únicos"
    print("✓ Slugs de eventos são únicos")
    
    # 7. Testar cenários de busca por área
    print("7. Testando busca por área...")
    
    artigos_ia = [a for a in artigos if a["area"] == "Inteligência Artificial"]
    assert len(artigos_ia) >= 2
    print(f"✓ Encontrados {len(artigos_ia)} artigos de IA")
    
    # 8. Verificar relacionamentos
    print("8. Verificando relacionamentos...")
    
    # Verificar se Ada Lovelace aparece em pelo menos 2 artigos
    ada_artigos = 0
    for artigo in artigos:
        for autor in artigo["authors"]:
            if autor["nome"] == "Ada" and autor["sobrenome"] == "Lovelace":
                ada_artigos += 1
                break
    
    assert ada_artigos >= 2
    print(f"✓ Ada Lovelace aparece em {ada_artigos} artigos")
    
    print("\n=== TESTE E2E #2 CONCLUÍDO COM SUCESSO ===")