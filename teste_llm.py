import google.genai as genai
import os
from dotenv import load_dotenv
import random

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

def gerar_mensagem_e_horario():
    toques_unicos = ["café", "sol", "sorriso", "amor", "dia", "beijo", "abraço", "risada", "olhos", "coração"]
    toque = random.choice(toques_unicos)
    prompt = f"Gere uma mensagem de bom dia carinhosa para minha namorada em português com até 20 palavras e com um versículo da bíblia protestante que se relate à gentileza, amor ou beleza, e sugira um horário entre 05:50 e 06:30 para enviá-la, tudo aleatóriamente. Adicione um toque único com referência a '{toque}'. Formate sua resposta exatamente como: Horário: HH:MM\nMensagem: [a mensagem]"
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    content = response.text.strip()
    
    print("Resposta do LLM:")
    print(content)
    
    lines = content.split('\n')
    
    horario_str = lines[0].split(': ')[1]
    mensagem = lines[1].split(': ')[1]
    
    print(f"Horário gerado: {horario_str}")
    print(f"Mensagem gerada: {mensagem}")
    
    return horario_str, mensagem

if __name__ == "__main__":
    gerar_mensagem_e_horario()