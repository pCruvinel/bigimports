# Guia de Configuração do Sistema - Página de Settings

## 📋 Visão Geral

Foi implementada uma página de configuração completa no painel admin que permite gerenciar:
- ✅ Credenciais do Supabase (URL e Service Key)
- ✅ Webhooks n8n (Create Instance, Regenerate QR, Disconnect)
- ✅ Teste de conexão com Supabase
- ✅ Armazenamento seguro no banco de dados

## 🗄️ Estrutura do Banco de Dados

### Tabela `system_config`

Foi criada uma tabela para armazenar as configurações do sistema:

```sql
CREATE TABLE system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  config_type VARCHAR(50) DEFAULT 'text', -- text, password, url
  description TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
```

**Configurações pré-cadastradas:**
1. `SUPABASE_URL` - URL do projeto Supabase
2. `SUPABASE_SERVICE_KEY` - Service Role Key do Supabase
3. `N8N_WEBHOOK_CREATE_INSTANCE` - Webhook para criar instância
4. `N8N_WEBHOOK_REGENERATE_QR` - Webhook para regenerar QR Code
5. `N8N_WEBHOOK_DISCONNECT_INSTANCE` - Webhook para desconectar instância

### Segurança

- ✅ RLS (Row Level Security) habilitado
- ✅ Apenas admins podem ler/atualizar configurações
- ✅ Senhas são mascaradas (`••••••••`) quando exibidas
- ✅ Auditoria: campo `updated_by` registra quem alterou

## 📁 Arquivos Criados/Modificados

### Backend

**Criados:**
1. `backend/src/controllers/configController.js` - Controller para CRUD de configurações
2. `database/create_system_config.sql` - Script SQL para criar tabela

**Modificados:**
1. `backend/src/routes/adminRoutes.js` - Adicionadas rotas de configuração
2. `backend/src/services/n8nService.js` - Atualizado para buscar URLs do banco

### Frontend

**Criados:**
1. `frontend/src/pages/AdminSettings.jsx` - Página de configurações

**Modificados:**
1. `frontend/src/App.jsx` - Adicionada rota `/admin/settings`
2. `frontend/src/pages/AdminDashboard.jsx` - Botão "⚙️ Configurações"

## 🔌 Endpoints da API

### GET /api/admin/config
Retorna todas as configurações do sistema.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "config_key": "SUPABASE_URL",
      "config_value": "https://...",
      "config_type": "url",
      "description": "URL do projeto Supabase",
      "updated_at": "2025-01-15T10:30:00Z"
    },
    {
      "config_key": "SUPABASE_SERVICE_KEY",
      "config_value": "••••••••", // Mascarado
      "config_type": "password"
    }
  ]
}
```

### GET /api/admin/config/:key
Retorna configuração específica.

### PUT /api/admin/config/:key
Atualiza configuração específica.

**Body:**
```json
{
  "config_value": "novo_valor"
}
```

### PUT /api/admin/config
Atualiza múltiplas configurações de uma vez.

**Body:**
```json
{
  "configs": [
    { "config_key": "SUPABASE_URL", "config_value": "https://..." },
    { "config_key": "N8N_WEBHOOK_CREATE_INSTANCE", "config_value": "https://..." }
  ]
}
```

### POST /api/admin/config/test-supabase
Testa conexão com Supabase usando credenciais fornecidas.

**Body:**
```json
{
  "supabase_url": "https://...",
  "supabase_service_key": "eyJ..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Conexão com Supabase estabelecida com sucesso"
}
```

## 🚀 Como Usar

### 1. Executar Script SQL

Execute o script SQL no Supabase para criar a tabela:

```bash
# Acesse o SQL Editor no Supabase Dashboard
# Cole e execute o conteúdo de: database/create_system_config.sql
```

### 2. Acessar Página de Configurações

1. Faça login como **admin**
2. No Dashboard Admin, clique em **"⚙️ Configurações"**
3. Você verá duas seções:
   - 🗄️ **Credenciais Supabase**
   - 🔗 **Webhooks n8n**

### 3. Configurar Credenciais Supabase

1. Cole a **URL do Supabase** (ex: `https://qamschuquqdqkddntiln.supabase.co`)
2. Cole a **Service Key** (chave que começa com `eyJ...`)
3. Clique em **"Testar Conexão Supabase"** para validar
4. Se sucesso, verá: ✅ "Conexão com Supabase testada com sucesso!"

### 4. Configurar Webhooks n8n

Cole as URLs dos webhooks do n8n:
- **Create Instance**: URL do workflow que cria instância e gera QR Code
- **Regenerate QR**: URL do workflow que regenera QR Code
- **Disconnect Instance**: URL do workflow que desconecta instância

### 5. Salvar Configurações

Clique em **"Salvar Todas as Configurações"** no final da página.

## 🔄 Como Funciona a Integração

### Antes (via .env)
```javascript
// n8nService.js
const response = await axios.post(
  process.env.N8N_WEBHOOK_CREATE_INSTANCE, // ❌ Fixo no .env
  { id: userId }
);
```

### Agora (via banco de dados)
```javascript
// n8nService.js
const webhookUrl = await getConfig('N8N_WEBHOOK_CREATE_INSTANCE'); // ✅ Do banco
const response = await axios.post(webhookUrl, { id: userId });
```

**Benefícios:**
- ✅ Alterar webhooks sem reiniciar servidor
- ✅ Admin pode gerenciar via interface
- ✅ Fallback automático para `.env` se não encontrar no banco
- ✅ Auditoria de quem alterou e quando

## ⚠️ Observações Importantes

### 1. Senhas Mascaradas
- Campos tipo `password` mostram `••••••••` quando carregados
- Para alterar, digite uma **nova senha**
- Não salve se o valor ainda for `••••••••` (sistema ignora)

### 2. Reinício do Servidor
Se alterar credenciais do **Supabase**:
```bash
cd backend
# Pare o servidor (Ctrl+C)
npm run dev  # Reinicie
```

**Por quê?** O cliente Supabase é inicializado no `database.js` ao iniciar o servidor.

### 3. Webhooks n8n
Mudanças nos webhooks **não requerem reinício**, pois são buscados do banco a cada chamada.

### 4. Fallback para .env
Se a tabela `system_config` não existir ou estiver vazia, o sistema automaticamente usa as variáveis de ambiente do `.env`.

## 🧪 Testando a Implementação

### Teste 1: Carregar Configurações
1. Acesse `/admin/settings`
2. Verifique se as 5 configurações aparecem
3. Senhas devem estar mascaradas

### Teste 2: Salvar Configuração
1. Altere a URL de um webhook
2. Clique em "Salvar"
3. Recarregue a página - valor deve persistir

### Teste 3: Testar Supabase
1. Digite credenciais válidas
2. Clique em "Testar Conexão"
3. Deve mostrar mensagem de sucesso

### Teste 4: Webhook Funcionando
1. Configure os webhooks n8n
2. No dashboard user, tente conectar WhatsApp
3. Sistema deve usar a URL do banco (não do .env)

## 📊 Estrutura Visual da Página

```
┌─────────────────────────────────────────────┐
│  ⚙️ Configurações do Sistema  [← Voltar]   │
│  Gerencie credenciais do Supabase e...     │
├─────────────────────────────────────────────┤
│  [Mensagem de Sucesso/Erro]                 │
├─────────────────────────────────────────────┤
│  🗄️ Credenciais Supabase                   │
│  ┌───────────────────────────────────────┐  │
│  │ SUPABASE_URL                          │  │
│  │ [___________________________]         │  │
│  │ URL do projeto Supabase               │  │
│  ├───────────────────────────────────────┤  │
│  │ SUPABASE_SERVICE_KEY                  │  │
│  │ [__________________] [👁️]            │  │
│  │ Service Role Key (permissões admin)   │  │
│  └───────────────────────────────────────┘  │
│  [Testar Conexão Supabase]                  │
├─────────────────────────────────────────────┤
│  🔗 Webhooks n8n                           │
│  ┌───────────────────────────────────────┐  │
│  │ N8N_WEBHOOK_CREATE_INSTANCE           │  │
│  │ [___________________________]         │  │
│  │ Webhook n8n para criar instância...   │  │
│  ├───────────────────────────────────────┤  │
│  │ N8N_WEBHOOK_REGENERATE_QR             │  │
│  │ [___________________________]         │  │
│  ├───────────────────────────────────────┤  │
│  │ N8N_WEBHOOK_DISCONNECT_INSTANCE       │  │
│  │ [___________________________]         │  │
│  └───────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│        [Salvar Todas as Configurações]      │
├─────────────────────────────────────────────┤
│  ℹ️ Importante: Após salvar Supabase,      │
│  reinicie o servidor backend.              │
│  🔒 Senhas são armazenadas com segurança. │
└─────────────────────────────────────────────┘
```

## 🔐 Segurança

### RLS Policies
```sql
-- Apenas admins podem ler
CREATE POLICY "Admin can read system_config"
  ON system_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name = 'admin'
    )
  );

-- Apenas admins podem atualizar
CREATE POLICY "Admin can update system_config"
  ON system_config FOR UPDATE
  USING (...);
```

### Middleware de Autenticação
```javascript
// adminRoutes.js
router.use(authMiddleware);        // Verifica JWT
router.use(roleMiddleware(['admin'])); // Verifica role 'admin'
```

### Mascaramento de Senhas
```javascript
// configController.js
const maskedData = data.map(config => ({
  ...config,
  config_value: config.config_type === 'password' && config.config_value
    ? '••••••••'
    : config.config_value
}));
```

## 📝 Próximos Passos (Opcionais)

1. **Criptografia de Senhas no Banco**
   - Implementar criptografia AES-256 para senhas
   - Usar campo `is_encrypted` para controlar

2. **Histórico de Alterações**
   - Criar tabela `system_config_history`
   - Registrar todas as mudanças

3. **Validação de URLs**
   - Validar formato de webhooks antes de salvar
   - Testar se webhooks estão acessíveis

4. **Notificações**
   - Enviar email ao admin quando config é alterada
   - Alertar sobre alterações críticas

## 🆘 Troubleshooting

### Erro: "Configuração não encontrada no banco"
**Solução:** Execute o script SQL `create_system_config.sql` no Supabase.

### Erro: "Erro ao buscar configurações"
**Solução:** Verifique se RLS está configurado corretamente e se o usuário é admin.

### Webhook não funciona após salvar
**Solução:** Verifique se a URL está correta e se o workflow n8n está ativo.

### "Falha ao conectar com Supabase"
**Causas possíveis:**
- URL ou Service Key incorretas
- Projeto Supabase pausado/desativado
- Problema de rede

## ✅ Checklist de Implementação

- [x] Criar tabela `system_config`
- [x] Criar controller `configController.js`
- [x] Adicionar rotas em `adminRoutes.js`
- [x] Atualizar `n8nService.js` para buscar do banco
- [x] Criar página `AdminSettings.jsx`
- [x] Adicionar rota `/admin/settings`
- [x] Adicionar botão no `AdminDashboard`
- [x] Implementar mascaramento de senhas
- [x] Implementar teste de conexão Supabase
- [x] Criar documentação

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do backend (`npm run dev`)
2. Verifique o console do navegador (F12)
3. Confirme que a tabela existe no Supabase
4. Verifique se o usuário tem role 'admin'
