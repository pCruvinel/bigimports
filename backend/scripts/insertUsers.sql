-- Script SQL para criar usuários de teste diretamente
-- Execute este script no Supabase SQL Editor

-- ============================================
-- 1. Inserir usuário ADMIN
-- ============================================
INSERT INTO users (
  name,
  email,
  password_hash,
  role_id,
  status,
  plan,
  max_searches_per_day
) VALUES (
  'Admin Teste',
  'admin@bigimports.com',
  '$2a$10$Pltgvqigk7TWb52VPoZhHujBy4TVzVgNHJ8XFGdpAZaNN5KPk09ce',
  (SELECT id FROM roles WHERE name = 'admin'),
  'active',
  'premium',
  1000
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 2. Inserir usuário USER
-- ============================================
INSERT INTO users (
  name,
  email,
  password_hash,
  role_id,
  status,
  plan,
  max_searches_per_day,
  whatsapp_phone
) VALUES (
  'Usuário Teste',
  'user@bigimports.com',
  '$2a$10$zfIQEISAqdj2VHQD4I5Ak.CvB6EJNtpDrmkjWLQTw65KI5fg/BTc.',
  (SELECT id FROM roles WHERE name = 'user'),
  'active',
  'basic',
  100,
  '5511999999999'
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 3. Verificar usuários criados
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
WHERE email IN ('admin@bigimports.com', 'user@bigimports.com')
ORDER BY created_at DESC;

-- ============================================
-- 4. Verificar na view users_with_roles
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
WHERE email IN ('admin@bigimports.com', 'user@bigimports.com')
ORDER BY created_at DESC;
