import pytest
from datetime import date
from backend.app.models import Event, Edition, Author, Article, gerar_slug_generico

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

def test_author_model():
    # Teste criação básica de autor
    author = Author(nome="Alan", sobrenome="Turing")
    assert author.nome == "Alan"
    assert author.sobrenome == "Turing"
    
    # Teste artigos vazios inicialmente
    assert author.articles == []

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
