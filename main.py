import argparse
import random
import time
import os
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

# Carrega as chaves do arquivo .env
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

# ===== CONFIGURAÇÕES =====
NUMERO = "553599999999" # Substitua pelo número da sua namorada (com código do país)
HORARIO_INICIO = "05:50"
HORARIO_FIM = "06:30"

def gerar_mensagem():
    """Gera uma mensagem carinhosa usando a IA do Gemini."""
    toques_unicos = ["café", "sol", "sorriso", "amor", "dia", "beijo", "abraço", "risada", "olhos", "coração"]
    toque = random.choice(toques_unicos)
    prompt = f"Gere uma mensagem de bom dia carinhosa para minha namorada em português com até 20 palavras e com um versículo da bíblia protestante que se relate à gentileza, amor ou beleza. Adicione um toque único com referência a '{toque}'."
    
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash", # Versão rápida e atualizada
            contents=prompt,
            config={"temperature": 0.9}
        )
        return response.text.strip()
    except Exception as e:
        print(f"Erro ao chamar Gemini: {e}")
        return "Bom dia, meu amor! Que seu dia seja abençoado por Deus. Te amo! ❤️"

def gerar_proximo_horario():
    """Calcula um horário aleatório dentro da janela configurada."""
    agora = datetime.now()
    inicio = datetime.strptime(HORARIO_INICIO, "%H:%M").replace(year=agora.year, month=agora.month, day=agora.day)
    fim = datetime.strptime(HORARIO_FIM, "%H:%M").replace(year=agora.year, month=agora.month, day=agora.day)

    # Se já passou do horário de hoje, agenda para amanhã
    if agora > fim:
        inicio += timedelta(days=1)
        fim += timedelta(days=1)

    segundos_janela = int((fim - inicio).total_seconds())
    segundos_aleatorios = random.randint(0, segundos_janela)
    return inicio + timedelta(seconds=segundos_aleatorios)

def setup_driver():
    """Configura o Chrome Headless com camuflagem para TV Box."""
    options = Options()
    diretorio_atual = os.path.dirname(os.path.abspath(__file__))
    caminho_perfil = os.path.join(diretorio_atual, "chrome-data")
    
    options.add_argument(f"--user-data-dir={caminho_perfil}")
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    
    service = Service('/usr/bin/chromedriver')
    driver = webdriver.Chrome(service=service, options=options)
    
    # Esconde flag de automação
    driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
        'source': "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    })
    return driver

def enviar_whatsapp(driver, mensagem):
    """Executa a lógica de abrir o chat e enviar a mensagem."""
    url = f"https://web.whatsapp.com/send?phone={NUMERO}"
    print(f"[LOG] Abrindo conversa...")
    driver.get(url)
    
    # Espera inicial para o sistema ARM processar o carregamento
    time.sleep(20)
    
    try:
        # Espera inteligente pela caixa de texto (até 60s)
        campo = WebDriverWait(driver, 60).until(
            EC.presence_of_element_located((By.XPATH, '//*[@id="main"]//div[@contenteditable="true"]'))
        )
        
        print("[LOG] Digitando mensagem...")
        campo.click()
        time.sleep(1)
        campo.send_keys(mensagem)
        time.sleep(2)
        
        print("[LOG] Enviando...")
        try:
            # Tenta o botão físico primeiro
            botao = driver.find_element(By.XPATH, '//*[@data-icon="send"]')
            botao.click()
        except:
            # Plano B: Enter
            campo.send_keys(Keys.ENTER)
        
        print("[LOG] ✅ Comando enviado! Aguardando 30s para sincronização final...")
        time.sleep(30) # Tempo vital para TV Box enviar o pacote de dados antes de fechar
        
    except Exception as e:
        driver.save_screenshot("/tmp/erro_envio.png")
        print(f"[ERRO] Falha no processo: {e}")
        raise

def main(send_now=False):
    if send_now:
        print("🚀 Executando envio de teste imediato...")
        msg = gerar_mensagem()
        driver = setup_driver()
        try:
            enviar_whatsapp(driver, msg)
            print(f"✅ Teste concluído. Mensagem: {msg}")
        finally:
            driver.quit()
        return

    print("🤖 Bot Lauragenai ativado em modo contínuo.")
    while True:
        proximo = gerar_proximo_horario()
        print(f"⏰ Próximo envio programado: {proximo.strftime('%d/%m %H:%M')}")
        
        # Espera ociosa até o horário
        while datetime.now() < proximo:
            time.sleep(30) # Checa a cada 30 segundos
            
        print(f"🚀 Iniciando ciclo de envio: {datetime.now().strftime('%H:%M')}")
        
        msg = gerar_mensagem()
        driver = setup_driver()
        try:
            enviar_whatsapp(driver, msg)
            print("✅ Mensagem do dia enviada com sucesso!")
        except Exception as e:
            print(f"❌ Erro no ciclo de hoje: {e}")
        finally:
            driver.quit()
            
        # Espera 1 hora para evitar disparos duplicados na mesma janela e recalcular para amanhã
        print("💤 Ciclo finalizado. Recalculando próximo dia em breve...")
        time.sleep(3600)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--send-now", action="store_true")
    args = parser.parse_args()
    main(send_now=args.send_now)