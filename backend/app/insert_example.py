from datetime import date
from sqlalchemy.orm import Session
from backend.app.database import SessionLocal, engine  # ajuste se seu import for diferente
from backend.app.models import Event, Edition, Article, Author, Base

# Cria as tabelas (caso ainda não existam)
Base.metadata.create_all(bind=engine)

# Abrir sessão
db: Session = SessionLocal()

# Criar dados de exemplo
evento = Event(slug="evento-teste", nome="Evento Teste")
edicao = Edition(ano=2025, event=evento)
autor1 = Author(nome="Luisa", sobrenome="Carvalhaes")
autor2 = Author(nome="Joao", sobrenome="Silva")
artigo = Article(
    titulo="Artigo de Teste",
    pdf_path="/caminho/para/artigo.pdf",
    area="Computação",
    palavras_chave="teste, exemplo",
    data_publicacao=date.today(),
    edition=edicao,
    authors=[autor1, autor2]
)

# Adicionar ao banco
db.add(artigo)
db.commit()

# Opcional: mostrar o ID gerado
print(f"Artigo inserido com ID: {artigo.id}")

db.close()
