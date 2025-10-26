# Guia de Testes - Sistema de Autenticação

## Pré-requisitos

Antes de testar, certifique-se de:

1. **Criar usuários no banco de dados Supabase:**

Para testar a autenticação, você precisa criar usuários na tabela `users`. As senhas devem ser armazenadas com hash bcrypt.

### Script para criar usuários de teste:

Você pode usar este código Node.js para gerar o hash da senha:

```javascript
const bcrypt = require('bcryptjs');

async function generateHash(password) {
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash:', hash);
}

generateHash('admin123');  // Para usuário admin
generateHash('user123');   // Para usuário normal
```

### Inserir usuários no Supabase:

Execute estes comandos SQL no Supabase SQL Editor:

```sql
-- Primeiro, obter os IDs das roles
SELECT * FROM roles;

-- Inserir usuário Admin (role_id = 1, assumindo que 'admin' tem ID 1)
INSERT INTO users (
  id,
  name,
  email,
  password_hash,
  role_id,
  status,
  plan,
  max_searches_per_day
) VALUES (
  gen_random_uuid(),
  'Admin Teste',
  'admin@bigimports.com',
  '$2a$10$seu_hash_gerado_aqui',  -- Substituir pelo hash gerado
  1,  -- ID da role 'admin'
  'active',
  'premium',
  1000
);

-- Inserir usuário normal (role_id = 2, assumindo que 'user' tem ID 2)
INSERT INTO users (
  id,
  name,
  email,
  password_hash,
  role_id,
  status,
  plan,
  max_searches_per_day,
  whatsapp_phone
) VALUES (
  gen_random_uuid(),
  'Usuário Teste',
  'user@bigimports.com',
  '$2a$10$seu_hash_gerado_aqui',  -- Substituir pelo hash gerado
  2,  -- ID da role 'user'
  'active',
  'basic',
  100,
  '5511999999999'
);
```

## Como Testar

### 1. Iniciar o Backend

```bash
cd backend
npm install
npm run dev
```

O servidor deve iniciar na porta 5000. Você verá:
```
✅ Conexão com Supabase estabelecida com sucesso!
🚀 Servidor rodando na porta 5000
```

### 2. Iniciar o Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O frontend estará disponível em: http://localhost:5173

### 3. Testar Login

#### Teste 1: Login como Admin
1. Acesse http://localhost:5173/login
2. Faça login com:
   - Email: `admin@bigimports.com`
   - Senha: `admin123` (ou a senha que você definiu)
3. Você deve ser redirecionado para `/admin/dashboard`
4. Verifique se o nome e email do admin são exibidos

#### Teste 2: Login como Usuário
1. Faça logout clicando no botão "Sair"
2. Faça login com:
   - Email: `user@bigimports.com`
   - Senha: `user123` (ou a senha que você definiu)
3. Você deve ser redirecionado para `/dashboard`
4. Verifique se o nome, email e plano do usuário são exibidos

#### Teste 3: Proteção de Rotas
1. Faça logout
2. Tente acessar diretamente: http://localhost:5173/admin/dashboard
3. Você deve ser redirecionado para `/login`

4. Faça login como usuário (não admin)
5. Tente acessar: http://localhost:5173/admin/dashboard
6. Você deve ser redirecionado para `/dashboard` (seu dashboard de usuário)

#### Teste 4: Credenciais Inválidas
1. Na página de login, tente fazer login com:
   - Email: `teste@invalido.com`
   - Senha: `senhaerrada`
2. Deve aparecer uma mensagem de erro: "Credenciais inválidas"

#### Teste 5: Persistência de Sessão
1. Faça login (como admin ou user)
2. Atualize a página (F5)
3. Você deve continuar logado e na mesma página
4. Feche o navegador e abra novamente
5. Acesse http://localhost:5173
6. Você deve ser redirecionado automaticamente para o dashboard correto

### 4. Testar Endpoints da API (via Postman/Thunder Client)

#### Login
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@bigimports.com",
  "password": "admin123"
}
```

Resposta esperada:
```json
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid...",
    "name": "Admin Teste",
    "email": "admin@bigimports.com",
    "role": "admin",
    ...
  }
}
```

#### Obter dados do usuário autenticado
```http
GET http://localhost:5000/api/auth/me
Authorization: Bearer SEU_TOKEN_AQUI
```

#### Logout
```http
POST http://localhost:5000/api/auth/logout
Authorization: Bearer SEU_TOKEN_AQUI
```

## Troubleshooting

### Erro: "Credenciais inválidas"
- Verifique se o usuário existe no banco de dados
- Confirme que o hash da senha foi gerado corretamente
- Verifique se o status do usuário é 'active'

### Erro: "Conexão com Supabase falhou"
- Verifique as credenciais no arquivo `.env` do backend
- Confirme que a URL e as chaves do Supabase estão corretas

### Token inválido ou expirado
- Faça logout e login novamente
- Limpe o localStorage do navegador (F12 > Application > Local Storage)

### Frontend não conecta com Backend
- Verifique se o backend está rodando na porta 5000
- Confirme que a variável `VITE_API_URL` no `.env` do frontend está correta
- Verifique o CORS no backend

## Próximos Passos

Após validar a autenticação, você pode implementar:
1. ✅ Sistema de autenticação completo
2. 🔄 CRUD de usuários (Admin)
3. 🔄 Dashboard com KPIs
4. 🔄 Visualizador de logs
5. 🔄 Conexão WhatsApp (User)
