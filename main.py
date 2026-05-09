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

# ===== TESTE =====
MODO_TESTE = False  # True = envia agora, False = usa horário aleatório
HORARIO_TESTE = "00:17"  # HH:MM - usado quando MODO_TESTE = True

# ===== CONFIG =====
NUMERO = "553599999999"  # Coloque o número com DDD, sem espaços ou traços
HORARIO_INICIO = "07:00"  # Início da janela aleatória de envio
HORARIO_FIM = "08:00"  # Fim da janela aleatória de envio

mensagens = [
    f"Bom dia, minha princesa ❤️ Dormiu bem?",
    f"Bom diaaa, minha linda. Acordei pensando em você",
    f"Bom dia, Que seu dia seja leve e abençoado! Te amo",
    f"Bom dia, princesa 💖",
    f"Bom dia, linda! Que Jesus abençoe seu dia e te proteja sempre",
    f"Bom dia, minha vida! ❤️",
    f"Bom dia, meu amor. Acordei com saudade!",
    f"Bom dia, minha princesinha. Te amo!",
    f"Bom dia, minha linda! Tenha um dia incrível",
    f"Bom dia, amor. Já tô pensando em você!",
    f"Bom diaaa, coisa linda! 💖",
    f"Bom dia, linda! Que seu dia seja abençoado",
    f"Bom dia, meu anjo! Te amo muito",
    f"Bom dia, meu tudo! ❤️",
    f"Bom dia, princesa. Dormiu bem? Sonhou comigo? kkkkkk",
    f"Bom dia, amor. Você é meu primeiro pensamento do dia",
    f"Bom diaaa! Que seu dia seja leve, igual a você",
    f"Bom dia, minha vida.",
    f"Bom dia, gatinha. Já estou com saudade!",
    f"Bom dia, razão do meu sorriso! 😍",
    f"Bom dia, linda. Que Deus ilumine cada passo seu"
]
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
options.add_argument(r"--user-data-dir=C:\chrome-data")
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
        # Modo produção: horário aleatório entre 7h e 8h
        horario = gerar_horario()

    mensagem = random.choice(mensagens)

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