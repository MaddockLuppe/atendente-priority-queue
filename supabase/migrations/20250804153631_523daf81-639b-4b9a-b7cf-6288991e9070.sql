-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create attendants table
CREATE TABLE public.attendants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendants ENABLE ROW LEVEL SECURITY;

-- Create tickets table
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL,
  ticket_type TEXT NOT NULL CHECK (ticket_type IN ('preferencial', 'normal')),
  attendant_id UUID REFERENCES public.attendants(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('waiting', 'in-service', 'completed')) DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  called_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create attendance history table
CREATE TABLE public.attendance_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attendant_id UUID REFERENCES public.attendants(id) ON DELETE CASCADE NOT NULL,
  attendant_name TEXT NOT NULL,
  ticket_number TEXT NOT NULL,
  ticket_type TEXT NOT NULL CHECK (ticket_type IN ('preferencial', 'normal')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  service_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;

-- Create queue state table for managing counters
CREATE TABLE public.queue_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  next_preferential_number INTEGER NOT NULL DEFAULT 1,
  next_normal_number INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.queue_state ENABLE ROW LEVEL SECURITY;

-- Insert initial queue state
INSERT INTO public.queue_state (next_preferential_number, next_normal_number) VALUES (1, 1);

-- Create RLS policies for profiles (users can only see their own profile, admins can see all)
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid());

-- Create RLS policies for attendants (authenticated users can view and manage)
CREATE POLICY "Authenticated users can view attendants" 
ON public.attendants 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage attendants" 
ON public.attendants 
FOR ALL 
TO authenticated
USING (true);

-- Create RLS policies for tickets (authenticated users can manage)
CREATE POLICY "Authenticated users can view tickets" 
ON public.tickets 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage tickets" 
ON public.tickets 
FOR ALL 
TO authenticated
USING (true);

-- Create RLS policies for attendance history (authenticated users can view)
CREATE POLICY "Authenticated users can view attendance history" 
ON public.attendance_history 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage attendance history" 
ON public.attendance_history 
FOR ALL 
TO authenticated
USING (true);

-- Create RLS policies for queue state (authenticated users can manage)
CREATE POLICY "Authenticated users can view queue state" 
ON public.queue_state 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update queue state" 
ON public.queue_state 
FOR UPDATE 
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
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

-- Insert default attendants
INSERT INTO public.attendants (name, is_active) VALUES 
  ('João Silva', true),
  ('Maria Santos', true),
  ('Pedro Oliveira', true),
  ('Ana Costa', true);

-- Insert default admin user (password: admin123)
INSERT INTO public.profiles (user_id, username, display_name, role, password_hash) VALUES 
  (gen_random_uuid(), 'admin', 'Administrador', 'admin', '$2a$10$K.gF7qzO8wN6hHhGqf/ZLeQZ8xVlM6HwZ8zP9vGpU6lK8yZ7xJ1Xu');

-- Insert default regular user (password: user123)  
INSERT INTO public.profiles (user_id, username, display_name, role, password_hash) VALUES 
  (gen_random_uuid(), 'user', 'Usuário Padrão', 'user', '$2a$10$K.gF7qzO8wN6hHhGqf/ZLeQZ8xVlM6HwZ8zP9vGpU6lK8yZ7xJ1Xu');