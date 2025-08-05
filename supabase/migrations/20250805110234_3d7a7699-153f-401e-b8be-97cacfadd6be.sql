-- Criar tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'attendant' CHECK (role IN ('admin', 'attendant', 'viewer')),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid());

-- Criar tabela de atendentes
CREATE TABLE public.attendants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.attendants ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para attendants
CREATE POLICY "Authenticated users can view attendants" 
ON public.attendants 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage attendants" 
ON public.attendants 
FOR ALL 
USING (true);

-- Criar tabela de tickets
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL,
  ticket_type TEXT NOT NULL CHECK (ticket_type IN ('preferencial', 'normal')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in-service', 'completed')),
  attendant_id UUID REFERENCES public.attendants(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  called_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tickets
CREATE POLICY "Authenticated users can view tickets" 
ON public.tickets 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage tickets" 
ON public.tickets 
FOR ALL 
USING (true);

-- Criar tabela de histórico de atendimentos
CREATE TABLE public.attendance_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attendant_id UUID NOT NULL,
  attendant_name TEXT NOT NULL,
  ticket_number TEXT NOT NULL,
  ticket_type TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  service_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para attendance_history
CREATE POLICY "Authenticated users can view attendance history" 
ON public.attendance_history 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage attendance history" 
ON public.attendance_history 
FOR ALL 
USING (true);

-- Criar tabela de estado da fila
CREATE TABLE public.queue_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  next_preferential_number INTEGER NOT NULL DEFAULT 1,
  next_normal_number INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.queue_state ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para queue_state
CREATE POLICY "Authenticated users can view queue state" 
ON public.queue_state 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can update queue state" 
ON public.queue_state 
FOR UPDATE 
USING (true);

-- Inserir dados iniciais dos atendentes
INSERT INTO public.attendants (name) VALUES
  ('pai'),
  ('mae'),
  ('moane'),
  ('elizabeth'),
  ('jeovane'),
  ('felipe'),
  ('luiz walter'),
  ('lara'),
  ('levi'),
  ('talles'),
  ('wellingtom');

-- Inserir usuário admin inicial
INSERT INTO public.profiles (user_id, username, display_name, role, password_hash) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Administrador', 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Inserir estado inicial da fila
INSERT INTO public.queue_state (next_preferential_number, next_normal_number) VALUES (1, 1);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendants_updated_at
  BEFORE UPDATE ON public.attendants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_queue_state_updated_at
  BEFORE UPDATE ON public.queue_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();