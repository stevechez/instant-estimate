import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No session means there's no valid, freshly-verified recovery flow to
  // act on (expired link, already used, or navigated here directly) — send
  // them back to request a new one rather than showing a form that will
  // just fail on submit.
  if (!user) {
    redirect("/forgot-password");
  }

  return <ResetPasswordForm />;
}
