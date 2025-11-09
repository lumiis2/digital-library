import os
os.environ["TEST_MODE"] = "1"  # Define TEST_MODE antes de importar database e models

import pytest
from fastapi.testclient import TestClient
from backend.app.database import Base, engine, SessionLocal
from backend.app.models import Event, Edition, Author, Article  # Importamos os modelos
from backend.app.main import app, get_db
import tempfile
import shutil

@pytest.fixture(scope="function")
def test_db():
    # Criamos uma nova sessão para os testes
    db = SessionLocal()
    
    # Limpamos e recriamos todas as tabelas em cada teste
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    try:
        yield db
    finally:
        db.rollback()  # Garantimos o rollback de qualquer transação pendente
        db.close()
        Base.metadata.drop_all(bind=engine)  # Limpamos o banco ao final

@pytest.fixture(scope="function")
def client(test_db):  # Adicionamos test_db como dependência
    def override_get_db():
        try:
            yield test_db
        finally:
            pass  # O rollback e fechamento serão feitos no fixture test_db
    
    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()  # Limpamos os overrides

@pytest.fixture(scope="function")
def temp_upload_dir():
    temp_dir = tempfile.mkdtemp()
    os.environ["UPLOAD_FOLDER"] = temp_dir
    yield temp_dir
    shutil.rmtree(temp_dir)
