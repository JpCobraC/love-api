const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Carrega a chave da IA
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ===== CONFIGURAÇÕES DE DESTINO =====
const NUMERO_OFICIAL = "553598798472"; // O número da patroa (Ex: 5511999999999)
const NUMERO_TESTE = "553597088134"; // O seu número para testes

const HORARIO_INICIO = "05:50";
const HORARIO_FIM = "06:30";

async function gerarMensagem() {
    const toques_unicos = ["café", "sol", "sorriso", "amor", "dia", "beijo", "abraço", "risada", "olhos", "coração"];
    const toque = toques_unicos[Math.floor(Math.random() * toques_unicos.length)];
    const prompt = `Gere uma mensagem de bom dia carinhosa para minha namorada em português com até 20 palavras e com um versículo da bíblia protestante que se relate à gentileza, amor ou beleza. Adicione um toque único com referência a '${toque}'.`;

    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.9 }
        });
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("❌ Erro ao gerar mensagem via Gemini:", error);
        return "Bom dia, meu amor! Que seu dia seja iluminado e cheio de bençãos. Te amo! ❤️";
    }
}

function gerarProximoHorario() {
    const agora = new Date();

    const [horaInicio, minInicio] = HORARIO_INICIO.split(':').map(Number);
    const [horaFim, minFim] = HORARIO_FIM.split(':').map(Number);

    let inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), horaInicio, minInicio, 0, 0);
    let fim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), horaFim, minFim, 0, 0);

    if (agora > fim) {
        inicio.setDate(inicio.getDate() + 1);
        fim.setDate(fim.getDate() + 1);
    }

    const diffEmMilissegundos = fim.getTime() - inicio.getTime();
    const milissegundosAleatorios = Math.floor(Math.random() * diffEmMilissegundos);

    return new Date(inicio.getTime() + milissegundosAleatorios);
}

console.log("🚀 Iniciando Bot Laurai (Node.js)...");

// Inicialização do Client do whatsapp-web.js
// Usamos LocalAuth para persistir a sessão na pasta .wwebjs_auth
const client = new Client({
    authStrategy: new LocalAuth(),
    authTimeoutMs: 60000,
    puppeteer: {
        executablePath: '/usr/bin/chromium-browser',
        pipe: true, // Usa pipe em vez de WebSocket CDP (mais estável com Chromium 100+)
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
        ]
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    }
});

client.on('qr', (qr) => {
    console.log("\n📱 Escaneie o QR Code abaixo para fazer login:");
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('✅ Sistema do WhatsApp conectado e estabilizado!');

    // Disparo de teste
    console.log("Enviando sinal de vida para o número de teste...");
    const chatIdTeste = NUMERO_TESTE + "@c.us";
    const msgTeste = "🤖 [SISTEMA] O bot Node.js foi iniciado com sucesso, sincronizou a sessão e está rodando 100% liso na TV Box! Aguardando o horário oficial da patroa.";

    try {
        await client.sendMessage(chatIdTeste, msgTeste);
        console.log("✅ Mensagem de teste enviada!");
    } catch (error) {
        console.error("❌ Erro ao enviar mensagem de teste:", error);
    }

    console.log("\n✅ Tudo pronto e testado! Entrando em modo de vigília oficial.");

    loopOficial();
});

client.on('auth_failure', msg => {
    console.error('❌ Falha na autenticação', msg);
});

async function loopOficial() {
    while (true) {
        const proximo = gerarProximoHorario();
        const msg = await gerarMensagem();

        console.log(`\n📅 PRÓXIMO ENVIO AGENDADO PARA A PATROA: ${proximo.toLocaleString()}`);

        while (new Date() < proximo) {
            const faltaMs = proximo.getTime() - new Date().getTime();

            // Calcula o tempo restante formato HH:MM:SS
            const horas = Math.floor(faltaMs / (1000 * 60 * 60));
            const minutos = Math.floor((faltaMs % (1000 * 60 * 60)) / (1000 * 60));
            const segundos = Math.floor((faltaMs % (1000 * 60)) / 1000);

            process.stdout.write(`\r⏳ Status: Aguardando... Falta ${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}   `);

            // Espera 30 segundos
            await new Promise(resolve => setTimeout(resolve, 30000));
        }

        console.log("\n🚀 CHEGOU A HORA! Iniciando disparo para o número oficial...");
        const chatIdOficial = NUMERO_OFICIAL + "@c.us";
        try {
            await client.sendMessage(chatIdOficial, msg);
            console.log("✅ MENSAGEM ENVIADA!");
        } catch (error) {
            console.error("❌ Erro ao enviar a mensagem oficial:", error);
        }

        console.log("\n💤 Mensagem enviada. Aguardando 1 hora antes de calcular o próximo dia...");
        await new Promise(resolve => setTimeout(resolve, 3600000)); // 1 hora
    }
}

client.initialize();
