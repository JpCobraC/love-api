const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pino = require('pino');
require('dotenv').config();

// Carrega a chave da IA
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// ===== CONFIGURAÇÕES =====
const NUMERO_OFICIAL = '553599999999'; // Número da patroa
const NUMERO_TESTE = '553599999999'; // Seu número
const HORARIO_INICIO = '05:50';
const HORARIO_FIM = '06:30';
const AUTH_FOLDER = './baileys_auth';

async function gerarMensagem() {
    const toques = ['café', 'sol', 'sorriso', 'amor', 'dia', 'beijo', 'abraço', 'risada', 'olhos', 'coração'];
    const toque = toques[Math.floor(Math.random() * toques.length)];
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
    console.log('\n🤖 INICIANDO LAURAI MODO ECONÔMICO (Conecta offline, poupa RAM)');

    // Verificação Inicial: Necessário para testar a sessão existente e garantir que, 
    // se precisar ler QR Code, isso ocorra agora, e não só as 6 da manhã.
    console.log('🔍 Fazendo verificação de sessão inicial e gerando mensagem de teste...');
    try {
        console.log('🧠 Gerando mensagem de teste com Gemini...');
        const mensagemTesteIA = await gerarMensagem();
        console.log(`\n💬 Mensagem de teste gerada:\n"${mensagemTesteIA}"\n`);
        
        await iniciarConexaoTemporaria(async (sock) => {
            const msgTeste = '🤖 [LAURAI] Bot iniciado! O processo agora dormirá e só conectará ao WhatsApp no momento do envio.\n\n🧠 *Teste de Geração de IA (Gemini):*\n' + mensagemTesteIA;
            await sock.sendMessage(`${NUMERO_TESTE}@s.whatsapp.net`, { text: msgTeste });
            console.log('✅ Ping inicial com mensagem de IA enviado com sucesso!');
        });
        console.log('✅ Verificação concluída. Desconectado com segurança e em standby.');
    } catch (e) {
        console.error('❌ Falha na inicialização:', e.message);
        console.log('Aguardando 10 segundos para tentar novamente (pode ser problema de internet ou QR Code faltando)...');
        await new Promise(r => setTimeout(r, 10000));
        return loopPrincipal(); // Recomeça para forçar a leitura do QR ou reconexão
    }

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

        console.log('\n🚀 CHEGOU A HORA! Preparando...');
        console.log('🧠 Gerando mensagem com Gemini...');
        const mensagemDiaria = await gerarMensagem();
        console.log(`\n💬 Mensagem gerada:\n"${mensagemDiaria}"\n`);

        let enviado = false;
        let tentativas = 0;

        // Loop de 5 tentativas de conexão para garantir
        while (!enviado && tentativas < 5) {
            tentativas++;
            console.log(`\n🔌 Tentativa ${tentativas}/5 de conexão e envio ao WhatsApp...`);
            try {
                await iniciarConexaoTemporaria(async (sock) => {
                    await sock.sendMessage(`${NUMERO_OFICIAL}@s.whatsapp.net`, { text: mensagemDiaria });
                    console.log('✅ MENSAGEM OFICIAL ENVIADA!');
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

        // Dorme por 1 hora para evitar qualquer chance de duplicação do envio no dia
        await new Promise(r => setTimeout(r, 3600000));
    }
}

loopPrincipal();
