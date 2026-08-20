"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState =
  | { status: "error"; message: string }
  | { status: "confirmation_required" }
  | undefined;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function signup(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!isValidEmail(email)) {
    return { status: "error", message: "Enter a valid email address." };
  }
  if (password.length < 8) {
    return { status: "error", message: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { status: "error", message: error.message };
  }

  // Locally (supabase/config.toml: enable_confirmations = false) signUp
  // returns a session immediately. Where email confirmation is required
  // (the default once deployed), it won't — there's no session to send the
  // contractor into onboarding with, so show a "check your email" state
  // instead of redirecting into a route proxy.ts will just bounce back out of.
  if (!data.session) {
    return { status: "confirmation_required" };
  }

  redirect("/onboarding/business");
}

export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!isValidEmail(email) || password.length === 0) {
    return { status: "error", message: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Deliberately generic: don't reveal whether the email is registered.
    return { status: "error", message: "Invalid email or password." };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type RequestPasswordResetState = { status: "error"; message: string } | { status: "sent" } | undefined;

export async function requestPasswordReset(
  _prevState: RequestPasswordResetState,
  formData: FormData
): Promise<RequestPasswordResetState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!isValidEmail(email)) {
    return { status: "error", message: "Enter a valid email address." };
  }

  // Where the emailed link points is controlled by supabase/config.toml's
  // site_url + supabase/templates/recovery.html (not a redirectTo option
  // here) — the custom template hardcodes /auth/confirm?...&next=/reset-password
  // so the link always lands on our own token-exchange route instead of
  // GoTrue's default /auth/v1/verify redirect endpoint. See
  // app/auth/confirm/route.ts.
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email);

  // Deliberately don't branch on the result: Supabase's API doesn't reveal
  // whether the email is registered, and neither should this response
  // (same enumeration-avoidance reasoning as login()'s generic error).
  return { status: "sent" };
}

export type UpdatePasswordState = { status: "error"; message: string } | undefined;

export async function updatePassword(
  _prevState: UpdatePasswordState,
  formData: FormData
): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    return { status: "error", message: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { status: "error", message: "Passwords don't match." };
  }

  // Relies on the session /auth/confirm established from the reset-link
  // click — there's no separate "old password" step, matching Supabase's
  // standard recovery flow (see supabase/migrations comments elsewhere for
  // why we follow their documented patterns rather than inventing our own).
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    // Unlike login()'s deliberately generic message, this comes from an
    // already-authenticated GoTrue call (not an enumeration risk) and its
    // messages are meant to be user-facing (e.g. password strength rules),
    // so it's safe to surface directly.
    return { status: "error", message: error.message };
  }

  redirect("/dashboard");
}
