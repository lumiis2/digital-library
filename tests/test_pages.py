import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

# Importa o conftest para usar os fixtures
from tests.integration.conftest import client, test_db

def test_home_page(client):
    """Testa acesso à página inicial"""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_eventos_endpoint(client, test_db):
    """Testa se o endpoint GET /eventos/ está acessível"""
    response = client.get("/eventos/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_autores_endpoint(client, test_db):
    """Testa se o endpoint GET /autores/ está acessível"""
    response = client.get("/autores/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_artigos_endpoint(client, test_db):
    """Testa se o endpoint GET /artigos/ está acessível"""
    response = client.get("/artigos/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_edicoes_endpoint(client, test_db):
    """Testa se o endpoint GET /edicoes/ está acessível"""
    response = client.get("/edicoes/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
