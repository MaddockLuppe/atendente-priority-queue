-- Criar função RPC para inserir histórico de atendimentos
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

  RETURN json_build_object(
    'success', true,
    'message', 'Histórico inserido com sucesso'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;