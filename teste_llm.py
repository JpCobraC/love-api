import google.genai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

def gerar_mensagem_e_horario():
    prompt = "Gere uma mensagem de bom dia carinhosa para minha namorada em português, e sugira um horário aleatório entre 07:00 e 08:00 para enviá-la. Formate sua resposta exatamente como: Horário: HH:MM\nMensagem: [a mensagem]"
    
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