# 💘 Love-API - Bot de Bom Dia Automático para a Namorada (IA + WhatsApp)

Um bot automatizado e inteligente feito para garantir que sua namorada acorde todos os dias com uma mensagem de bom dia exclusiva, carinhosa e baseada na Bíblia. O bot utiliza **whatsapp-web.js** (Node.js) para controlar o WhatsApp Web em modo invisível (headless) e a IA **Google Gemini** para redigir os textos.

Ideal para rodar em dispositivos de baixo consumo (como TV Boxes com Armbian, Raspberry Pi ou servidores Linux) para que ela receba o carinho mesmo quando você ainda estiver dormindo.

## ✨ Funcionalidades

- 🤖 **Mensagens Únicas com Gemini 2.5** - Gera textos românticos de até 20 palavras com versículos bíblicos sobre amor e gentileza.
- ⏰ **Janela de Horário Humana** - O bot escolhe um horário aleatório entre **05:50 e 06:30** para enviar a mensagem, evitando padrões robóticos.
- 🎲 **Toques Personalizados** - A cada dia, a IA insere uma referência aleatória (café, sorriso, abraço, beijo) para variar o conteúdo.
- 💾 **Sessão Persistente** - Salva o login na pasta `.wwebjs_auth/`, para que você só precise escanear o QR Code no terminal uma única vez.
- 🚀 **Disparo de Teste** - Envia um ping para o seu próprio número toda vez que iniciar, confirmando que está online e estabilizado.

## 📋 Pré-requisitos

- **Node.js 18+** e **npm** instalados.
- **Chromium Browser** instalado no sistema (essencial para Linux/Armbian headless).
- **Chave de API do Google Gemini** (Versão 2.5 Flash).

## 🚀 Instalação (Linux/Armbian)

### 1. Instalar dependências do sistema
```bash
sudo apt update
sudo apt install nodejs npm chromium-browser -y
```

### 2. Clonar e instalar pacotes do bot
```bash
git clone https://github.com/JpCobraC/love-api.git
cd love-api
npm install
```

### 3. Configurar Variáveis
Renomeie ou crie um arquivo `.env` na raiz do projeto com a sua chave:
```env
GEMINI_API_KEY="SUA_CHAVE_AQUI"
```

No arquivo `index.js`, modifique as constantes para incluir os números corretos:
```javascript
const NUMERO_OFICIAL = "55XXXXXXXXXXX"; // O número da patroa
const NUMERO_TESTE   = "55XXXXXXXXXXX"; // O seu número
```

### 4. Rodar o Bot
```bash
npm start
```

Na primeira execução, o bot mostrará um **QR Code diretamente no terminal**. Escaneie-o com o WhatsApp para conectar a sessão. Depois disso, a sessão ficará salva.