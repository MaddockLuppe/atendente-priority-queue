-- Corrigir definitivamente as políticas RLS para attendance_history
-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Authenticated users can view attendance history" ON public.attendance_history;
DROP POLICY IF EXISTS "Authenticated users can manage attendance history" ON public.attendance_history;
DROP POLICY IF EXISTS "Anyone can view attendance history" ON public.attendance_history;
DROP POLICY IF EXISTS "Anyone can insert attendance history" ON public.attendance_history;
DROP POLICY IF EXISTS "Anyone can update attendance history" ON public.attendance_history;
DROP POLICY IF EXISTS "Anyone can delete attendance history" ON public.attendance_history;
DROP POLICY IF EXISTS "Everyone can view attendance history" ON public.attendance_history;
DROP POLICY IF EXISTS "Authenticated users can insert attendance history" ON public.attendance_history;
DROP POLICY IF EXISTS "Authenticated users can update attendance history" ON public.attendance_history;
DROP POLICY IF EXISTS "Authenticated users can delete attendance history" ON public.attendance_history;

-- Criar políticas simples e funcionais
CREATE POLICY "Allow all operations on attendance history" 
ON public.attendance_history 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Garantir que RLS está habilitado
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;

-- Verificar se a função RPC existe e recriar se necessário
CREATE OR REPLACE FUNCTION public.insert_attendance_history(
  p_attendant_id uuid,
  p_attendant_name text,
  p_ticket_number text,
  p_ticket_type text,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_service_date date
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $$
BEGIN
  -- Log dos parâmetros recebidos
  RAISE NOTICE 'Inserindo histórico: attendant_id=%, attendant_name=%, ticket_number=%, ticket_type=%, start_time=%, end_time=%, service_date=%', 
    p_attendant_id, p_attendant_name, p_ticket_number, p_ticket_type, p_start_time, p_end_time, p_service_date;
  
  -- Inserir dados no histórico
  INSERT INTO public.attendance_history (
    attendant_id,
    attendant_name,
    ticket_number,
    ticket_type,
    start_time,
    end_time,
    service_date
  ) VALUES (
    p_attendant_id,
    p_attendant_name,
    p_ticket_number,
    p_ticket_type,
    p_start_time,
    p_end_time,
    p_service_date
  );

  RAISE NOTICE 'Histórico inserido com sucesso';
  
  RETURN json_build_object(
    'success', true,
    'message', 'Histórico inserido com sucesso'
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao inserir histórico: %', SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;