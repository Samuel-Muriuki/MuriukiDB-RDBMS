-- Fix critical security vulnerability: Leaderboard UPDATE policy allows anonymous modification of any entry
-- Remove the insecure policy and require authentication for updates

DROP POLICY IF EXISTS "Users can update own leaderboard entries" ON public.leaderboard;

-- Only authenticated users can update their own entries
CREATE POLICY "Authenticated users can update own entries"
ON public.leaderboard FOR UPDATE
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());