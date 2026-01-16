-- Enable full replica identity for complete row data on updates
ALTER TABLE public.rdbms_tables REPLICA IDENTITY FULL;
ALTER TABLE public.rdbms_rows REPLICA IDENTITY FULL;

-- Add tables to realtime publication for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.rdbms_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rdbms_rows;