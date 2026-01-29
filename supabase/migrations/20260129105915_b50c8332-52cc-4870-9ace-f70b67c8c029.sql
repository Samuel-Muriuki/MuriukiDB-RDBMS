-- Drop the redundant leaderboard_public view
-- The application uses the get_leaderboard_public() RPC function instead
-- Having both creates confusion and potential security issues
DROP VIEW IF EXISTS public.leaderboard_public;