-- Criar função para inserir registros de histórico de atendimento
CREATE OR REPLACE FUNCTION public.insert_attendance_history(
  p_attendant_id uuid,
  p_attendant_name text,
  p_ticket_number text,
  p_ticket_type text,
  p_start_time timestamp with time zone,
  p_end_time timestamp with time zone,
  p_service_date date
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
BEGIN
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
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;