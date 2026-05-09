import google.genai as genai
import os
from dotenv import load_dotenv
import random

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

def gerar_mensagem():
    toques_unicos = ["café", "sol", "sorriso", "amor", "dia", "beijo", "abraço", "risada", "olhos", "coração"]
    toque = random.choice(toques_unicos)
    prompt = f"Gere uma mensagem de bom dia carinhosa para minha namorada em português com até 20 palavras e com um versículo da bíblia protestante que se relate à gentileza, amor ou beleza. Adicione um toque único com referência a '{toque}'."
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config={"temperature": 0.9}
    )
    mensagem = response.text.strip()
    
    print("Mensagem gerada:")
    print(mensagem)
    
    return mensagem

if __name__ == "__main__":
    gerar_mensagem()