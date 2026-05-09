import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

print("Abrindo o navegador para você escanear o QR Code...")

options = Options()
options.add_argument("--user-data-dir=./chrome-data")

# ATENÇÃO: Aqui não tem modo headless, o Chrome vai abrir na sua tela!

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)

driver.get("https://web.whatsapp.com")

input("✅ Pressione ENTER aqui neste terminal SOMENTE APÓS escanear o QR Code com o celular e suas conversas aparecerem na tela... ")

print("Sessão salva com sucesso! O Chrome-data está atualizado.")
driver.quit()
