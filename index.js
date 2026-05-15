const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pino = require('pino');
require('dotenv').config();

// Carrega a chave da IA
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// ===== CONFIGURAÇÕES =====
const NUMERO_OFICIAL = '553598798472'; // Número da patroa
const NUMERO_TESTE   = '553597088134'; // Seu número
const HORARIO_INICIO = '05:50';
const HORARIO_FIM    = '06:30';
const AUTH_FOLDER    = './baileys_auth';

// ===== ESTADO GLOBAL =====
let estadoLoop = null;

async function gerarMensagem() {
    const toques = ['café', 'sol', 'sorriso', 'amor', 'dia', 'beijo', 'abraço', 'risada', 'olhos', 'coração'];
    const toque  = toques[Math.floor(Math.random() * toques.length)];
    const prompt = `Gere uma mensagem de bom dia carinhosa para minha namorada em português com até 20 palavras e com um versículo da bíblia protestante que se relate à gentileza, amor ou beleza. Adicione um toque único com referência a '${toque}'.`;

    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.9 }
        });
        return result.response.text().trim();
    } catch (err) {
        console.error('❌ Erro no Gemini:', err.message);
        return 'Bom dia, meu amor! Que seu dia seja iluminado e cheio de bençãos. Te amo! ❤️';
    }
}

function gerarProximoHorario() {
    const agora = new Date();
    const [hi, mi] = HORARIO_INICIO.split(':').map(Number);
    const [hf, mf] = HORARIO_FIM.split(':').map(Number);

    let inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), hi, mi, 0, 0);
    let fim    = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), hf, mf, 0, 0);

    if (agora > fim) {
        inicio.setDate(inicio.getDate() + 1);
        fim.setDate(fim.getDate() + 1);
    }

    const diff = fim.getTime() - inicio.getTime();
    return new Date(inicio.getTime() + Math.floor(Math.random() * diff));
}

async function loopOficial(sock) {
    if (!estadoLoop) {
        estadoLoop = {
            proximo: gerarProximoHorario(),
            msg:     await gerarMensagem(),
        };
        console.log(`\n💬 Mensagem gerada pelo Gemini:\n"${estadoLoop.msg}"\n`);
        console.log(`📅 PRÓXIMO ENVIO: ${estadoLoop.proximo.toLocaleString()}`);
    } else {
        console.log(`\n♻️  Retomando após reconexão...`);
        console.log(`📅 PRÓXIMO ENVIO: ${estadoLoop.proximo.toLocaleString()}`);
    }

    while (new Date() < estadoLoop.proximo) {
        const faltaMs  = estadoLoop.proximo.getTime() - new Date().getTime();
        const horas    = Math.floor(faltaMs / 3600000);
        const minutos  = Math.floor((faltaMs % 3600000) / 60000);
        const segundos = Math.floor((faltaMs % 60000) / 1000);
        process.stdout.write(`\r⏳ Falta ${String(horas).padStart(2,'0')}:${String(minutos).padStart(2,'0')}:${String(segundos).padStart(2,'0')}   `);
        await new Promise(r => setTimeout(r, 30000));
    }

    console.log('\n🚀 CHEGOU A HORA! Disparando mensagem...');
    try {
        await sock.sendMessage(`${NUMERO_OFICIAL}@s.whatsapp.net`, { text: estadoLoop.msg });
        console.log('✅ MENSAGEM ENVIADA!');
    } catch (err) {
        console.error('❌ Erro ao enviar:', err.message);
    }

    estadoLoop = null;
    console.log('\n💤 Aguardando 1 hora para calcular o próximo envio...');
    await new Promise(r => setTimeout(r, 3600000));
    loopOficial(sock);
}

async function iniciar() {
    console.log('🚀 Iniciando Bot Laurai (Baileys)...');

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: Browsers.windows('Chrome'),
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
        defaultQueryTimeoutMs: undefined,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            console.log('\n📱 Escaneie o QR Code para fazer login:');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'open') {
            console.log('✅ WhatsApp conectado!');

            if (!estadoLoop) {
                const msgTeste = '🤖 [LAURAI] Bot iniciado com Baileys! Sem Chromium, leve e estável. Aguardando horário da patroa.';
                try {
                    await sock.sendMessage(`${NUMERO_TESTE}@s.whatsapp.net`, { text: msgTeste });
                    console.log('✅ Ping de teste enviado!');
                } catch (e) {
                    console.error('❌ Erro no ping:', e.message);
                }
            }

            loopOficial(sock);
        }

        if (connection === 'close') {
            const codigo = lastDisconnect?.error?.output?.statusCode;
            const deveReconectar = codigo !== DisconnectReason.loggedOut;
            console.warn(`\n⚠️ Conexão encerrada (código ${codigo}).`);

            if (deveReconectar) {
                console.log('Reconectando em 10s...');
                setTimeout(iniciar, 10000);
            } else {
                console.log('🗑️ Sessão expirada (LOGOUT). Removendo e pedindo QR novo em 10s...');
                const fs = require('fs');
                try { fs.rmSync(AUTH_FOLDER, { recursive: true, force: true }); } catch (_) {}
                setTimeout(iniciar, 10000);
            }
        }
    });
}

iniciar();
