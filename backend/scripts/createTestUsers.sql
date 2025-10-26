Vou-- Script SQL para criar usuários de teste
-- Execute este script no Supabase SQL Editor após gerar os hashes de senha

-- IMPORTANTE: Substitua os valores de password_hash pelos hashes gerados
-- Use o script: node scripts/generatePasswordHash.js admin123

-- ============================================
-- 1. Verificar roles existentes
-- ============================================
SELECT id, role_name FROM roles ORDER BY id;

-- ============================================
-- 2. Criar usuário ADMIN
-- ============================================
-- Senha: admin123
-- Hash: Use o gerado pelo script generatePasswordHash.js

INSERT INTO users (
  id,
  name,
  email,
  password_hash,
  role_id,
  status,
  plan,
  max_searches_per_day,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Admin Teste',
  'admin@bigimports.com',
  '$2a$10$SUBSTITUA_PELO_HASH_GERADO',  -- ⚠️ SUBSTITUIR AQUI
  (SELECT id FROM roles WHERE role_name = 'admin'),
  'active',
  'premium',
  1000,
  NOW(),
  NOW()
);

-- ============================================
-- 3. Criar usuário USER
-- ============================================
-- Senha: user123
-- Hash: Use o gerado pelo script generatePasswordHash.js

INSERT INTO users (
  id,
  name,
  email,
  password_hash,
  role_id,
  status,
  plan,
  max_searches_per_day,
  whatsapp_phone,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Usuário Teste',
  'user@bigimports.com',
  '$2a$10$SUBSTITUA_PELO_HASH_GERADO',  -- ⚠️ SUBSTITUIR AQUI
  (SELECT id FROM roles WHERE role_name = 'user'),
  'active',
  'basic',
  100,
  '5511999999999',
  NOW(),
  NOW()
);

-- ============================================
-- 4. Verificar usuários criados
-- ============================================
SELECT
  id,
  name,
  email,
  role_id,
  status,
  plan,
  created_at
FROM users
ORDER BY created_at DESC;

-- ============================================
-- 5. Verificar na view users_with_roles
-- ============================================
SELECT
  id,
  name,
  email,
  role_name,
  status,
  instance_status,
  plan
FROM users_with_roles
ORDER BY created_at DESC;

