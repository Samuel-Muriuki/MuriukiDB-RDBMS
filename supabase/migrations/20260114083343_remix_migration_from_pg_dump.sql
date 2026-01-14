CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: cleanup_inactive_users(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_inactive_users() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Delete leaderboard entries for users who:
  -- 1. Have no user_id (not registered)
  -- 2. Haven't been active in the last 7 days
  DELETE FROM public.leaderboard
  WHERE user_id IS NULL
    AND last_seen < NOW() - INTERVAL '7 days';
    
  -- Also delete old session-based RDBMS data (older than 7 days)
  -- First delete rows from tables that are old
  DELETE FROM public.rdbms_rows
  WHERE table_id IN (
    SELECT id FROM public.rdbms_tables 
    WHERE user_id IS NULL 
    AND created_at < NOW() - INTERVAL '7 days'
  );
  
  -- Then delete old tables
  DELETE FROM public.rdbms_tables
  WHERE user_id IS NULL
    AND created_at < NOW() - INTERVAL '7 days';
    
  -- Clean old query history (older than 30 days for registered, 7 days for anonymous)
  DELETE FROM public.rdbms_query_history
  WHERE (user_id IS NULL AND created_at < NOW() - INTERVAL '7 days')
     OR (user_id IS NOT NULL AND created_at < NOW() - INTERVAL '30 days');
END;
$$;


--
-- Name: compute_user_streak(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.compute_user_streak(p_user_id uuid) RETURNS TABLE(current_streak integer, highest_streak integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_current_streak INTEGER := 0;
  v_check_date DATE := CURRENT_DATE;
  v_has_today BOOLEAN;
  v_has_date BOOLEAN;
BEGIN
  -- Check if user has activity today
  SELECT EXISTS(
    SELECT 1 FROM daily_activity 
    WHERE user_id = p_user_id AND activity_date = CURRENT_DATE
  ) INTO v_has_today;
  
  -- If no activity today, start checking from yesterday
  IF NOT v_has_today THEN
    v_check_date := CURRENT_DATE - 1;
  END IF;
  
  -- Count consecutive days backwards
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM daily_activity 
      WHERE user_id = p_user_id AND activity_date = v_check_date
    ) INTO v_has_date;
    
    EXIT WHEN NOT v_has_date;
    
    v_current_streak := v_current_streak + 1;
    v_check_date := v_check_date - 1;
  END LOOP;
  
  -- Get highest streak from leaderboard (or use current if higher)
  RETURN QUERY
  SELECT 
    v_current_streak,
    GREATEST(v_current_streak, COALESCE(l.highest_streak, 0))
  FROM leaderboard l
  WHERE l.user_id = p_user_id;
  
  -- If no leaderboard entry, just return current values
  IF NOT FOUND THEN
    current_streak := v_current_streak;
    highest_streak := v_current_streak;
    RETURN NEXT;
  END IF;
END;
$$;


--
-- Name: record_query_activity(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_query_activity(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_streak RECORD;
BEGIN
  -- Upsert daily activity
  INSERT INTO daily_activity (user_id, activity_date, queries_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, activity_date) 
  DO UPDATE SET 
    queries_count = daily_activity.queries_count + 1,
    updated_at = now();
  
  -- Compute and update streaks in leaderboard
  SELECT * INTO v_streak FROM compute_user_streak(p_user_id);
  
  IF v_streak IS NOT NULL THEN
    UPDATE leaderboard
    SET 
      current_streak = v_streak.current_streak,
      highest_streak = GREATEST(highest_streak, v_streak.highest_streak),
      last_seen = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: daily_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_activity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    activity_date date DEFAULT CURRENT_DATE NOT NULL,
    queries_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: leaderboard; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leaderboard (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nickname text NOT NULL,
    xp integer DEFAULT 0 NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    queries_executed integer DEFAULT 0 NOT NULL,
    tables_created integer DEFAULT 0 NOT NULL,
    rows_inserted integer DEFAULT 0 NOT NULL,
    badges text[] DEFAULT '{}'::text[],
    browser_fingerprint text,
    last_seen timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    highest_streak integer DEFAULT 0 NOT NULL,
    current_streak integer DEFAULT 0 NOT NULL
);


--
-- Name: leaderboard_public; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.leaderboard_public WITH (security_invoker='on') AS
 SELECT id,
    nickname,
    xp,
    level,
    queries_executed,
    tables_created,
    rows_inserted,
    current_streak,
    highest_streak,
    badges,
    last_seen,
    created_at
   FROM public.leaderboard;


--
-- Name: rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    endpoint text DEFAULT 'sql-execute'::text NOT NULL,
    request_count integer DEFAULT 1 NOT NULL,
    window_start timestamp with time zone DEFAULT now() NOT NULL,
    last_request timestamp with time zone DEFAULT now() NOT NULL,
    backoff_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: rdbms_query_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rdbms_query_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    query text NOT NULL,
    result jsonb,
    success boolean DEFAULT true NOT NULL,
    execution_time_ms integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    session_id text,
    user_id uuid
);


--
-- Name: rdbms_rows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rdbms_rows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    table_id uuid NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    session_id text
);


--
-- Name: rdbms_tables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rdbms_tables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    table_name text NOT NULL,
    columns jsonb DEFAULT '[]'::jsonb NOT NULL,
    indexes jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    session_id text,
    user_id uuid
);


--
-- Name: daily_activity daily_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_activity
    ADD CONSTRAINT daily_activity_pkey PRIMARY KEY (id);


--
-- Name: daily_activity daily_activity_user_id_activity_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_activity
    ADD CONSTRAINT daily_activity_user_id_activity_date_key UNIQUE (user_id, activity_date);


--
-- Name: leaderboard leaderboard_nickname_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard
    ADD CONSTRAINT leaderboard_nickname_key UNIQUE (nickname);


--
-- Name: leaderboard leaderboard_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard
    ADD CONSTRAINT leaderboard_pkey PRIMARY KEY (id);


--
-- Name: rate_limits rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (id);


--
-- Name: rdbms_query_history rdbms_query_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rdbms_query_history
    ADD CONSTRAINT rdbms_query_history_pkey PRIMARY KEY (id);


--
-- Name: rdbms_rows rdbms_rows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rdbms_rows
    ADD CONSTRAINT rdbms_rows_pkey PRIMARY KEY (id);


--
-- Name: rdbms_tables rdbms_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rdbms_tables
    ADD CONSTRAINT rdbms_tables_pkey PRIMARY KEY (id);


--
-- Name: rdbms_tables rdbms_tables_table_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rdbms_tables
    ADD CONSTRAINT rdbms_tables_table_name_key UNIQUE (table_name);


--
-- Name: idx_leaderboard_fingerprint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaderboard_fingerprint ON public.leaderboard USING btree (browser_fingerprint);


--
-- Name: idx_leaderboard_last_seen; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaderboard_last_seen ON public.leaderboard USING btree (last_seen);


--
-- Name: idx_leaderboard_nickname; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaderboard_nickname ON public.leaderboard USING btree (nickname);


--
-- Name: idx_leaderboard_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaderboard_user_id ON public.leaderboard USING btree (user_id);


--
-- Name: idx_leaderboard_xp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaderboard_xp ON public.leaderboard USING btree (xp DESC);


--
-- Name: idx_rate_limits_identifier_endpoint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limits_identifier_endpoint ON public.rate_limits USING btree (identifier, endpoint);


--
-- Name: idx_rate_limits_window; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limits_window ON public.rate_limits USING btree (window_start);


--
-- Name: idx_rdbms_query_history_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rdbms_query_history_created ON public.rdbms_query_history USING btree (created_at DESC);


--
-- Name: idx_rdbms_rows_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rdbms_rows_data ON public.rdbms_rows USING gin (data);


--
-- Name: idx_rdbms_rows_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rdbms_rows_session ON public.rdbms_rows USING btree (session_id);


--
-- Name: idx_rdbms_rows_table_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rdbms_rows_table_id ON public.rdbms_rows USING btree (table_id);


--
-- Name: idx_rdbms_tables_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rdbms_tables_session ON public.rdbms_tables USING btree (session_id);


--
-- Name: daily_activity update_daily_activity_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_daily_activity_updated_at BEFORE UPDATE ON public.daily_activity FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: leaderboard update_leaderboard_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE ON public.leaderboard FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: rdbms_rows update_rdbms_rows_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_rdbms_rows_updated_at BEFORE UPDATE ON public.rdbms_rows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: rdbms_tables update_rdbms_tables_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_rdbms_tables_updated_at BEFORE UPDATE ON public.rdbms_tables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: daily_activity daily_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_activity
    ADD CONSTRAINT daily_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: leaderboard leaderboard_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard
    ADD CONSTRAINT leaderboard_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: rdbms_query_history rdbms_query_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rdbms_query_history
    ADD CONSTRAINT rdbms_query_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: rdbms_rows rdbms_rows_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rdbms_rows
    ADD CONSTRAINT rdbms_rows_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.rdbms_tables(id) ON DELETE CASCADE;


--
-- Name: rdbms_tables rdbms_tables_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rdbms_tables
    ADD CONSTRAINT rdbms_tables_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: leaderboard Anyone can read leaderboard entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read leaderboard entries" ON public.leaderboard FOR SELECT USING (true);


--
-- Name: leaderboard Authenticated users can delete own entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete own entries" ON public.leaderboard FOR DELETE USING (((auth.uid() IS NOT NULL) AND (user_id = auth.uid())));


--
-- Name: daily_activity Authenticated users can insert own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert own activity" ON public.daily_activity FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND (auth.uid() = user_id)));


--
-- Name: daily_activity Authenticated users can update own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update own activity" ON public.daily_activity FOR UPDATE USING (((auth.uid() IS NOT NULL) AND (auth.uid() = user_id)));


--
-- Name: leaderboard Authenticated users can update own entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update own entries" ON public.leaderboard FOR UPDATE USING (((auth.uid() IS NOT NULL) AND (user_id = auth.uid())));


--
-- Name: daily_activity Authenticated users can view own activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view own activity" ON public.daily_activity FOR SELECT USING (((auth.uid() IS NOT NULL) AND (auth.uid() = user_id)));


--
-- Name: rate_limits Service role only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role only" ON public.rate_limits USING (false) WITH CHECK (false);


--
-- Name: rdbms_tables Users can create tables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create tables" ON public.rdbms_tables FOR INSERT WITH CHECK (((session_id IS NOT NULL) OR ((auth.uid() IS NOT NULL) AND (user_id = auth.uid()))));


--
-- Name: rdbms_tables Users can delete own tables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own tables" ON public.rdbms_tables FOR DELETE USING (((session_id IS NOT NULL) OR ((auth.uid() IS NOT NULL) AND (user_id = auth.uid()))));


--
-- Name: rdbms_rows Users can delete rows from own tables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete rows from own tables" ON public.rdbms_rows FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.rdbms_tables t
  WHERE ((t.id = rdbms_rows.table_id) AND ((t.session_id IS NOT NULL) OR ((auth.uid() IS NOT NULL) AND (t.user_id = auth.uid())))))));


--
-- Name: leaderboard Users can insert leaderboard entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert leaderboard entries" ON public.leaderboard FOR INSERT WITH CHECK ((((auth.uid() IS NOT NULL) AND (user_id = auth.uid())) OR ((auth.uid() IS NULL) AND (user_id IS NULL))));


--
-- Name: rdbms_query_history Users can insert own query history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own query history" ON public.rdbms_query_history FOR INSERT WITH CHECK (((session_id IS NOT NULL) OR ((auth.uid() IS NOT NULL) AND (user_id = auth.uid()))));


--
-- Name: rdbms_rows Users can insert rows to own tables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert rows to own tables" ON public.rdbms_rows FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.rdbms_tables t
  WHERE ((t.id = rdbms_rows.table_id) AND ((t.session_id IS NOT NULL) OR ((auth.uid() IS NOT NULL) AND (t.user_id = auth.uid())))))));


--
-- Name: rdbms_query_history Users can read own query history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own query history" ON public.rdbms_query_history FOR SELECT USING (((session_id IS NOT NULL) OR ((auth.uid() IS NOT NULL) AND (user_id = auth.uid()))));


--
-- Name: rdbms_tables Users can read own tables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own tables" ON public.rdbms_tables FOR SELECT USING (((session_id IS NOT NULL) OR ((auth.uid() IS NOT NULL) AND (user_id = auth.uid()))));


--
-- Name: rdbms_rows Users can read rows from own tables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read rows from own tables" ON public.rdbms_rows FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.rdbms_tables t
  WHERE ((t.id = rdbms_rows.table_id) AND ((t.session_id IS NOT NULL) OR ((auth.uid() IS NOT NULL) AND (t.user_id = auth.uid())))))));


--
-- Name: rdbms_tables Users can update own tables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own tables" ON public.rdbms_tables FOR UPDATE USING (((session_id IS NOT NULL) OR ((auth.uid() IS NOT NULL) AND (user_id = auth.uid()))));


--
-- Name: rdbms_rows Users can update rows in own tables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update rows in own tables" ON public.rdbms_rows FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.rdbms_tables t
  WHERE ((t.id = rdbms_rows.table_id) AND ((t.session_id IS NOT NULL) OR ((auth.uid() IS NOT NULL) AND (t.user_id = auth.uid())))))));


--
-- Name: daily_activity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;

--
-- Name: leaderboard; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

--
-- Name: rate_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: rdbms_query_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rdbms_query_history ENABLE ROW LEVEL SECURITY;

--
-- Name: rdbms_rows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rdbms_rows ENABLE ROW LEVEL SECURITY;

--
-- Name: rdbms_tables; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rdbms_tables ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;