import psycopg2
from psycopg2.extras import execute_batch
from datetime import datetime
import bibtexparser

def connect_db():
    return psycopg2.connect(
        host="localhost",
        database="digital_library",
        user="postgres",
        password="postgres"
    )

def clear_database(cursor):
    # Limpa todas as tabelas na ordem certa
    cursor.execute("TRUNCATE TABLE artigo_autor RESTART IDENTITY CASCADE;")
    cursor.execute("TRUNCATE TABLE artigo RESTART IDENTITY CASCADE;")
    cursor.execute("TRUNCATE TABLE autor RESTART IDENTITY CASCADE;")
    cursor.execute("TRUNCATE TABLE edicao RESTART IDENTITY CASCADE;")
    cursor.execute("TRUNCATE TABLE evento RESTART IDENTITY CASCADE;")

# --- Funções de get_or_create (Event, Edition, Author) ---
def get_or_create_event(cursor, slug, nome):
    cursor.execute("SELECT id FROM evento WHERE slug=%s", (slug,))
    result = cursor.fetchone()
    if result:
        return result[0]
    cursor.execute("INSERT INTO evento (slug, nome) VALUES (%s, %s) RETURNING id", (slug, nome))
    return cursor.fetchone()[0]

def get_or_create_edition(cursor, evento_id, ano, slug=None):
    cursor.execute("SELECT id FROM edicao WHERE evento_id=%s AND ano=%s", (evento_id, ano))
    result = cursor.fetchone()
    if result:
        return result[0]
    cursor.execute("INSERT INTO edicao (evento_id, ano, slug) VALUES (%s, %s, %s) RETURNING id", (evento_id, ano, slug))
    return cursor.fetchone()[0]

def get_or_create_author(cursor, nome_completo):
    parts = nome_completo.strip().split(' ', 1)
    nome = parts[0]
    sobrenome = parts[1] if len(parts) > 1 else ''
    cursor.execute("SELECT id FROM autor WHERE nome=%s AND sobrenome=%s", (nome, sobrenome))
    result = cursor.fetchone()
    if result:
        return result[0]
    cursor.execute("INSERT INTO autor (nome, sobrenome) VALUES (%s, %s) RETURNING id", (nome, sobrenome))
    return cursor.fetchone()[0]

# --- Inserir artigo com autores ---
def insert_article_with_authors(cursor, article_data, authors_str):
    # Evitar duplicados: verifica se já existe artigo com mesmo título na mesma edição
    cursor.execute(
        "SELECT id FROM artigo WHERE titulo=%s AND edicao_id=%s",
        (article_data[0], article_data[4])
    )
    result = cursor.fetchone()
    if result:
        artigo_id = result[0]
    else:
        article_query = """
        INSERT INTO artigo (titulo, pdf_path, area, palavras_chave, edicao_id, data_publicacao)
        VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
        """
        cursor.execute(article_query, article_data)
        artigo_id = cursor.fetchone()[0]

    # Autores
    authors_list = [a.strip() for a in authors_str.split(',')] if authors_str else []
    for autor_nome in authors_list:
        autor_id = get_or_create_author(cursor, autor_nome)
        cursor.execute(
            "INSERT INTO artigo_autor (artigo_id, autor_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (artigo_id, autor_id)
        )

# --- Processar BibTeX ---
def process_bib_file(cursor, file_path):
    with open(file_path, 'r') as bibfile:
        bib_database = bibtexparser.load(bibfile)

    for entry in bib_database.entries:
        # Evento e edição
        evento_slug = entry.get('event_slug', 'default_slug')
        evento_nome = entry.get('event_name', 'Evento Desconhecido')
        evento_id = get_or_create_event(cursor, evento_slug, evento_nome)

        ano = int(entry.get('year', 2025))
        edicao_slug = f"{evento_slug}-{ano}"
        edicao_id = get_or_create_edition(cursor, evento_id, ano, edicao_slug)

        # Artigo
        titulo = entry.get('title', '')
        pdf_path = entry.get('pdf', '')
        area = entry.get('keywords', '')
        palavras_chave = entry.get('keywords', '')
        data_publicacao = datetime(ano, 1, 1).date() if entry.get('year') else None
        authors_str = entry.get('author', '')

        article_data = (titulo, pdf_path, area, palavras_chave, edicao_id, data_publicacao)
        insert_article_with_authors(cursor, article_data, authors_str)

if __name__ == "__main__":
    conn = connect_db()
    cursor = conn.cursor()

    # Limpar banco antes de inserir
    clear_database(cursor)

    # Arquivo BibTeX
    bib_file_path = '../../uploads/bibtexex.bib'
    process_bib_file(cursor, bib_file_path)

    conn.commit()
    cursor.close()
    conn.close()
    print("Importação concluída com sucesso!")
