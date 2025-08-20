from .database import Base, engine
from .models import Event, Edition, Article, Author, artigo_autor

# Cria todas as tabelas
Base.metadata.create_all(bind=engine)

print("Tabelas criadas com sucesso!")
