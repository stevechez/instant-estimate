"use client";

import { useActionState } from "react";
import { updateNotificationPhone } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

export function NotificationPhoneForm({ currentPhone }: { currentPhone: string }) {
  const [state, action, pending] = useActionState(updateNotificationPhone, undefined);

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
                <FieldDescription>Leave blank to turn off text notifications.</FieldDescription>
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
