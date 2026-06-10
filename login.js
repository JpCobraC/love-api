const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

const AUTH_FOLDER = './baileys_auth';

async function iniciarLogin() {
    console.log('🔌 Inicializando conexão para login do WhatsApp...');
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: Browsers.windows('Chrome'),
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n📱 Escaneie o QR Code abaixo com o WhatsApp do seu celular para fazer login:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'open') {
            console.log('\n✅ WhatsApp conectado com sucesso!');
            console.log(`👤 Conectado como número: ${sock.user.id.split(':')[0]}`);
            console.log('💾 Sessão salva com sucesso em "./baileys_auth".');
            console.log('🔌 Fechando conexão de login...');
            
            setTimeout(() => {
                try {
                    sock.ws.close();
                } catch (e) {}
                console.log('👋 Tudo pronto! Agora você pode rodar o bot principal com "npm start".');
                process.exit(0);
            }, 3000);
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            if (statusCode === DisconnectReason.loggedOut) {
                console.log('🗑️ Sessão expirada ou deslogada.');
                process.exit(1);
            } else if (statusCode !== undefined) {
                console.log(`🔌 Conexão fechada. Código de status: ${statusCode}. Tentando reconectar...`);
            }
        }
    });
}

iniciarLogin().catch((err) => {
    console.error('❌ Erro ao iniciar login:', err);
});
