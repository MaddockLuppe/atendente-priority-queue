-- Corrigir políticas RLS para queue_state
-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Authenticated users can view queue state" ON public.queue_state;
DROP POLICY IF EXISTS "Authenticated users can update queue state" ON public.queue_state;
DROP POLICY IF EXISTS "Anyone can view queue state" ON public.queue_state;
DROP POLICY IF EXISTS "Anyone can update queue state" ON public.queue_state;

-- Criar políticas simples e funcionais para todas as operações
CREATE POLICY "Allow all operations on queue state" 
ON public.queue_state 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Garantir que RLS está habilitado
ALTER TABLE public.queue_state ENABLE ROW LEVEL SECURITY;

-- Criar função RPC para inicializar estado da fila
CREATE OR REPLACE FUNCTION public.initialize_queue_state()
RETURNS TABLE(
  id uuid,
  next_preferential_number integer,
  next_normal_number integer,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se já existe um registro
  IF EXISTS (SELECT 1 FROM public.queue_state LIMIT 1) THEN
    -- Retornar o registro existente
    RETURN QUERY
    SELECT qs.id, qs.next_preferential_number, qs.next_normal_number, qs.updated_at
    FROM public.queue_state qs
    LIMIT 1;
  ELSE
    -- Inserir e retornar novo registro
    RETURN QUERY
    INSERT INTO public.queue_state (next_preferential_number, next_normal_number)
    VALUES (1, 1)
    RETURNING queue_state.id, queue_state.next_preferential_number, queue_state.next_normal_number, queue_state.updated_at;
  END IF;
END;
$$;

-- Conceder permissões para executar a função RPC
GRANT EXECUTE ON FUNCTION public.initialize_queue_state() TO anon, authenticated;

-- Inserir estado inicial da fila se não existir
INSERT INTO public.queue_state (next_preferential_number, next_normal_number)
SELECT 1, 1
WHERE NOT EXISTS (SELECT 1 FROM public.queue_state);