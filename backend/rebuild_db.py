import os
import sys
from pathlib import Path

# Adicionar o diretório do app ao path
sys.path.append(str(Path(__file__).parent))

from app.database import Base, engine
from app import models  # importa as classes para registrar no metadata

print("🧱 Reconstruindo o banco de dados...")

# Apaga todas as tabelas existentes (cuidado: destrói dados)
Base.metadata.drop_all(bind=engine)
print("🗑️ Tabelas antigas removidas")

# Recria todas as tabelas conforme o models.py
Base.metadata.create_all(bind=engine)
print("🏗️ Novas tabelas criadas")

# Verificar quais tabelas foram criadas
import sqlalchemy
inspector = sqlalchemy.inspect(engine)
tables = inspector.get_table_names()
print(f"📋 Tabelas finais: {sorted(tables)}")

print("✅ Banco recriado com sucesso!")