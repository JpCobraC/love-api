const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pino = require('pino');
require('dotenv').config();

// Carrega a chave da IA
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const hasGemini = Boolean(GEMINI_API_KEY);
// ===== CONFIGURAÇÕES =====
const NUMERO_OFICIAL = '553599999999'; // Número da patroa

// --- Ocultar logs chatos da libsignal (usada pelo Baileys) ---
const originalWarn = console.warn;
console.warn = function(...args) {
    if (typeof args[0] === 'string' && args[0].includes('Closing open session in favor of incoming prekey bundle')) return;
    originalWarn.apply(console, args);
};

const originalInfo = console.info;
console.info = function(...args) {
    if (typeof args[0] === 'string' && args[0].includes('Closing session:')) return;
    originalInfo.apply(console, args);
};
// -----------------------------------------------------------
const NUMERO_TESTE = '553599999999'; // Seu número
const HORARIO_INICIO = '05:50';
const HORARIO_FIM = '06:30';
const AUTH_FOLDER = './baileys_auth';

function gerarMensagemLocal(toque) {
    const textos = [
        `Bom dia, meu amor! Que o dia comece com um sorriso seu e com a bênção do ${toque}.`,
        `Que hoje o seu coração brilhe como o ${toque} e Deus abençoe cada momento do seu dia.`,
        `Hoje meu desejo é que o ${toque} ilumine seus passos e que você sinta todo o carinho que tenho por você.`,
        `Meu amor, que seu dia seja tão doce quanto ${toque} e tão cheio de paz quanto um versículo de amor.`,
        `Acorde com a certeza de que o ${toque} do nosso amor te acompanha e que Deus cuida de você.`,
        `Que o ${toque} inspire um dia repleto de carinho, fé e alegria. Te amo mais a cada amanhecer.`,
    ];
    return textos[Math.floor(Math.random() * textos.length)];
}

async function gerarMensagem() {
    const toques = ['café', 'sol', 'sorriso', 'amor', 'dia', 'beijo', 'abraço', 'risada', 'olhos', 'coração', 'estrela', 'lua', 'vento', 'flor', 'melodia', 'doce', 'luz', 'calor', 'brisa', 'alegria', 'paz', 'linda', 'maravilhosa', 'radiante', 'incrível', 'especial', 'única', 'maravilhosa', 'luminosa', 'encantadora', 'inspiradora', 'cativante', 'deslumbrante', 'magnífica', 'sublime', 'estonteante'];
    const toque = toques[Math.floor(Math.random() * toques.length)];
    const prompt = `Gere uma mensagem de bom dia carinhosa para minha namorada em português com até 20 palavras e com um versículo da bíblia protestante que se relate à gentileza, amor ou beleza. Adicione um toque único com referência a '${toque}'.`;

    if (!hasGemini) {
        console.warn('⚠️ GEMINI_API_KEY não configurada. Usando fallback local de mensagem.');
        return gerarMensagemLocal(toque);
    }

    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.9 }
        });
        return result.response.text().trim();
    } catch (err) {
        console.error('❌ Erro no Gemini:', err.message);
        return gerarMensagemLocal(toque);
    }
}

function gerarProximoHorario() {
    const agora = new Date();
    const [hi, mi] = HORARIO_INICIO.split(':').map(Number);
    const [hf, mf] = HORARIO_FIM.split(':').map(Number);

    let inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), hi, mi, 0, 0);
    let fim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), hf, mf, 0, 0);

    if (agora > fim) {
        inicio.setDate(inicio.getDate() + 1);
        fim.setDate(fim.getDate() + 1);
    }

    const diff = fim.getTime() - inicio.getTime();
    return new Date(inicio.getTime() + Math.floor(Math.random() * diff));
}

// Conecta, executa uma ação e logo em seguida derruba a conexão
async function iniciarConexaoTemporaria(onOpen) {
    return new Promise(async (resolve, reject) => {
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
        const sock = makeWASocket({
            auth: state,
            logger: pino({ level: 'silent' }),
            browser: Browsers.windows('Chrome'),
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
        });

        sock.ev.on('creds.update', saveCreds);

        let resolvido = false;

        const finalizar = (erro) => {
            if (resolvido) return;
            resolvido = true;
            try {
                if (sock.ws) sock.ws.close();
                if (sock.end) sock.end(undefined);
            } catch (e) { }

            if (erro) reject(erro);
            else resolve();
        };

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('\n📱 Escaneie o QR Code para fazer login:');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'open') {
                console.log('✅ WhatsApp conectado com sucesso!');
                try {
                    await onOpen(sock);
                    // Aguarda 5 segundos para os acks e encerra a conexão para poupar memória
                    setTimeout(() => finalizar(), 5000);
                } catch (e) {
                    console.error('❌ Erro durante a operação de envio:', e.message);
                    finalizar(e);
                }
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                if (statusCode === DisconnectReason.loggedOut) {
                    console.log('🗑️ Sessão expirada (LOGOUT). Removendo pasta de autenticação...');
                    const fs = require('fs');
                    try { fs.rmSync(AUTH_FOLDER, { recursive: true, force: true }); } catch (_) { }
                    finalizar(new Error('Sessão expirada. Inicie para ler o QR Code novamente.'));
                } else {
                    finalizar(new Error(`Conexão fechada antes de enviar. Código: ${statusCode}`));
                }
            }
        });
    });
}

async function loopPrincipal() {
    console.log('\n🤖 INICIANDO....');

    console.log('🧠 Gerando mensagem e armazenando...');
    let mensagemDiaria = await gerarMensagem();
    console.log(`\n💬 Mensagem armazenada:\n"${mensagemDiaria}"\n`);
    console.log('📌 O WhatsApp será aberto no momento do envio.');

    while (true) {
        const proximoEnvio = gerarProximoHorario();
        console.log(`\n📅 PRÓXIMO ENVIO AGENDADO PARA: ${proximoEnvio.toLocaleString()}`);

        while (new Date() < proximoEnvio) {
            const faltaMs = proximoEnvio.getTime() - new Date().getTime();
            const horas = Math.floor(faltaMs / 3600000);
            const minutos = Math.floor((faltaMs % 3600000) / 60000);
            const segundos = Math.floor((faltaMs % 60000) / 1000);
            process.stdout.write(`\r⏳ Falta ${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}   `);
            await new Promise(r => setTimeout(r, 30000)); // Dorme verificando a cada 30 segundos
        }

        console.log('\n🚀 CHEGOU A HORA! Preparando para enviar...');
        console.log(`\n💬 Usando a mensagem:\n"${mensagemDiaria}"\n`);

        let enviado = false;
        let tentativas = 0;

        // Loop de 5 tentativas de conexão para garantir
        while (!enviado && tentativas < 5) {
            tentativas++;
            console.log(`\n🔌 Tentativa ${tentativas}/5 de conexão e envio ao WhatsApp...`);
            try {
                await iniciarConexaoTemporaria(async (sock) => {
                    await sock.sendMessage(`${NUMERO_OFICIAL}@s.whatsapp.net`, { text: mensagemDiaria });
                    console.log('✅ MENSAGEM ENVIADA!');
                });
                enviado = true;
            } catch (err) {
                console.error(`❌ Erro na tentativa ${tentativas}:`, err.message);
                if (tentativas < 5) {
                    console.log('⏳ Aguardando 1 minuto antes de tentar conectar novamente...');
                    await new Promise(r => setTimeout(r, 60000));
                }
            }
        }

        if (enviado) {
            console.log('\n💤 Missão cumprida por hoje! Desconectando do zap e entrando em hibernação...');
        } else {
            console.log('\n🚨 Todas as 5 tentativas falharam! Desistindo por hoje para evitar span/travamentos.');
        }

        console.log('🧠 Gerando a próxima mensagem para o próximo ciclo...');
        mensagemDiaria = await gerarMensagem();
        console.log(`\n💬 Próxima mensagem armazenada:\n"${mensagemDiaria}"\n`);

        // Dorme por 1 hora para evitar qualquer chance de duplicação do envio no dia
        await new Promise(r => setTimeout(r, 3600000));
    }
}

loopPrincipal();
