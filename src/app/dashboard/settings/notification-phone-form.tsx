"use client";

import { useActionState } from "react";
import { updateNotificationPhone } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

export function NotificationPhoneForm({
  currentPhone,
  optedOutAt,
}: {
  currentPhone: string;
  /** When Twilio last rejected this number as opted out. Twilio, not us, decides whether it receives messages. */
  optedOutAt: string | null;
}) {
  const [state, action, pending] = useActionState(updateNotificationPhone, undefined);
  const showOptOut = Boolean(currentPhone) && Boolean(optedOutAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead notifications</CardTitle>
        <CardDescription>
          You&apos;ll always get an email for new leads. Add a phone number to also get a text.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action}>
          <FieldGroup>
            {showOptOut && (
              // Reflects what Twilio told us on the last send, rather than a
              // local opt-in state of our own — Twilio remains the authority
              // on whether this number is subscribed.
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
                <p className="font-medium">Texts to this number are being blocked</p>
                <p className="mt-1 text-muted-foreground">
                  This number replied STOP, so the carrier is blocking our texts to it. Your lead emails are
                  unaffected. To start them again, text <strong>START</strong> to the number our messages come
                  from, or enter a different number below.
                </p>
              </div>
            )}
            <Field>
              <FieldContent>
                <FieldLabel htmlFor="notification_phone">Notification phone number</FieldLabel>
                <Input
                  id="notification_phone"
                  name="notification_phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  defaultValue={currentPhone}
                />
                <FieldDescription>
                  Entering a number means you agree to get automated text notifications about your account at
                  it — about one text per new lead, containing the homeowner&apos;s name, the service, and the
                  estimate. These are informational only; we never send marketing texts, and homeowners are
                  never texted. Message and data rates may apply. Reply STOP to any message to stop them, or
                  HELP for help. Leave this blank to turn texts off.
                </FieldDescription>
              </FieldContent>
            </Field>
            {state?.status === "error" && <FieldError>{state.message}</FieldError>}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Saving…" : "Save"}
            </Button>
            {state?.status === "saved" && (
              <span className="text-center text-sm text-muted-foreground">Saved.</span>
            )}
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
