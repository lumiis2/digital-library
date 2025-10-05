# digital-library

Uma biblioteca digital de artigos científicos desenvolvida como projeto da disciplina de Engenharia de Software. O objetivo é disponibilizar fácil acesso a artigos publicados em eventos científicos, inspirado em plataformas como ACM Digital Library, SBC OpenLib, arXiv.org e DBLP.

O sistema permite o gerenciamento de eventos científicos e suas edições, além do cadastro de artigos (manualmente ou em massa via BibTeX). Usuários poderão pesquisar artigos por título, autor ou evento, acessar páginas dedicadas para eventos, edições e autores, e receber notificações por e-mail sobre novos artigos.

## Integrantes
- Adler Faria  (Backend)
- Bruna Luiz  (FullStack)
- Luisa Lopes Carvalhaes  (FullStack)
- Rafael Paniago  (FullStack)

## Tecnologias
- **Linguagens**: Python, JavaScript/TypeScript, HTML, CSS
- **Frameworks**: FastAPI (backend), React + Vite (frontend)  
- **Banco de Dados**: PostgreSQL (via Docker)
- **Versionamento e colaboração**: GitHub  
- **Ferramenta de IA**: GitHub Copilot (modo agentic)  

## Arquitetura
- **Backend**: API REST bem definida, responsável por gerenciar eventos, edições e artigos, com persistência em banco de dados relacional.  
- **Frontend**: Aplicação web interativa, consumindo a API para exibir eventos, artigos e páginas personalizadas de autores.  

## Pré-requisitos e Instalação


### 1. Docker e Docker Compose
```bash
sudo apt update
sudo apt install docker.io -y
sudo systemctl enable --now docker
sudo apt install docker-compose -y

docker --version
docker-compose --version
``` 

### 2. PostgreSQL via Docker

```bash
cd infra
docker-compose up -d
# Banco disponível em:
# Host: localhost
# Porta: 5432
# Usuário: postgres
# Senha: postgres
# Banco: digital_library
```

### 3. Python 3.11+ (backend)

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

## ⚙️ Diagrama de Sequência
O diagrama de sequência abaixo representa o fluxo de inicialização e interação entre os componentes do sistema em ambiente Docker. O processo começa com o desenvolvedor executando o comando `docker-compose up`, o que faz com que o **Docker Engine** construa a imagem do Backend (FastAPI) e inicialize o container do **banco de dados PostgreSQL**, montando um volume persistente para armazenar os dados. Em seguida, o backend tenta estabelecer conexão com o banco de dados e, após a confirmação, executa os scripts de migração responsáveis por criar as tabelas necessárias. Com a estrutura do banco pronta, o backend passa a enviar e receber comandos SQL (como _INSERT_, _SELECT_ e _UPDATE_) para manipulação dos dados. Após a conexão ser bem-sucedida, o Docker exibe nos logs a mensagem de inicialização concluída, permitindo que o desenvolvedor acesse a API localmente via localhost:8000, com as requisições sendo processadas em tempo real pelo backend e refletidas no banco de dados.

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
````

## ⚙️ Diagrama de Pacotes

O diagrama de pacotes representa o funcionamento integrado da biblioteca a qual utiliza um banco de dados em uma infraestrutura containerizada via Docker Compose. O **Backend**, desenvolvido em FastAPI, é responsável por processar as requisições da API, conectar-se ao banco de dados PostgreSQL por meio do módulo `database.py` e executar operações de criação, leitura, atualização e exclusão de dados, utilizando modelos definidos em `models.py` e validações estruturadas em `schemas.py`. O **Frontend**, construído com React e estilizado com Tailwind CSS, fornece a interface gráfica com o usuário, onde páginas como `HomePage.js` e `AdminDashboard.js` consomem dados do backend através do hook `useApi.js` e dos endpoints centralizados em `api.js`. A comunicação entre o frontend e o backend ocorre via **requisições REST**, permitindo que o cliente acesse e manipule os dados em tempo real. Por fim, a **infraestrutura Docker Compose** integra todos esses componentes — backend, frontend e banco de dados — garantindo que sejam executados de forma coordenada, isolada e portátil, o que facilita tanto o desenvolvimento quanto a implantação do sistema.

```mermaid
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
```
