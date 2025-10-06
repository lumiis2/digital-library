import os
import sys
from pathlib import Path

# Adicionar o diretório do app ao path
sys.path.append(str(Path(__file__).parent))

from app.database import Base, engine, SessionLocal
from app import models
import sqlalchemy

def clean_and_rebuild_database():
    """
    Remove todas as tabelas do banco e recria com base nos modelos atuais
    """
    print("🧹 Limpando banco de dados...")
    
    # Conectar ao banco
    db = SessionLocal()
    
    try:
        # Obter todas as tabelas existentes
        inspector = sqlalchemy.inspect(engine)
        existing_tables = inspector.get_table_names()
        
        print(f"📋 Tabelas encontradas: {existing_tables}")
        
        # Dropar todas as tabelas existentes (ordem importa por causa das foreign keys)
        tables_to_drop = [
            'artigo_autor',  # Tabela de associação primeiro
            'email_logs', 'email_log',  # Logs
            'notificacoes', 'notificacao',  # Notificações
            'artigos', 'artigo', 'articles',  # Artigos
            'edicoes', 'edicao', 'editions',  # Edições
            'eventos', 'evento', 'events',  # Eventos
            'autores', 'autor', 'authors',  # Autores
            'usuarios', 'usuario', 'users'  # Usuários
        ]
        
        for table_name in tables_to_drop:
            if table_name in existing_tables:
                try:
                    db.execute(sqlalchemy.text(f"DROP TABLE IF EXISTS {table_name} CASCADE"))
                    print(f"🗑️ Tabela '{table_name}' removida")
                except Exception as e:
                    print(f"⚠️ Erro ao remover tabela '{table_name}': {e}")
        
        db.commit()
        print("✅ Limpeza concluída")
        
    except Exception as e:
        print(f"❌ Erro durante limpeza: {e}")
        db.rollback()
    finally:
        db.close()
    
    # Recriar tabelas
    print("🏗️ Recriando tabelas...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Tabelas recriadas com sucesso!")
        
        # Verificar tabelas criadas
        inspector = sqlalchemy.inspect(engine)
        new_tables = inspector.get_table_names()
        print(f"📋 Tabelas criadas: {sorted(new_tables)}")
        
    except Exception as e:
        print(f"❌ Erro ao recriar tabelas: {e}")

if __name__ == "__main__":
    clean_and_rebuild_database()