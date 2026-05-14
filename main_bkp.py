import argparse
import random
import time
import urllib.parse
import os
import sys
from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import google.genai as genai
from dotenv import load_dotenv

# Carrega a chave da IA
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

# ===== CONFIGURAÇÕES DE DESTINO =====
NUMERO_OFICIAL = "55XXXXXXXXXXX"  # O número da patroa
NUMERO_TESTE   = "55XXXXXXXXXXX"  # COLOQUE SEU NÚMERO AQUI (Para receber o aviso de que o bot ligou)

HORARIO_INICIO = "05:50"
HORARIO_FIM = "06:30"

def gerar_mensagem():
    toques_unicos = ["café", "sol", "sorriso", "amor", "dia", "beijo", "abraço", "risada", "olhos", "coração"]
    toque = random.choice(toques_unicos)
    prompt = f"Gere uma mensagem de bom dia carinhosa para minha namorada em português com até 20 palavras e com um versículo da bíblia protestante que se relate à gentileza, amor ou beleza. Adicione um toque único com referência a '{toque}'."
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={"temperature": 0.9}
        )
        return response.text.strip()
    except:
        return "Bom dia, meu amor! Que seu dia seja iluminado e cheio de bençãos. Te amo! ❤️"

def gerar_proximo_horario():
    agora = datetime.now()
    inicio = datetime.strptime(HORARIO_INICIO, "%H:%M").replace(year=agora.year, month=agora.month, day=agora.day)
    fim = datetime.strptime(HORARIO_FIM, "%H:%M").replace(year=agora.year, month=agora.month, day=agora.day)
    if agora > fim:
        inicio += timedelta(days=1)
        fim += timedelta(days=1)
    segundos = random.randint(0, int((fim - inicio).total_seconds()))
    return inicio + timedelta(seconds=segundos)

def setup_driver():
    options = Options()
    diretorio_atual = os.path.dirname(os.path.abspath(__file__))
    caminho_perfil = os.path.join(diretorio_atual, "chrome-data")
    options.add_argument(f"--user-data-dir={caminho_perfil}")
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
    service = Service('/usr/bin/chromedriver')
    return webdriver.Chrome(service=service, options=options)

# Agora a função recebe o 'numero' de quem vai receber a mensagem
def enviar_whatsapp(driver, numero, mensagem):
    texto_formatado = urllib.parse.quote(mensagem)
    url = f"https://web.whatsapp.com/send?phone={numero}&text={texto_formatado}"
    print(f"\n[LOG] Navegando para o chat do número {numero}...")
    driver.get(url)
    
    print("[LOG] Aguardando carregamento do chat...")
    try:
        caixa = WebDriverWait(driver, 120).until(
            EC.presence_of_element_located((By.XPATH, '//div[@contenteditable="true"]'))
        )
        time.sleep(3)
        caixa.send_keys(Keys.ENTER)
        print("✅ MENSAGEM ENVIADA!")
        time.sleep(15) # Espera o check de envio subir antes de qualquer outra coisa
    except Exception as e:
        print(f"❌ Erro ao enviar: {e}")

# ===== LOOP PERPÉTUO =====
def main():
    print("🚀 Iniciando Bot Lauragenai...")
    driver = setup_driver()
    
    try:
        print("🌐 Abrindo WhatsApp Web...")
        driver.get("https://web.whatsapp.com")
        
        print("⏳ AGUARDANDO 10 MINUTOS PARA SINCRONIZAÇÃO TOTAL (Não feche)...")
        # 10 minutos = 600 segundos
        for i in range(10, 0, -1):
            print(f"🕒 Faltam {i} minutos para estabilizar...")
            time.sleep(60)

        # ===== DISPARO DE TESTE =====
        print("\n✅ Sistema estabilizado! Enviando sinal de vida para o seu número...")
        msg_teste = "🤖 [SISTEMA] O bot foi iniciado com sucesso, passou pela sincronização e está rodando 100% liso na TV Box! Aguardando o horário oficial da patroa."
        enviar_whatsapp(driver, NUMERO_TESTE, msg_teste)
        
        print("\n✅ Tudo pronto e testado! Entrando em modo de vigília oficial.")

        # ===== LOOP OFICIAL (DIÁRIO) =====
        while True:
            proximo = gerar_proximo_horario()
            msg = gerar_mensagem()
            
            print(f"\n📅 PRÓXIMO ENVIO AGENDADO PARA A PATROA: {proximo.strftime('%d/%m %H:%M')}")
            
            while datetime.now() < proximo:
                falta = proximo - datetime.now()
                sys.stdout.write(f"\r⏳ Status: Navegador aberto e aguardando... Falta {str(falta).split('.')[0]}   ")
                sys.stdout.flush()
                time.sleep(30) # Checa o relógio a cada 30 segundos

            print("\n🚀 CHEGOU A HORA! Iniciando disparo para o número oficial...")
            enviar_whatsapp(driver, NUMERO_OFICIAL, msg)
            
            print("\n💤 Mensagem enviada. Aguardando 1 hora antes de calcular o próximo dia...")
            time.sleep(3600)

    except KeyboardInterrupt:
        print("\n🛑 Parada manual (Ctrl+C). Fechando...")
        driver.quit()

if __name__ == "__main__":
    main()