# 📚 Digital Library

Sistema completo de biblioteca digital com backend em FastAPI, frontend em React e banco de dados PostgreSQL via Docker.

---

## ⚙️ Diagrama de Sequencia

O diagrama abaixo mostra como os containers são inicializados e se comunicam:

```mermaid
sequenceDiagram
    autonumber
    participant Dev as Desenvolvedor
    participant Docker as Docker Engine
    participant BE as Container Backend (FastAPI)
    participant DB as Container Banco de Dados (PostgreSQL)
    participant Vol as Volume Persistente (dados.db)

    Dev->>Docker: Executa "docker-compose up"
    Docker->>BE: Constrói imagem FastAPI (Dockerfile)
    Docker->>DB: Inicializa container PostgreSQL
    DB->>Vol: Monta volume persistente de dados

    BE->>DB: Tenta conexão inicial (host=db, port=5432)
    DB-->>BE: Confirma conexão estabelecida

    BE->>DB: Executa scripts de migração / criação de tabelas
    DB-->>BE: Confirma estrutura criada com sucesso

    BE->>DB: Envia comandos SQL (INSERT, SELECT, UPDATE)
    DB-->>BE: Retorna resultados (dados persistidos)

    BE->>Docker: Loga status “Connected to PostgreSQL”
    Docker-->>Dev: Mostra logs de inicialização concluída
    Dev->>BE: Acessa API via localhost:8000
    BE->>DB: Manipula requisições em tempo real


## ⚙️ Diagrama de Pacotes

graph TD
    %% Estilo geral
    classDef backend fill:#fdf5e6,stroke:#b8860b,stroke-width:1px,color:#000,rx:6,ry:6;
    classDef frontend fill:#e6f7ff,stroke:#007acc,stroke-width:1px,color:#000,rx:6,ry:6;
    classDef shared fill:#f0f0f0,stroke:#555,stroke-width:1px,color:#000,rx:6,ry:6;
    classDef database fill:#f9ecec,stroke:#cc0000,stroke-width:1px,color:#000,rx:6,ry:6;

    %% Pacote raiz
    A["📚 Digital Library"]:::shared

    %% Backend
    A --> B["⚙️ Backend (FastAPI)"]:::backend
    B --> B1["app/"]:::backend
    B1 --> B1a["main.py<br/>→ ponto de entrada da API"]
    B1 --> B1b["models.py<br/>→ modelos ORM (SQLAlchemy)"]
    B1 --> B1c["schemas.py<br/>→ validação com Pydantic"]
    B1 --> B1d["database.py<br/>→ conexão com PostgreSQL"]
    B1 --> B1e["insert_example.py<br/>→ inserção automatizada de dados"]
    B1 --> B1f["rebuild_db.py<br/>→ recriação das tabelas"]
    B --> B2["uploads/"]:::backend
    B2 --> B2a["Turing_Paper_1936.pdf"]
    B --> B3["requirements.txt / .env / backend.log"]

    %% Banco de dados
    A --> D["🗄️ PostgreSQL Database"]:::database
    B1d --> D

    %% Frontend
    A --> C["💻 Frontend (React + Tailwind)"]:::frontend
    C --> C1["src/"]:::frontend
    C1 --> C1a["App.js / index.js<br/>→ inicialização e roteamento"]
    C1 --> C1b["pages/"]:::frontend
    C1b --> C1b1["HomePage.js<br/>AuthorsPage.js<br/>EventsPage.js<br/>..."]
    C1b --> C1b2["AdminPanel.js<br/>AdminDashboard.js<br/>UserSettingsPage.js"]
    C1 --> C1c["components/"]:::frontend
    C1c --> C1c1["common/<br/>AuthContext, Navigation, Spinner"]
    C1c --> C1c2["cards/<br/>ArticleCard, EventCard, EditionCard"]
    C1 --> C1d["hooks/useApi.js<br/>→ comunicação com backend"]
    C1 --> C1e["utils/api.js<br/>→ endpoints centralizados"]
    C1 --> C1f["assets/<br/>logos, fontes, imagens"]
    C --> C2["public/<br/>manifest.json, favicon, index.html"]
    C --> C3["tailwind.config.js / package.json / README.md"]

    %% Integração e Infraestrutura
    A --> E["🧱 Infraestrutura / Docker Compose"]:::shared
    E --> B
    E --> D
    E --> C

    %% Relacionamentos externos
    B -.-> C1d
    C1d -. "requisições REST" .-> B1a
