# 🗃️ Documentação Completa das Tabelas - Sistema BigImports

> **Última Atualização:** Janeiro 2025
> **Banco de Dados:** PostgreSQL (Supabase)
> **URL:** https://qamschuquqdqkddntiln.supabase.co

---

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Tabelas de Autenticação](#tabelas-de-autenticação)
3. [Tabelas de Catálogo](#tabelas-de-catálogo)
4. [Tabelas de Logs](#tabelas-de-logs)
5. [Tabelas de Fornecedores](#tabelas-de-fornecedores)
6. [Tabelas de Configuração](#tabelas-de-configuração)
7. [Relacionamentos](#relacionamentos)
8. [Segurança (RLS)](#segurança-rls)
9. [Índices e Views](#índices-e-views)

---

## Visão Geral

### Resumo Estatístico

| Tabela | Registros | Função Principal | RLS |
|--------|-----------|------------------|-----|
| `users` | 3 | Gerenciamento de usuários e instâncias WhatsApp | ❌ |
| `products_catalog` | 54.981 | Catálogo de produtos extraídos | ❌ |
| `search_logs` | 0 | Histórico de buscas | ❌ |
| `connection_history` | 0 | Eventos de conexão WhatsApp | ❌ |
| `supplier` | 89 | Fornecedores/grupos WhatsApp | ✅ |
| `contacts` | 44.938 | Contatos WhatsApp | ✅ |
| `roles` | 2 | Papéis e permissões | ❌ |
| `fornecedores` | 8 | Cadastro detalhado de fornecedores | ❌ |
| `system_config` | 5 | Configurações do sistema | ✅ |
| `kv_store_c1372f81` | 0 | Armazenamento chave-valor | ✅ |

---

## Tabelas de Autenticação

### 1. `roles`

**Função:** Define os níveis de acesso no sistema (admin, user).

#### Estrutura

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | `UUID` | `PRIMARY KEY` | Identificador único da role |
| `name` | `text` | `UNIQUE NOT NULL` | Nome da role |
| `description` | `text` | | Descrição da role |
| `created_at` | `timestamptz` | `DEFAULT NOW()` | Data de criação |

#### Valores Padrão
```sql
INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrador com acesso total ao sistema'),
  ('user', 'Usuário final com acesso ao dashboard pessoal');
```

#### Enum de `name`
- `user` - Usuário final (acesso limitado)
- `admin` - Administrador (acesso total)

#### Relacionamentos
- Referenciada por: `users.role_id`

#### RLS
❌ Desabilitado

---

### 2. `users`

**Função:** Tabela principal de usuários do sistema com gerenciamento de instâncias WhatsApp.

#### Estrutura

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | `UUID` | `PRIMARY KEY` | ID do usuário (Supabase Auth) |
| `name` | `text` | `NOT NULL` | Nome completo do usuário |
| `email` | `text` | `UNIQUE NOT NULL` | Email de login |
| `password_hash` | `text` | `NOT NULL` | Hash bcrypt da senha |
| `whatsapp_phone` | `text` | `UNIQUE` | Número WhatsApp (ex: 5511999999999) |
| `role_id` | `UUID` | `FK → roles.id` | Role do usuário |
| `instance_id` | `text` | `UNIQUE` | ID da instância Evolution API |
| `instance_status` | `enum` | `DEFAULT 'not_connected'` | Status da conexão WhatsApp |
| `qr_code_data` | `text` | | QR Code em Base64 |
| `qr_generated_at` | `timestamp` | | Data de geração do QR |
| `connected_at` | `timestamp` | | Data da última conexão |
| `last_regenerate_at` | `timestamp` | | Data da última regeneração de QR |
| `profile_pic` | `text` | | URL da foto de perfil WhatsApp |
| `status` | `enum` | `DEFAULT 'active'` | Status do usuário |
| `plan` | `enum` | `DEFAULT 'basic'` | Plano de assinatura |
| `max_searches_per_day` | `int` | `DEFAULT 50` | Limite diário de buscas |
| `created_at` | `timestamptz` | `DEFAULT NOW()` | Data de criação |
| `updated_at` | `timestamptz` | `DEFAULT NOW()` | Última atualização |

#### Enums

**`instance_status`:**
- `not_connected` - Nunca conectou
- `pending_connection` - QR gerado, aguardando scan
- `connected` - WhatsApp conectado
- `disconnected` - Desconectado manualmente
- `loading` - Processando conexão
- `to_delete` - Marcado para exclusão
- `error` - Erro na conexão

**`status`:**
- `active` - Usuário ativo
- `inactive` - Usuário inativo
- `suspended` - Usuário suspenso

**`plan`:**
- `basic` - Plano básico
- `premium` - Plano premium
- `enterprise` - Plano empresarial

#### Relacionamentos
- `role_id` → `roles.id` (Many-to-One)
- `id` → `auth.users.id` (One-to-One)
- Referenciada por: `search_logs.user_id`, `connection_history.user_id`

#### Índices
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_whatsapp ON users(whatsapp_phone);
CREATE INDEX idx_users_instance_id ON users(instance_id);
CREATE INDEX idx_users_instance_status ON users(instance_status);
```

#### RLS
❌ Desabilitado (⚠️ Recomenda-se habilitar)

---

## Tabelas de Catálogo

### 3. `products_catalog`

**Função:** Catálogo de produtos extraídos automaticamente de mensagens WhatsApp.

#### Estrutura

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | `UUID` | `PRIMARY KEY` | Identificador único do produto |
| `product_name` | `text` | `NOT NULL` | Nome do produto |
| `category` | `enum` | | Categoria do produto |
| `model` | `text` | | Modelo do produto |
| `capacity` | `text` | | Capacidade (ex: 128GB, 256GB) |
| `ram` | `text` | | Memória RAM |
| `grade` | `text` | | Grade/qualidade (A, B, C) |
| `colors` | `text[]` | | Array de cores disponíveis |
| `price` | `numeric` | | Preço do produto |
| `original_currency` | `text` | `DEFAULT 'BRL'` | Moeda original |
| `supplier_name` | `text` | | Nome do fornecedor |
| `sender_id` | `text` | | ID do remetente da mensagem |
| `telefone` | `numeric` | | Telefone do fornecedor |
| `source_chat_id` | `text` | | ID do chat de origem |
| `source_instance` | `text` | | ID da instância de origem |
| `message_type` | `enum` | | Tipo de mensagem |
| `message_id` | `text` | | ID da mensagem original |
| `extracted_at` | `timestamp` | `DEFAULT NOW()` | Data de extração |
| `created_at` | `timestamptz` | `DEFAULT NOW()` | Data de criação |
| `updated_at` | `timestamptz` | `DEFAULT NOW()` | Última atualização |

#### Enums

**`category`:**
- `Smartphone`
- `Notebook`
- `Tablet`
- `Caixa de Som`
- `Smartwatch`
- `Robô`
- `Carregador`
- `Microfone`
- `Caixas`
- `Fone de Ouvido`
- `Acessórios`
- `Cabos`
- `Internet`

**`message_type`:**
- `group` - Mensagem de grupo
- `private` - Mensagem privada
- `community` - Mensagem de comunidade

#### Índices
```sql
CREATE INDEX idx_products_name ON products_catalog(product_name);
CREATE INDEX idx_products_category ON products_catalog(category);
CREATE INDEX idx_products_supplier ON products_catalog(supplier_name);
CREATE INDEX idx_products_extracted_at ON products_catalog(extracted_at DESC);
CREATE INDEX idx_products_price ON products_catalog(price);
```

#### RLS
❌ Desabilitado

#### Queries Úteis
```sql
-- Top 10 produtos mais baratos por categoria
SELECT product_name, price, supplier_name
FROM products_catalog
WHERE category = 'Smartphone'
ORDER BY price ASC
LIMIT 10;

-- Produtos catalogados hoje
SELECT COUNT(*) FROM products_catalog
WHERE extracted_at::date = CURRENT_DATE;
```

---

## Tabelas de Logs

### 4. `search_logs`

**Função:** Registro de todas as buscas realizadas pelos usuários.

#### Estrutura

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | `UUID` | `PRIMARY KEY` | ID único do log |
| `user_id` | `UUID` | `FK → users.id` | ID do usuário que buscou |
| `user_phone` | `text` | | Telefone do usuário |
| `instance_id` | `text` | | ID da instância |
| `original_query` | `text` | | Query original digitada |
| `normalized_query` | `text` | | Query normalizada/processada |
| `category` | `text` | | Categoria identificada |
| `search_terms` | `text[]` | | Array de termos de busca |
| `results_count` | `int` | `DEFAULT 0` | Quantidade de resultados |
| `search_timestamp` | `timestamptz` | `DEFAULT NOW()` | Data e hora da busca |
| `response_time_ms` | `float` | | Tempo de resposta em ms |
| `success` | `boolean` | `DEFAULT true` | Se a busca foi bem-sucedida |
| `created_at` | `timestamptz` | `DEFAULT NOW()` | Data de criação |

#### Relacionamentos
- `user_id` → `users.id` (Many-to-One)

#### Índices
```sql
CREATE INDEX idx_search_logs_user ON search_logs(user_id);
CREATE INDEX idx_search_logs_phone ON search_logs(user_phone);
CREATE INDEX idx_search_logs_timestamp ON search_logs(search_timestamp DESC);
CREATE INDEX idx_search_logs_query ON search_logs(normalized_query);
```

#### RLS
❌ Desabilitado

#### Analytics

**Pesquisas por dia (últimos 7 dias):**
```sql
SELECT
  DATE(search_timestamp) as date,
  COUNT(*) as total_searches
FROM search_logs
WHERE search_timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(search_timestamp)
ORDER BY date DESC;
```

**Top 10 produtos mais buscados:**
```sql
SELECT
  normalized_query,
  COUNT(*) as search_count
FROM search_logs
GROUP BY normalized_query
ORDER BY search_count DESC
LIMIT 10;
```

---

### 5. `connection_history`

**Função:** Histórico completo de eventos de conexão das instâncias WhatsApp.

#### Estrutura

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | `UUID` | `PRIMARY KEY` | ID único do evento |
| `user_id` | `UUID` | `FK → users.id` | ID do usuário |
| `instance_id` | `text` | | ID da instância |
| `event_type` | `enum` | | Tipo de evento |
| `event_data` | `jsonb` | | Dados adicionais em JSON |
| `created_at` | `timestamptz` | `DEFAULT NOW()` | Data do evento |

#### Enums

**`event_type`:**
- `created` - Instância criada
- `qr_generated` - QR Code gerado
- `connected` - WhatsApp conectado
- `disconnected` - WhatsApp desconectado
- `error` - Erro na conexão

#### Relacionamentos
- `user_id` → `users.id` (Many-to-One)

#### Índices
```sql
CREATE INDEX idx_connection_history_user ON connection_history(user_id);
CREATE INDEX idx_connection_history_instance ON connection_history(instance_id);
CREATE INDEX idx_connection_history_timestamp ON connection_history(created_at DESC);
CREATE INDEX idx_connection_history_event_type ON connection_history(event_type);
```

#### RLS
❌ Desabilitado

#### Exemplo de `event_data`
```json
{
  "ip_address": "192.168.1.1",
  "user_agent": "WhatsApp/2.23.20",
  "error_message": "Connection timeout",
  "qr_code_url": "https://..."
}
```

---

## Tabelas de Fornecedores

### 6. `supplier`

**Função:** Cadastro de fornecedores e grupos do WhatsApp.

#### Estrutura

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | `integer` | `PRIMARY KEY IDENTITY` | ID único do fornecedor |
| `remotejid` | `text` | `UNIQUE NOT NULL` | JID do WhatsApp |
| `name` | `text` | | Nome do fornecedor |
| `type` | `text` | | Tipo (grupo, privado, etc.) |
| `desc` | `text` | | Descrição |
| `restrict` | `boolean` | `DEFAULT false` | Se está restrito |
| `created_at` | `timestamptz` | `DEFAULT NOW()` | Data de criação |

#### RLS
✅ Habilitado

---

### 7. `contacts`

**Função:** Banco de contatos do WhatsApp.

#### Estrutura

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | `bigint` | `PRIMARY KEY IDENTITY` | ID único do contato |
| `remoteJid` | `text` | `UNIQUE NOT NULL` | JID do WhatsApp |
| `telefone` | `text` | `UNIQUE` | Número de telefone |
| `lid` | `text` | `UNIQUE` | ID local do WhatsApp |
| `nome` | `text` | | Nome do contato |
| `id_supplier` | `text` | | Referência ao fornecedor |
| `created_at` | `timestamptz` | `DEFAULT NOW()` | Data de criação |

#### RLS
✅ Habilitado

---

### 8. `fornecedores`

**Função:** Cadastro alternativo de fornecedores com mais detalhes.

#### Estrutura

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | `UUID` | `PRIMARY KEY` | ID único |
| `nome` | `text` | | Nome do fornecedor |
| `lid` | `text` | `UNIQUE` | ID local |
| `telefone` | `text` | `UNIQUE` | Telefone |
| `link_wa` | `text` | | Link do WhatsApp |
| `verificado` | `boolean` | `DEFAULT false` | Se está verificado |
| `is_supplier` | `boolean` | | Se é fornecedor ativo |
| `criado_em` | `timestamptz` | `DEFAULT NOW()` | Data de criação |
| `atualizado_em` | `timestamptz` | `DEFAULT NOW()` | Última atualização |

#### RLS
❌ Desabilitado

---

## Tabelas de Configuração

### 9. `system_config`

**Função:** Configurações do sistema gerenciáveis via interface admin.

#### Estrutura

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | `UUID` | `PRIMARY KEY` | ID único |
| `config_key` | `varchar(100)` | `UNIQUE NOT NULL` | Chave única da configuração |
| `config_value` | `text` | | Valor da configuração |
| `config_type` | `varchar(50)` | `DEFAULT 'text'` | Tipo do campo |
| `description` | `text` | | Descrição da configuração |
| `is_encrypted` | `boolean` | `DEFAULT false` | Se está criptografado |
| `updated_at` | `timestamptz` | `DEFAULT NOW()` | Última atualização |
| `updated_by` | `UUID` | `FK → auth.users.id` | Quem atualizou |

#### Enums

**`config_type`:**
- `text` - Texto simples
- `password` - Senha (mascarada na UI)
- `url` - URL

#### Configurações Padrão
```sql
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
  ('SUPABASE_URL', '', 'url', 'URL do projeto Supabase'),
  ('SUPABASE_SERVICE_KEY', '', 'password', 'Service Role Key do Supabase'),
  ('N8N_WEBHOOK_CREATE_INSTANCE', '', 'url', 'Webhook n8n para criar instância WhatsApp'),
  ('N8N_WEBHOOK_REGENERATE_QR', '', 'url', 'Webhook n8n para regenerar QR Code'),
  ('N8N_WEBHOOK_DISCONNECT_INSTANCE', '', 'url', 'Webhook n8n para desconectar instância');
```

#### Relacionamentos
- `updated_by` → `auth.users.id` (Many-to-One, ON DELETE SET NULL)

#### RLS
✅ Habilitado (apenas admins)

#### Políticas RLS
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
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name = 'admin'
    )
  );
```

---

### 10. `kv_store_c1372f81`

**Função:** Armazenamento genérico chave-valor.

#### Estrutura

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `key` | `text` | `PRIMARY KEY` | Chave única |
| `value` | `jsonb` | | Valor em JSON |

#### RLS
✅ Habilitado

---

## Relacionamentos

### Diagrama ER

```
┌─────────────┐
│   roles     │
│─────────────│
│ id (PK)     │──────┐
│ name        │      │
└─────────────┘      │
                     │ 1:N
                     ▼
┌──────────────────────────────┐
│          users               │
│──────────────────────────────│
│ id (PK)                      │
│ role_id (FK)                 │
│ instance_id                  │
│ whatsapp_phone               │
└──────────────────────────────┘
        │                │
        │ 1:N            │ 1:N
        ▼                ▼
┌──────────────┐  ┌───────────────────┐
│ search_logs  │  │connection_history │
│──────────────│  │───────────────────│
│ id (PK)      │  │ id (PK)           │
│ user_id (FK) │  │ user_id (FK)      │
└──────────────┘  └───────────────────┘

┌──────────────────┐
│ products_catalog │
│──────────────────│
│ id (PK)          │
│ product_name     │
│ supplier_name    │
└──────────────────┘

┌──────────────┐     ┌──────────────┐
│   supplier   │     │  fornecedores│
│──────────────│     │──────────────│
│ id (PK)      │     │ id (PK)      │
│ remotejid    │     │ nome         │
└──────────────┘     └──────────────┘
        │
        │ 1:N
        ▼
┌──────────────┐
│   contacts   │
│──────────────│
│ id (PK)      │
│ id_supplier  │
└──────────────┘

┌──────────────────┐
│  system_config   │
│──────────────────│
│ id (PK)          │
│ updated_by (FK)  │──→ auth.users.id
└──────────────────┘
```

---

## Segurança (RLS)

### ✅ Tabelas COM RLS Habilitado

1. **`supplier`** - Protege dados de fornecedores
2. **`contacts`** - Protege dados de contatos
3. **`system_config`** - Apenas admins acessam
4. **`kv_store_c1372f81`** - Armazenamento protegido

### ❌ Tabelas SEM RLS (⚠️ Risco de Segurança)

1. **`users`** - Dados sensíveis expostos
2. **`products_catalog`** - Catálogo aberto
3. **`search_logs`** - Logs de busca expostos
4. **`connection_history`** - Histórico exposto
5. **`roles`** - Roles expostas
6. **`fornecedores`** - Fornecedores expostos

### 🔒 Recomendações de Segurança

Habilitar RLS nas tabelas críticas:

```sql
-- Habilitar RLS em users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name = 'admin'
    )
  );
```

---

## Índices e Views

### Views Criadas

#### `users_with_roles`
Combina dados de usuários com suas roles:

```sql
CREATE VIEW users_with_roles AS
SELECT
  u.*,
  r.name AS role_name,
  r.description AS role_description
FROM users u
INNER JOIN roles r ON u.role_id = r.id;
```

#### `users_can_regenerate`
Verifica se usuário pode regenerar QR (rate limit de 40s):

```sql
CREATE VIEW users_can_regenerate AS
SELECT
  id,
  instance_id,
  qr_generated_at,
  CASE
    WHEN qr_generated_at IS NULL THEN true
    WHEN (EXTRACT(EPOCH FROM (NOW() - qr_generated_at)) >= 40) THEN true
    ELSE false
  END AS can_regenerate,
  CASE
    WHEN qr_generated_at IS NULL THEN 0
    ELSE GREATEST(0, 40 - EXTRACT(EPOCH FROM (NOW() - qr_generated_at)))
  END AS seconds_remaining
FROM users
WHERE instance_status = 'pending_connection';
```

---

## 🎯 Principais Funcionalidades do Sistema

1. **Sistema de Autenticação Multi-role**
   - Usuários e admins com permissões diferentes
   - JWT tokens para autenticação
   - Proteção de rotas por role

2. **Gerenciamento de Instâncias WhatsApp**
   - Conexão via QR Code
   - Polling de status
   - Regeneração de QR com rate limit

3. **Catálogo Automático de Produtos**
   - Extração de mensagens WhatsApp
   - Categorização automática
   - Análise de preços

4. **Sistema de Busca Inteligente**
   - Normalização de queries
   - Logs e analytics
   - KPIs de uso

5. **Gestão de Fornecedores**
   - Múltiplas fontes de dados
   - Contatos e grupos
   - Verificação de fornecedores

6. **Configurações Dinâmicas**
   - Interface admin para configurar sistema
   - Webhooks n8n configuráveis
   - Credenciais Supabase via UI

---

## 📊 Queries de Manutenção

### Limpeza de Dados Antigos

```sql
-- Deletar logs de busca com mais de 90 dias
DELETE FROM search_logs
WHERE search_timestamp < NOW() - INTERVAL '90 days';

-- Deletar histórico de conexão com mais de 180 dias
DELETE FROM connection_history
WHERE created_at < NOW() - INTERVAL '180 days';
```

### Estatísticas

```sql
-- Total de produtos por categoria
SELECT category, COUNT(*) as total
FROM products_catalog
GROUP BY category
ORDER BY total DESC;

-- Usuários conectados
SELECT COUNT(*) FROM users WHERE instance_status = 'connected';

-- Média de tempo de resposta
SELECT AVG(response_time_ms) FROM search_logs WHERE success = true;
```

---

## 📞 Referências

- **Supabase Dashboard:** https://supabase.com/dashboard/project/qamschuquqdqkddntiln
- **SQL Editor:** https://supabase.com/dashboard/project/qamschuquqdqkddntiln/editor
- **Documentação Supabase:** https://supabase.com/docs
- **Evolution API:** https://doc.evolution-api.com/
