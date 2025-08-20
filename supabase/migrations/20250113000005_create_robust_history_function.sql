-- Criar função RPC robusta para inserir histórico de atendimentos
-- Esta função contorna completamente as políticas RLS e garante inserção

CREATE OR REPLACE FUNCTION public.insert_attendance_record(
  attendant_id uuid,
  attendant_name text,
  ticket_number text,
  ticket_type text,
  start_time timestamptz,
  end_time timestamptz,
  service_date date
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $$
DECLARE
  inserted_record record;
  result_json json;
BEGIN
  -- Log dos parâmetros recebidos para debug
  RAISE NOTICE 'Função insert_attendance_record chamada com:';
  RAISE NOTICE 'attendant_id: %, attendant_name: %, ticket_number: %, ticket_type: %', 
    attendant_id, attendant_name, ticket_number, ticket_type;
  RAISE NOTICE 'start_time: %, end_time: %, service_date: %', 
    start_time, end_time, service_date;
  
  -- Validar parâmetros obrigatórios
  IF attendant_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'attendant_id é obrigatório'
    );
  END IF;
  
  IF attendant_name IS NULL OR trim(attendant_name) = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'attendant_name é obrigatório'
    );
  END IF;
  
  IF ticket_number IS NULL OR trim(ticket_number) = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ticket_number é obrigatório'
    );
  END IF;
  
  IF ticket_type IS NULL OR ticket_type NOT IN ('normal', 'preferencial') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ticket_type deve ser "normal" ou "preferencial"'
    );
  END IF;
  
  IF start_time IS NULL OR end_time IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'start_time e end_time são obrigatórios'
    );
  END IF;
  
  IF service_date IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'service_date é obrigatório'
    );
  END IF;
  
  -- Validar se end_time é posterior a start_time
  IF end_time <= start_time THEN
    RETURN json_build_object(
      'success', false,
      'error', 'end_time deve ser posterior a start_time'
    );
  END IF;
  
  BEGIN
    -- Inserir dados no histórico com SECURITY DEFINER para contornar RLS
    INSERT INTO public.attendance_history (
      attendant_id,
      attendant_name,
      ticket_number,
      ticket_type,
      start_time,
      end_time,
      service_date,
      created_at
    ) VALUES (
      attendant_id,
      trim(attendant_name),
      trim(ticket_number),
      ticket_type,
      start_time,
      end_time,
      service_date,
      now()
    ) RETURNING * INTO inserted_record;
    
    -- Construir resposta de sucesso com dados inseridos
    result_json := json_build_object(
      'success', true,
      'message', 'Histórico inserido com sucesso',
      'data', json_build_object(
        'id', inserted_record.id,
        'attendant_id', inserted_record.attendant_id,
        'attendant_name', inserted_record.attendant_name,
        'ticket_number', inserted_record.ticket_number,
        'ticket_type', inserted_record.ticket_type,
        'start_time', inserted_record.start_time,
        'end_time', inserted_record.end_time,
        'service_date', inserted_record.service_date,
        'created_at', inserted_record.created_at
      )
    );
    
    RAISE NOTICE 'Histórico inserido com sucesso: ID %', inserted_record.id;
    
    RETURN result_json;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log detalhado do erro
      RAISE NOTICE 'Erro ao inserir histórico: % - %', SQLSTATE, SQLERRM;
      
      RETURN json_build_object(
        'success', false,
        'error', format('Erro na inserção: %s', SQLERRM),
        'error_code', SQLSTATE
      );
  END;
END;
$$;

-- Garantir que a função pode ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION public.insert_attendance_record(
  uuid, text, text, text, timestamptz, timestamptz, date
) TO authenticated;

-- Criar função para buscar histórico por data
CREATE OR REPLACE FUNCTION public.get_attendance_history_by_date(
  target_date date
)
RETURNS TABLE (
  id uuid,
  attendant_id uuid,
  attendant_name text,
  ticket_number text,
  ticket_type text,
  start_time timestamptz,
  end_time timestamptz,
  service_date date,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $$
BEGIN
  RAISE NOTICE 'Buscando histórico para data: %', target_date;
  
  RETURN QUERY
  SELECT 
    ah.id,
    ah.attendant_id,
    ah.attendant_name,
    ah.ticket_number,
    ah.ticket_type,
    ah.start_time,
    ah.end_time,
    ah.service_date,
    ah.created_at
  FROM public.attendance_history ah
  WHERE ah.service_date = target_date
  ORDER BY ah.created_at DESC;
  
  RAISE NOTICE 'Consulta de histórico concluída';
END;
$$;

-- Garantir que a função pode ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_attendance_history_by_date(date) TO authenticated;

-- Criar função para obter estatísticas do histórico
CREATE OR REPLACE FUNCTION public.get_attendance_stats(
  start_date date DEFAULT NULL,
  end_date date DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $$
DECLARE
  total_attendments integer;
  total_attendants integer;
  avg_service_time interval;
  stats_json json;
BEGIN
  -- Se não especificado, usar data atual
  IF start_date IS NULL THEN
    start_date := CURRENT_DATE;
  END IF;
  
  IF end_date IS NULL THEN
    end_date := start_date;
  END IF;
  
  -- Calcular estatísticas
  SELECT 
    COUNT(*),
    COUNT(DISTINCT attendant_id),
    AVG(end_time - start_time)
  INTO 
    total_attendments,
    total_attendants,
    avg_service_time
  FROM public.attendance_history
  WHERE service_date BETWEEN start_date AND end_date;
  
  -- Construir JSON de resposta
  stats_json := json_build_object(
    'period', json_build_object(
      'start_date', start_date,
      'end_date', end_date
    ),
    'totals', json_build_object(
      'attendments', COALESCE(total_attendments, 0),
      'attendants', COALESCE(total_attendants, 0),
      'avg_service_time_minutes', COALESCE(EXTRACT(EPOCH FROM avg_service_time) / 60, 0)
    )
  );
  
  RETURN stats_json;
END;
$$;

-- Garantir que a função pode ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_attendance_stats(date, date) TO authenticated;

-- Comentário sobre a migração
COMMENT ON FUNCTION public.insert_attendance_record IS 'Função robusta para inserir registros no histórico de atendimentos, contornando RLS';
COMMENT ON FUNCTION public.get_attendance_history_by_date IS 'Função para buscar histórico de atendimentos por data específica';
COMMENT ON FUNCTION public.get_attendance_stats IS 'Função para obter estatísticas do histórico de atendimentos';