import random
import time
import urllib.parse
from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import google.genai as genai
import os
from dotenv import load_dotenv

from webdriver_manager.chrome import ChromeDriverManager

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

# ===== TESTE =====
MODO_TESTE = False  # True = envia agora, False = usa horário aleatório
HORARIO_TESTE = "00:17"  # HH:MM - usado quando MODO_TESTE = True

# ===== CONFIG =====
NUMERO = "553599999999"  # Coloque o número com DDD, sem espaços ou traços
HORARIO_INICIO = "05:50"  # Início da janela aleatória de envio
HORARIO_FIM = "06:30"  # Fim da janela aleatória de envio

# ===== FUNÇÃO GERAR MENSAGEM E HORÁRIO VIA LLM =====
def gerar_mensagem_e_horario():
    toques_unicos = ["café", "sol", "sorriso", "amor", "dia", "beijo", "abraço", "risada", "olhos", "coração"]
    toque = random.choice(toques_unicos)
    prompt = f"Gere uma mensagem de bom dia carinhosa para minha namorada em português com até 20 palavras e com um versículo da bíblia protestante que se relate à gentileza, amor ou beleza, e sugira um horário entre 05:50 e 06:30 para enviá-la, tudo aleatóriamente. Adicione um toque único com referência a '{toque}'. Formate sua resposta exatamente como: Horário: HH:MM\nMensagem: [a mensagem]"
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    content = response.text.strip()
    
    lines = content.split('\n')
    
    horario_str = lines[0].split(': ')[1]
    mensagem = lines[1].split(': ')[1]
    
    return horario_str, mensagem

# ===== FUNÇÃO HORÁRIO ALEATÓRIO =====
def gerar_horario():
    agora = datetime.now()
    inicio = datetime.strptime(HORARIO_INICIO, "%H:%M").replace(year=agora.year, month=agora.month, day=agora.day)
    fim = datetime.strptime(HORARIO_FIM, "%H:%M").replace(year=agora.year, month=agora.month, day=agora.day)

    if inicio >= fim:
        raise ValueError("HORARIO_INICIO deve ser menor que HORARIO_FIM")

    if agora > fim:
        inicio += timedelta(days=1)
        fim += timedelta(days=1)

    segundos = random.randint(0, int((fim - inicio).total_seconds()))
    return inicio + timedelta(seconds=segundos)

# ===== CONFIG CHROME (SALVA SESSÃO) =====
options = Options()
options.add_argument("--user-data-dir=/home/jpcob/github/laurai/chrome-data")
from selenium.webdriver.chrome.service import Service

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)
driver.get("https://web.whatsapp.com")

input("Escaneie o QR UMA VEZ e pressione Enter...")

print("✅ Sessão salva! Agora vai automático todo dia.")

# ===== LOOP DIÁRIO =====
while True:
    if MODO_TESTE:
        # Modo teste: usa horário fixo definido em HORARIO_TESTE
        partes = HORARIO_TESTE.split(":")
        hora = int(partes[0])
        minuto = int(partes[1])
        
        agora = datetime.now()
        horario = agora.replace(hour=hora, minute=minuto, second=0, microsecond=0)
        
        # Se o horário já passou hoje, agenda para amanhã
        if horario <= agora:
            horario += timedelta(days=1)
    else:
        # Modo produção: usa LLM para gerar horário e mensagem
        horario_str, mensagem = gerar_mensagem_e_horario()
        partes = horario_str.split(":")
        hora = int(partes[0])
        minuto = int(partes[1])
        
        agora = datetime.now()
        horario = agora.replace(hour=hora, minute=minuto, second=0, microsecond=0)
        
        # Se o horário já passou hoje, agenda para amanhã
        if horario <= agora:
            horario += timedelta(days=1)

    print(f"⏰ Próxima mensagem: {horario.strftime('%H:%M')}")

    espera = (horario - datetime.now()).total_seconds()
    if espera > 0:
        time.sleep(espera)

    try:
        driver.get(f"https://web.whatsapp.com/send?phone={NUMERO}&text={mensagem}")
        time.sleep(10)

        caixa = driver.find_element(By.XPATH, '//div[@contenteditable="true"]')
        caixa.send_keys(Keys.ENTER)

        print("✅ Mensagem enviada!")
    except Exception as e:
        print("❌ Erro:", e)

    # espera até o próximo dia
    time.sleep(60 * 60 * 20)