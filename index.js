const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Carrega a chave da IA
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ===== CONFIGURAÇÕES DE DESTINO =====
const NUMERO_OFICIAL = "553598798472"; // O número da patroa (Ex: 5511999999999)
const NUMERO_TESTE   = "553597088134"; // O seu número para testes

const HORARIO_INICIO = "05:50";
const HORARIO_FIM    = "06:30";

// ===== ESTADO GLOBAL DO LOOP =====
// Guarda a mensagem e o horário já calculados entre reinicializações do client
let estadoLoop = null;

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
        console.error("❌ Erro ao gerar mensagem via Gemini:", error.message);
        return "Bom dia, meu amor! Que seu dia seja iluminado e cheio de bençãos. Te amo! ❤️";
    }
}

function gerarProximoHorario() {
    const agora = new Date();
    const [horaInicio, minInicio] = HORARIO_INICIO.split(':').map(Number);
    const [horaFim, minFim] = HORARIO_FIM.split(':').map(Number);

    let inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), horaInicio, minInicio, 0, 0);
    let fim    = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), horaFim, minFim, 0, 0);

    if (agora > fim) {
        inicio.setDate(inicio.getDate() + 1);
        fim.setDate(fim.getDate() + 1);
    }

    const diff = fim.getTime() - inicio.getTime();
    return new Date(inicio.getTime() + Math.floor(Math.random() * diff));
}

function criarClient() {
    return new Client({
        authStrategy: new LocalAuth(),
        authTimeoutMs: 90000,
        puppeteer: {
            executablePath: '/usr/bin/chromium-browser',
            pipe: true,
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
}

async function loopOficial(client) {
    // Se já havia um estado salvo (veio de um restart), reutiliza
    if (!estadoLoop) {
        estadoLoop = {
            proximo: gerarProximoHorario(),
            msg: await gerarMensagem(),
        };
        console.log(`\n💬 Mensagem gerada pelo Gemini:\n"${estadoLoop.msg}"\n`);
        console.log(`📅 PRÓXIMO ENVIO: ${estadoLoop.proximo.toLocaleString()}`);
    } else {
        console.log(`\n♻️  Retomando após restart...`);
        console.log(`📅 PRÓXIMO ENVIO: ${estadoLoop.proximo.toLocaleString()}`);
    }

    while (new Date() < estadoLoop.proximo) {
        const faltaMs = estadoLoop.proximo.getTime() - new Date().getTime();
        const horas   = Math.floor(faltaMs / (1000 * 60 * 60));
        const minutos = Math.floor((faltaMs % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((faltaMs % (1000 * 60)) / 1000);
        process.stdout.write(`\r⏳ Falta ${horas.toString().padStart(2,'0')}:${minutos.toString().padStart(2,'0')}:${segundos.toString().padStart(2,'0')}   `);
        await new Promise(resolve => setTimeout(resolve, 30000));
    }

    console.log("\n🚀 CHEGOU A HORA! Disparando para o número oficial...");
    const chatIdOficial = NUMERO_OFICIAL + "@c.us";
    try {
        await client.sendMessage(chatIdOficial, estadoLoop.msg);
        console.log("✅ MENSAGEM ENVIADA!");
    } catch (error) {
        console.error("❌ Erro ao enviar mensagem:", error.message);
    }

    // Limpa o estado para calcular o próximo dia
    estadoLoop = null;
    console.log("\n💤 Aguardando 1 hora para calcular o próximo envio...");
    await new Promise(resolve => setTimeout(resolve, 3600000));

    // Reinicia o loop para o próximo dia
    loopOficial(client);
}

async function iniciar() {
    console.log("🚀 Iniciando Bot Laurai (Node.js)...");

    const client = criarClient();

    client.on('qr', (qr) => {
        console.log("\n📱 Escaneie o QR Code abaixo para fazer login:");
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', async () => {
        console.log('✅ WhatsApp conectado!');

        // Envia ping de teste apenas na primeira inicialização (sem estado salvo)
        if (!estadoLoop) {
            const chatIdTeste = NUMERO_TESTE + "@c.us";
            const msgTeste = "🤖 [LAURAI] Bot iniciado e estabilizado! Aguardando horário da patroa.";
            try {
                await client.sendMessage(chatIdTeste, msgTeste);
                console.log("✅ Ping de teste enviado!");
            } catch (e) {
                console.error("❌ Erro no ping de teste:", e.message);
            }
        }

        loopOficial(client);
    });

    client.on('auth_failure', msg => {
        console.error('❌ Falha na autenticação:', msg);
    });

    client.on('disconnected', async (reason) => {
        console.warn(`\n⚠️ Desconectado: ${reason}. Reiniciando em 15s...`);
        try { await client.destroy(); } catch (_) {}
        setTimeout(iniciar, 15000);
    });

    // Captura crashes do Puppeteer (ProtocolError) e reinicia automaticamente
    process.removeAllListeners('uncaughtException');
    process.on('uncaughtException', async (err) => {
        if (err.name === 'ProtocolError' || err.message?.includes('Execution context')) {
            console.warn('\n⚠️ ProtocolError detectado. Reiniciando client em 15s...');
            try { await client.destroy(); } catch (_) {}
            setTimeout(iniciar, 15000);
        } else {
            console.error('❌ Erro inesperado:', err);
            process.exit(1);
        }
    });

    await client.initialize();
}

iniciar();
