# 💘 Love-API - O bot do casal que só acorda depois das 10h

Um bot automatizado que envia mensagens diárias personalizadas via WhatsApp Web usando Selenium.

Perfeito para quem namora e acorda tarde: envia recadinshos amorosos enquanto você ainda está na cama, com café na mão e desculpas prontas.

## ✨ Funcionalidades

- 📅 **Envio automático diário** - Mensagens agendadas em horário aleatório ou fixo
- 🎲 **Mensagens randomizadas** - Escolhe entre diversas mensagens predefinidas
- 💾 **Sessão persistente** - Mantém você logado via QR Code
- 🧪 **Modo teste** - Teste imediato ou com horário customizado
- 🔄 **Loop contínuo** - Roda indefinidamente em background

## 📋 Pré-requisitos

- Python 3.8+
- Google Chrome/Chromium instalado
- Conexão ativa com internet
- Número de WhatsApp (destinatário)

## 🚀 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/JpCobraC/love-api.git
cd love-api
```

### 2. Crie um ambiente virtual
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

### 3. Instale as dependências
```bash
pip install -r requirements.txt
```

## ⚙️ Configuração

Edite `main.py` e configure:

```python
# ===== CONFIG =====
NUMERO = "5535999999"  # Seu número de telefone (com código país)
HORARIO_INICIO = "07:00"  # Início da janela aleatória de envio
HORARIO_FIM = "08:00"  # Fim da janela aleatória de envio

# ===== TESTE =====
MODO_TESTE = False  # True = envia agora, False = horário aleatório
HORARIO_TESTE = "00:17"  # HH:MM - usado quando MODO_TESTE = True

# Customize as mensagens
mensagens = [
    "Sua mensagem aqui",
    "Outra mensagem",
    # ...
]
```

### Intervalo de horário

Quando `MODO_TESTE = False`, o bot escolhe um horário aleatório entre `HORARIO_INICIO` e `HORARIO_FIM`.

- Defina `HORARIO_INICIO` e `HORARIO_FIM` no formato `HH:MM`
- Exemplo: `HORARIO_INICIO = "10:00"` e `HORARIO_FIM = "11:30"`
- O envio ocorrerá em um horário aleatório dentro dessa janela

Se quiser horário fixo, mantenha `MODO_TESTE = True` e ajuste `HORARIO_TESTE`.

## 🎯 Como usar

### Primeiro uso - Gerar sessão

Execute o script para autenticar com WhatsApp:
```bash
python gerar_sessao.py
```

1. Um navegador Chrome abrirá
2. Escaneie o QR Code com seu celular
3. Pressione ENTER no terminal após escanear
4. A sessão será salva em `chrome-data/`

### Executar o bot

```bash
python main.py
```

O bot:
1. Abrirá o Chrome (com dados da sessão)
2. Aguardará o horário agendado
3. Enviará a mensagem automaticamente
4. Repetirá diariamente

### Modo teste

Para testar envio imediato:

```python
MODO_TESTE = True
HORARIO_TESTE = "13:45"  # Horário atual ou próximo
```

## 📁 Estrutura do projeto

```
laurai/
├── main.py              # Script principal de automação
├── gerar_sessao.py      # Script para autenticar no WhatsApp
├── requirements.txt     # Dependências do projeto
├── .gitignore          # Arquivos ignorados pelo Git
├── chrome-data/        # Dados da sessão Chrome (Git ignored)
├── build/              # Arquivos PyInstaller
└── README.md           # Este arquivo
```

## 📦 Dependências

- `selenium` - Automação do navegador
- `webdriver-manager` - Gerenciador automático do ChromeDriver

Instale com: `pip install -r requirements.txt`

## 🛡️ Considerações de Segurança

⚠️ **Importante:**
- Nunca compartilhe seu arquivo `chrome-data/`
- Use um número de WhatsApp dedicado se possível
- Respeite os termos de serviço do WhatsApp
- O WhatsApp pode bloquear contas que enviam muitas mensagens automaticamente
- Use com moderação e responsabilidade

## 🔧 Compilar para executável (PyInstaller)

```bash
pyinstaller main.spec
```

O executável estará em `dist/main/`

## 🐛 Troubleshooting

### "Chrome driver not found"
```bash
pip install --upgrade webdriver-manager
```

### "Timeout esperando elemento"
- Verifique sua conexão de internet
- O WhatsApp Web pode ter mudado a estrutura HTML
- Tente escanear o QR Code novamente executando `gerar_sessao.py`

### "Sessão expirada"
Execute `gerar_sessao.py` novamente para autenticar

### Bot não envia mensagens
- Verifique o horário do servidor
- Confirme que o número está no formato correto (com código país)
- Veja o console para mensagens de erro

## 📝 Logs

O bot exibe mensagens no console:
- ✅ Mensagem enviada com sucesso
- ❌ Erros durante execução
- ⏰ Próxima mensagem agendada

## 📚 Referências

- [Selenium Documentation](https://selenium-python.readthedocs.io/)
- [Webdriver Manager](https://github.com/Sherlock113/webdriver_manager)
- [WhatsApp Web](https://web.whatsapp.com)

## ⚖️ Aviso Legal

Este projeto é fornecido como está, apenas para fins educacionais. O usuário é responsável por:
- Conformidade com leis locais
- Respeito aos termos de serviço do WhatsApp
- Uso ético e responsável
- Qualquer consequência do uso da ferramenta

O WhatsApp pode banir contas que violem seus termos de serviço.

## 📄 Licença

MIT License

## 👤 Autor

Criado com ❤️

---

**Gostou? Deixe uma ⭐ no repositório!**
