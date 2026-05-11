import time
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

print("Abrindo o navegador para você escanear o QR Code...")

options = Options()
options.add_argument("--user-data-dir=./chrome-data")

# ATENÇÃO: Aqui não tem modo headless, o Chrome vai abrir na sua tela!

# Tenta usar o chromedriver nativo do Armbian, senão procura no PATH
chromedriver_path = "/usr/bin/chromedriver" if os.path.exists("/usr/bin/chromedriver") else "chromedriver"

service = Service(chromedriver_path)
driver = webdriver.Chrome(service=service, options=options)

driver.get("https://web.whatsapp.com")

input("✅ Pressione ENTER aqui neste terminal SOMENTE APÓS escanear o QR Code com o celular e suas conversas aparecerem na tela... ")

print("Sessão salva com sucesso! O Chrome-data está atualizado.")
driver.quit()
