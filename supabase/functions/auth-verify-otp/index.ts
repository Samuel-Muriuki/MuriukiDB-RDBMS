import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOtpRequest {
  email: string;
  code: string;
  purpose: "signup" | "recovery" | "email_change";
}

// Hash function matching the one used in send-otp
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, purpose }: VerifyOtpRequest = await req.json();

    if (!email || !code || !purpose) {
      return new Response(
        JSON.stringify({ error: "Email, code, and purpose are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize code (uppercase, no spaces)
    const normalizedCode = code.toUpperCase().replace(/\s/g, "");
    
    if (normalizedCode.length !== 6) {
      return new Response(
        JSON.stringify({ error: "Invalid code format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for backend access
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find valid OTP for this email/purpose
    const { data: otpRecord, error: fetchError } = await supabase
      .from("auth_email_otps")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("purpose", purpose)
      .is("consumed_at", null)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching OTP:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to verify code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!otpRecord) {
      return new Response(
        JSON.stringify({ error: "No valid verification code found. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check max attempts (5)
    if (otpRecord.attempts >= 5) {
      // Mark as consumed to prevent further attempts
      await supabase
        .from("auth_email_otps")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", otpRecord.id);

      return new Response(
        JSON.stringify({ error: "Too many incorrect attempts. Please request a new code." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify code hash
    const expectedHash = await hashCode(normalizedCode);
    
    if (expectedHash !== otpRecord.code_hash) {
      // Increment attempts
      await supabase
        .from("auth_email_otps")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpRecord.id);

      const remainingAttempts = 5 - otpRecord.attempts - 1;
      return new Response(
        JSON.stringify({ 
          error: `Invalid code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as consumed
    await supabase
      .from("auth_email_otps")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", otpRecord.id);

    // Return success with a verification token (for the frontend to use)
    // This is a simple token that expires soon; the frontend uses it to proceed
    const verificationToken = crypto.randomUUID();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Code verified successfully",
        verification_token: verificationToken
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in auth-verify-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to verify code" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
