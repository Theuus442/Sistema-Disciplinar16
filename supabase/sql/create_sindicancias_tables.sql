-- Tabela principal de Sindicâncias
CREATE TABLE IF NOT EXISTS public.sindicancias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id text NOT NULL,
  numero_sindicancia text NOT NULL,
  nome_instituidor text NOT NULL,
  cpf_instituidor text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(process_id)
);

-- Tabela de membros da comissão de sindicância
CREATE TABLE IF NOT EXISTS public.comissao_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sindicancia_id uuid NOT NULL REFERENCES public.sindicancias(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cargo text NOT NULL,
  funcao_comissao text NOT NULL, -- Presidente, Secretário I, Secretário II, Membro, etc.
  oab text, -- Campo opcional para advogado
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de testemunhas da sindicância
CREATE TABLE IF NOT EXISTS public.sindicancia_testemunhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sindicancia_id uuid NOT NULL REFERENCES public.sindicancias(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cpf text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_sindicancias_process_id ON public.sindicancias(process_id);
CREATE INDEX IF NOT EXISTS idx_comissao_membros_sindicancia_id ON public.comissao_membros(sindicancia_id);
CREATE INDEX IF NOT EXISTS idx_sindicancia_testemunhas_sindicancia_id ON public.sindicancia_testemunhas(sindicancia_id);

-- Observação: Para executar este SQL você precisa de privilégios de admin no Supabase (p.ex. via SQL editor no painel ou psql com service role key).
