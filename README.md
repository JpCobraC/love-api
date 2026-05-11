# 💘 Love-API - Bot de Bom Dia Automático para a Namorada (IA + WhatsApp)

Um bot automatizado e inteligente feito para garantir que sua namorada acorde todos os dias com uma mensagem de bom dia exclusiva, carinhosa e baseada na Bíblia. O bot utiliza **Selenium** para controlar o WhatsApp Web e a IA **Google Gemini** para redigir os textos.

Ideal para rodar em dispositivos de baixo consumo (como TV Boxes com Armbian, Raspberry Pi ou servidores Linux) para que ela receba o carinho mesmo quando você ainda estiver dormindo.

## ✨ Funcionalidades

- 🤖 **Mensagens Únicas com Gemini 2.5** - Gera textos românticos de até 20 palavras com versículos bíblicos sobre amor e gentileza.
- ⏰ **Janela de Horário Humana** - O bot escolhe um horário aleatório entre **05:50 e 06:30** para enviar a mensagem, evitando padrões robóticos.
- 🎲 **Toques Personalizados** - A cada dia, a IA insere uma referência aleatória (café, sorriso, abraço, beijo) para variar o conteúdo.
- 🕵️‍♂️ **Camuflagem Anti-Bot** - Configurações de User-Agent e desativação de flags de automação para evitar bloqueios do WhatsApp.
- 💾 **Sessão Persistente** - Salva o login na pasta `chrome-data/`, para que você só precise escanear o QR Code uma única vez.
- 🚀 **Modo de Teste Imediato** - Use uma flag para testar o envio na hora sem esperar o horário agendado.

## 📋 Pré-requisitos

- **Python 3.10+**
- **Chromium Browser** e **Chromium-driver** instalados no sistema (essencial para Linux/Armbian).
- **Chave de API do Google Gemini** (Versão 2.5 Flash).

## 🚀 Instalação (Linux/Armbian)

### 1. Instalar dependências do sistema
```bash
sudo apt update
sudo apt install chromium chromium-driver -y