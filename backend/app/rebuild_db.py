# app/rebuild_db.py
from app.database import Base, engine
from app import models  # importa as classes para registrar no metadata

print("🧱 Reconstruindo o banco de dados...")

# Apaga todas as tabelas existentes (cuidado: destrói dados)
Base.metadata.drop_all(bind=engine)

# Recria todas as tabelas conforme o models.py
Base.metadata.create_all(bind=engine)

print("✅ Banco recriado com sucesso!")
