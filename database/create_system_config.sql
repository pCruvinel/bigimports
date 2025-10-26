-- Tabela para armazenar configurações do sistema
-- Permite admin configurar webhooks n8n e credenciais Supabase via interface

CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  config_type VARCHAR(50) DEFAULT 'text', -- text, password, url
  description TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índice para busca rápida por chave
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_system_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp
CREATE TRIGGER trigger_update_system_config_timestamp
  BEFORE UPDATE ON system_config
  FOR EACH ROW
  EXECUTE FUNCTION update_system_config_timestamp();

-- Inserir configurações padrão
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
  ('SUPABASE_URL', '', 'url', 'URL do projeto Supabase'),
  ('SUPABASE_SERVICE_KEY', '', 'password', 'Service Role Key do Supabase (permissões admin)'),
  ('N8N_WEBHOOK_CREATE_INSTANCE', '', 'url', 'Webhook n8n para criar instância WhatsApp'),
  ('N8N_WEBHOOK_REGENERATE_QR', '', 'url', 'Webhook n8n para regenerar QR Code'),
  ('N8N_WEBHOOK_DISCONNECT_INSTANCE', '', 'url', 'Webhook n8n para desconectar instância')
ON CONFLICT (config_key) DO NOTHING;

-- Políticas RLS (Row Level Security)
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Admin pode ler todas as configurações
CREATE POLICY "Admin can read system_config"
  ON system_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name = 'admin'
    )
  );

-- Admin pode atualizar todas as configurações
CREATE POLICY "Admin can update system_config"
  ON system_config
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name = 'admin'
    )
  );

COMMENT ON TABLE system_config IS 'Configurações do sistema gerenciáveis via interface admin';
COMMENT ON COLUMN system_config.config_key IS 'Chave única da configuração';
COMMENT ON COLUMN system_config.config_value IS 'Valor da configuração';
COMMENT ON COLUMN system_config.config_type IS 'Tipo de campo: text, password, url';
COMMENT ON COLUMN system_config.description IS 'Descrição da configuração';
COMMENT ON COLUMN system_config.is_encrypted IS 'Se o valor está criptografado';
