import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    nickname: string
  ) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  verifyOtp: (email: string, token: string, type: 'signup' | 'recovery' | 'email_change') => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  updateEmail: (newEmail: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Track if we just completed an auth action to prevent race conditions
  const justCompletedAuthRef = useRef(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Don't update state if we just completed an auth action
        // This prevents the "bounce back" issue
        if (justCompletedAuthRef.current) {
          return;
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    nickname: string
  ): Promise<{ error: string | null; needsEmailConfirmation?: boolean }> => {
    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      const trimmedNickname = nickname.trim().replace(/\s+/g, ' ');

      if (!trimmedEmail || !trimmedPassword || !trimmedNickname) {
        return { error: 'All fields are required' };
      }

      if (trimmedPassword.length < 6) {
        return { error: 'Password must be at least 6 characters' };
      }

      if (trimmedNickname.length < 2 || trimmedNickname.length > 20) {
        return { error: 'Nickname must be 2-20 characters' };
      }

      // Check if nickname is taken
      const { data: existingNick } = await supabase
        .from('leaderboard')
        .select('id')
        .eq('nickname', trimmedNickname)
        .maybeSingle();

      if (existingNick) {
        return { error: 'Nickname already taken' };
      }

      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nickname: trimmedNickname,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { error: 'Email already registered. Use LOGIN command.' };
        }
        return { error: error.message };
      }

      // Check if email confirmation is needed
      const needsEmailConfirmation = !data.session;

      // If auto-confirm is enabled and we have a session, create leaderboard entry
      if (data.session && data.user) {
        // Set the flag to prevent race condition
        justCompletedAuthRef.current = true;
        
        // Update state immediately
        setSession(data.session);
        setUser(data.user);

        // Create leaderboard entry
        const { data: existing } = await supabase
          .from('leaderboard')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (!existing) {
          await supabase.from('leaderboard').insert({
            nickname: trimmedNickname,
            user_id: data.user.id,
            xp: 0,
            level: 1,
            queries_executed: 0,
            tables_created: 0,
            rows_inserted: 0,
            badges: [],
            current_streak: 0,
            highest_streak: 0,
          });
        }

        // Reset the flag after a short delay
        setTimeout(() => {
          justCompletedAuthRef.current = false;
        }, 2000);
      }

      return { error: null, needsEmailConfirmation };
    } catch (err: any) {
      return { error: err.message || 'Signup failed' };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      if (!trimmedEmail || !trimmedPassword) {
        return { error: 'Email and password are required' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (error) {
        if (error.message.includes('Invalid login')) {
          return { error: 'Invalid email or password' };
        }
        return { error: error.message };
      }

      if (data.user && data.session) {
        // Set the flag to prevent race condition
        justCompletedAuthRef.current = true;
        
        // Update state immediately
        setSession(data.session);
        setUser(data.user);

        // Ensure a leaderboard entry exists
        const nicknameFromMeta = (data.user.user_metadata as any)?.nickname as string | undefined;
        const fallbackNickname = trimmedEmail.split('@')[0]?.slice(0, 20) || 'Player';
        const nickname = (nicknameFromMeta || fallbackNickname).trim();

        const { data: existing } = await supabase
          .from('leaderboard')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (!existing) {
          await supabase.from('leaderboard').insert({
            nickname,
            user_id: data.user.id,
            xp: 0,
            level: 1,
            queries_executed: 0,
            tables_created: 0,
            rows_inserted: 0,
            badges: [],
            current_streak: 0,
            highest_streak: 0,
          });
        }

        // Reset the flag after a short delay
        setTimeout(() => {
          justCompletedAuthRef.current = false;
        }, 2000);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Login failed' };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<{ error: string | null }> => {
    try {
      const trimmedEmail = email.trim();

      if (!trimmedEmail) {
        return { error: 'Email is required' };
      }

      // Use signInWithOtp with shouldCreateUser: false to send a 6-digit code
      // This allows OTP verification flow instead of magic link
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        if (error.message.includes('User not found') || error.message.includes('user_not_found')) {
          return { error: 'No account found with this email' };
        }
        return { error: error.message };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Reset failed' };
    }
  }, []);

  const verifyOtp = useCallback(async (
    email: string,
    token: string,
    type: 'signup' | 'recovery' | 'email_change'
  ): Promise<{ error: string | null }> => {
    try {
      // Map our types to Supabase's expected types
      const otpType = type === 'recovery' ? 'email' : type;
      
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: otpType,
      });

      if (error) {
        if (error.message.includes('expired')) {
          return { error: 'Code has expired. Please request a new one.' };
        }
        if (error.message.includes('invalid')) {
          return { error: 'Invalid code. Please check and try again.' };
        }
        return { error: error.message };
      }

      if (data.user && data.session) {
        // Set the flag to prevent race condition
        justCompletedAuthRef.current = true;
        
        // Update state immediately
        setSession(data.session);
        setUser(data.user);

        // For signup, create leaderboard entry after verification
        if (type === 'signup') {
          const nicknameFromMeta = (data.user.user_metadata as any)?.nickname as string | undefined;
          const fallbackNickname = email.split('@')[0]?.slice(0, 20) || 'Player';
          const nickname = (nicknameFromMeta || fallbackNickname).trim();

          const { data: existing } = await supabase
            .from('leaderboard')
            .select('id')
            .eq('user_id', data.user.id)
            .maybeSingle();

          if (!existing) {
            await supabase.from('leaderboard').insert({
              nickname,
              user_id: data.user.id,
              xp: 0,
              level: 1,
              queries_executed: 0,
              tables_created: 0,
              rows_inserted: 0,
              badges: [],
              current_streak: 0,
              highest_streak: 0,
            });
          }
        }

        // Reset the flag after a short delay
        setTimeout(() => {
          justCompletedAuthRef.current = false;
        }, 2000);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Verification failed' };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Password update failed' };
    }
  }, []);

  const updateEmail = useCallback(async (newEmail: string): Promise<{ error: string | null }> => {
    try {
      const trimmedEmail = newEmail.trim();
      
      if (!trimmedEmail) {
        return { error: 'Email is required' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return { error: 'Invalid email format' };
      }

      const { error } = await supabase.auth.updateUser({
        email: trimmedEmail,
      });

      if (error) {
        if (error.message.includes('already')) {
          return { error: 'This email is already in use' };
        }
        return { error: error.message };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Email update failed' };
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
      verifyOtp,
      updatePassword,
      updateEmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return {
      user: null,
      session: null,
      loading: true,
      signUp: async () => ({ error: 'Auth not initialized' }),
      signIn: async () => ({ error: 'Auth not initialized' }),
      signOut: async () => {},
      resetPassword: async () => ({ error: 'Auth not initialized' }),
      verifyOtp: async () => ({ error: 'Auth not initialized' }),
      updatePassword: async () => ({ error: 'Auth not initialized' }),
      updateEmail: async () => ({ error: 'Auth not initialized' }),
    } as AuthContextType;
  }
  return context;
};
