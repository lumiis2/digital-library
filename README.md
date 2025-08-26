# digital-library

Uma biblioteca digital de artigos científicos desenvolvida como projeto da disciplina de Engenharia de Software. O objetivo é disponibilizar fácil acesso a artigos publicados em eventos científicos, inspirado em plataformas como ACM Digital Library, SBC OpenLib, arXiv.org e DBLP.

O sistema permite o gerenciamento de eventos científicos e suas edições, além do cadastro de artigos (manualmente ou em massa via BibTeX). Usuários poderão pesquisar artigos por título, autor ou evento, acessar páginas dedicadas para eventos, edições e autores, e receber notificações por e-mail sobre novos artigos.

## Integrantes
- Adler Faria  (Backend)
- Bruna Luiz  (Frontend)
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