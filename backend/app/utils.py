import hashlib
import unicodedata
import re
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
import os
from dotenv import load_dotenv

load_dotenv()

def sha256(s: str) -> str:
    """Calcula o hash SHA-256 de uma string"""
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def generate_slug(text: str) -> str:
    """Gera um slug amigável a partir de um texto"""
    # Normalizar unicode e remover acentos
    text = unicodedata.normalize('NFD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    
    # Converter para minúsculo
    text = text.lower()
    
    # Substituir espaços e caracteres especiais por hífens
    text = re.sub(r'[^a-z0-9]+', '-', text)
    
    # Remover hífens no início e fim
    text = text.strip('-')
    
    # Aumentar limite de tamanho para 100 caracteres
    text = text[:100]
    
    return text

async def send_notification_email(to_email: str, author_name: str, article_title: str, event_name: str):
    """Função para enviar email de notificação"""
    try:
        msg = MIMEMultipart()
        msg['From'] = os.getenv("EMAIL_FROM")
        msg['To'] = to_email
        msg['Subject'] = f"Novo artigo publicado - {article_title}"
        
        body = f"""
        Olá {author_name},
        
        Temos o prazer de informar que um novo artigo de sua autoria foi publicado em nossa biblioteca digital:
        
        Título: {article_title}
        Evento: {event_name}
        
        Você pode visualizar o artigo acessando nossa plataforma.
        
        Atenciosamente,
        Equipe da Biblioteca Digital
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Configurar servidor SMTP
        server = smtplib.SMTP(os.getenv("SMTP_SERVER", "smtp.gmail.com"), 
                             int(os.getenv("SMTP_PORT", "587")))
        server.starttls()
        server.login(os.getenv("EMAIL_FROM"), os.getenv("EMAIL_PASSWORD"))
        text = msg.as_string()
        server.sendmail(os.getenv("EMAIL_FROM"), to_email, text)
        server.quit()
        return True
    except Exception as e:
        print(f"Erro ao enviar email: {e}")
        return False
