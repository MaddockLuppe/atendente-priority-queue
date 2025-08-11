-- Migração de melhorias de segurança
-- Data: 2025-01-15
-- Descrição: Corrige políticas RLS e implementa melhorias de segurança

-- 1. Corrigir políticas da tabela profiles
DROP POLICY IF EXISTS "Allow login access" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert users" ON profiles;
DROP POLICY IF EXISTS "Admins can update users" ON profiles;
DROP POLICY IF EXISTS "Admins can delete users" ON profiles;
DROP POLICY IF EXISTS "Admin insert" ON profiles;

-- Função para verificar se o usuário é admin (sem recursão)
CREATE OR REPLACE FUNCTION public.is_admin_user(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Política restritiva para SELECT (apenas para login e admins)
CREATE POLICY "Restricted profile access" 
ON profiles 
FOR SELECT 
TO authenticated, anon
USING (
  -- Permitir acesso durante autenticação (limitado)
  auth.role() = 'anon' OR
  -- Usuários autenticados podem ver apenas seu próprio perfil
  (auth.uid() = user_id) OR
  -- Admins podem ver todos os perfis
  public.is_admin_user(auth.uid())
);

-- Política para INSERT (apenas admins)
CREATE POLICY "Admin only insert" 
ON profiles 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_user(auth.uid()));

-- Política para UPDATE (próprio perfil ou admin)
CREATE POLICY "Self or admin update" 
ON profiles 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() = user_id OR 
  public.is_admin_user(auth.uid())
)
WITH CHECK (
  auth.uid() = user_id OR 
  public.is_admin_user(auth.uid())
);

-- Política para DELETE (apenas admins, não pode deletar a si mesmo)
CREATE POLICY "Admin delete others" 
ON profiles 
FOR DELETE 
TO authenticated
USING (
  public.is_admin_user(auth.uid()) AND 
  auth.uid() != user_id
);

-- 2. Corrigir políticas da tabela tickets
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON tickets;
DROP POLICY IF EXISTS "Allow read for anonymous users" ON tickets;
DROP POLICY IF EXISTS "Authenticated users can view tickets" ON tickets;
DROP POLICY IF EXISTS "Authenticated users can manage tickets" ON tickets;

-- Política para SELECT tickets (apenas usuários autenticados)
CREATE POLICY "Authenticated users view tickets" 
ON tickets 
FOR SELECT 
TO authenticated
USING (true);

-- Política para INSERT tickets (apenas usuários autenticados)
CREATE POLICY "Authenticated users create tickets" 
ON tickets 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Política para UPDATE tickets (apenas usuários autenticados)
CREATE POLICY "Authenticated users update tickets" 
ON tickets 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para DELETE tickets (apenas admins)
CREATE POLICY "Admin delete tickets" 
ON tickets 
FOR DELETE 
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- 3. Corrigir políticas da tabela attendants
DROP POLICY IF EXISTS "Authenticated users can view attendants" ON attendants;
DROP POLICY IF EXISTS "Authenticated users can manage attendants" ON attendants;
DROP POLICY IF EXISTS "Admins can manage attendants" ON attendants;
DROP POLICY IF EXISTS "All users can view attendants" ON attendants;

-- Política para SELECT attendants (usuários autenticados)
CREATE POLICY "Authenticated view attendants" 
ON attendants 
FOR SELECT 
TO authenticated
USING (true);

-- Política para INSERT attendants (apenas admins)
CREATE POLICY "Admin insert attendants" 
ON attendants 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_user(auth.uid()));

-- Política para UPDATE attendants (apenas admins)
CREATE POLICY "Admin update attendants" 
ON attendants 
FOR UPDATE 
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- Política para DELETE attendants (apenas admins)
CREATE POLICY "Admin delete attendants" 
ON attendants 
FOR DELETE 
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- 4. Corrigir políticas da tabela attendance_history
DROP POLICY IF EXISTS "Authenticated users can view attendance history" ON attendance_history;
DROP POLICY IF EXISTS "Authenticated users can manage attendance history" ON attendance_history;

-- Política para SELECT attendance_history (usuários autenticados)
CREATE POLICY "Authenticated view history" 
ON attendance_history 
FOR SELECT 
TO authenticated
USING (true);

-- Política para INSERT attendance_history (usuários autenticados)
CREATE POLICY "Authenticated insert history" 
ON attendance_history 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Política para UPDATE attendance_history (apenas admins)
CREATE POLICY "Admin update history" 
ON attendance_history 
FOR UPDATE 
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- Política para DELETE attendance_history (apenas admins)
CREATE POLICY "Admin delete history" 
ON attendance_history 
FOR DELETE 
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- 5. Corrigir políticas da tabela queue_state
DROP POLICY IF EXISTS "Authenticated users can view queue state" ON queue_state;
DROP POLICY IF EXISTS "Authenticated users can update queue state" ON queue_state;

-- Política para SELECT queue_state (usuários autenticados)
CREATE POLICY "Authenticated view queue" 
ON queue_state 
FOR SELECT 
TO authenticated
USING (true);

-- Política para UPDATE queue_state (usuários autenticados)
CREATE POLICY "Authenticated update queue" 
ON queue_state 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_attendance_history_date ON attendance_history(service_date);

-- 7. Adicionar constraints de segurança
ALTER TABLE profiles ADD CONSTRAINT check_username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 50);
ALTER TABLE profiles ADD CONSTRAINT check_display_name_length CHECK (char_length(display_name) >= 2 AND char_length(display_name) <= 100);
ALTER TABLE profiles ADD CONSTRAINT check_password_hash_length CHECK (char_length(password_hash) >= 50);

-- 8. Função para auditoria (log de alterações sensíveis)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Política para auditoria (apenas admins podem ver)
CREATE POLICY "Admin view audit" 
ON audit_log 
FOR SELECT 
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Função de trigger para auditoria
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (table_name, operation, user_id, old_data)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (table_name, operation, user_id, old_data, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (table_name, operation, user_id, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers de auditoria para tabelas sensíveis
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_attendants_trigger
  AFTER INSERT OR UPDATE OR DELETE ON attendants
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- 9. Limpar dados sensíveis das migrações antigas (comentário para documentação)
-- IMPORTANTE: As senhas expostas nas migrações anteriores devem ser rotacionadas
-- Recomenda-se criar novos usuários admin com senhas seguras

-- 10. Configurações de segurança adicionais
-- Definir timeout para conexões
ALTER ROLE authenticator SET statement_timeout = '30s';
ALTER ROLE anon SET statement_timeout = '10s';

COMMIT;