# BigImports - Painel de Gerenciamento WhatsApp

Painel web para gerenciar e monitorar um sistema de automação de buscas de produtos via WhatsApp, integrado com a API Evolution e orquestrado pelo n8n.

## 🚀 Tecnologias

**Backend:**
- Node.js + Express
- Supabase (PostgreSQL)
- JWT para autenticação
- Integração com n8n webhooks

**Frontend:**
- React 19
- Vite
- React Router
- Axios

## 📋 Pré-requisitos

- Node.js 18+ e npm
- Conta Supabase (PostgreSQL)
- n8n configurado com workflows de integração WhatsApp

## ⚙️ Configuração

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
PORT=5000
SUPABASE_URL=sua_url_supabase
SUPABASE_KEY=sua_chave_anon
SUPABASE_SERVICE_KEY=sua_chave_service_role
JWT_SECRET=seu_secret_jwt
N8N_WEBHOOK_CREATE_INSTANCE=url_webhook_n8n
N8N_WEBHOOK_REGENERATE_QR=url_webhook_n8n
N8N_WEBHOOK_DISCONNECT_INSTANCE=url_webhook_n8n
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edite o arquivo `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## 🏃 Executando o Projeto

### Desenvolvimento

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Acesse: http://localhost:5173

### Produção

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 📁 Estrutura do Projeto

```
bigimports/
├── backend/              # API REST em Node.js
│   ├── src/
│   │   ├── config/       # Configurações (database, etc)
│   │   ├── controllers/  # Lógica de negócio
│   │   ├── middleware/   # Middlewares (auth, etc)
│   │   ├── routes/       # Rotas da API
│   │   ├── services/     # Serviços externos (n8n)
│   │   └── utils/        # Utilitários
│   └── package.json
│
└── frontend/             # Aplicação React
    ├── src/
    │   ├── components/   # Componentes reutilizáveis
    │   ├── pages/        # Páginas
    │   ├── hooks/        # Custom hooks
    │   ├── services/     # API client
    │   └── contexts/     # Context API
    └── package.json
```

## 🔑 Funcionalidades

### Admin
- Dashboard com KPIs e gráficos
- CRUD de usuários
- Visualização de logs (pesquisas e conexões)

### Usuário
- Conectar instância WhatsApp via QR Code
- Monitoramento de status da conexão
- Desconectar instância

## 📚 Documentação

Consulte o arquivo `CLAUDE.md` para documentação detalhada sobre:
- Requisitos funcionais e não-funcionais
- Integração com workflows n8n
- Arquitetura e fluxo de dados
- Endpoints da API

## 📄 Licença

ISC
