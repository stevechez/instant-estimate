import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Token-exchange step for Supabase's PKCE email flows (password recovery
 * today; signup-confirmation and email-change links use the same shape if
 * enabled later). The email link points here with token_hash + type + next;
 * verifyOtp() exchanges the token and establishes a real session via
 * @supabase/ssr cookie handling, which is what lets /reset-password call
 * updateUser() without a separate login step.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
  }

  // Missing/invalid/expired token — send them back to request a fresh link
  // rather than a dead end.
  redirect("/forgot-password?error=invalid_or_expired_link");
}
