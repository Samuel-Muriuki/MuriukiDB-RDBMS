-- RDBMS Metadata: stores table definitions created by users
CREATE TABLE public.rdbms_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL UNIQUE,
  columns JSONB NOT NULL DEFAULT '[]',
  indexes JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RDBMS Data: stores actual rows for user-created tables
CREATE TABLE public.rdbms_rows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES public.rdbms_tables(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RDBMS Query History: stores executed queries
CREATE TABLE public.rdbms_query_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  result JSONB,
  success BOOLEAN NOT NULL DEFAULT true,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rdbms_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rdbms_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rdbms_query_history ENABLE ROW LEVEL SECURITY;

-- Public access policies (demo app - no auth required)
CREATE POLICY "Allow public read access to tables" ON public.rdbms_tables FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to tables" ON public.rdbms_tables FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to tables" ON public.rdbms_tables FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to tables" ON public.rdbms_tables FOR DELETE USING (true);

CREATE POLICY "Allow public read access to rows" ON public.rdbms_rows FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to rows" ON public.rdbms_rows FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to rows" ON public.rdbms_rows FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to rows" ON public.rdbms_rows FOR DELETE USING (true);

CREATE POLICY "Allow public read access to history" ON public.rdbms_query_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to history" ON public.rdbms_query_history FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_rdbms_rows_table_id ON public.rdbms_rows(table_id);
CREATE INDEX idx_rdbms_rows_data ON public.rdbms_rows USING GIN(data);
CREATE INDEX idx_rdbms_query_history_created ON public.rdbms_query_history(created_at DESC);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.rdbms_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rdbms_rows;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rdbms_tables_updated_at
  BEFORE UPDATE ON public.rdbms_tables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rdbms_rows_updated_at
  BEFORE UPDATE ON public.rdbms_rows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();