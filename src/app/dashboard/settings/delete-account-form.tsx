"use client";

import { useActionState, useState } from "react";
import { deleteAccount } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

/**
 * Deliberately two-step and typed-confirmation rather than a single button
 * with a confirm() dialog: this destroys the contractor's pricing setup and
 * their entire lead history with no recovery path on our side.
 */
export function DeleteAccountForm({ businessName }: { businessName: string }) {
  const [state, action, pending] = useActionState(deleteAccount, undefined);
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle>Delete your account</CardTitle>
        <CardDescription>
          Permanently deletes your business, pricing, estimates, leads, and uploaded photos and logo. This
          happens immediately and can&apos;t be undone — we don&apos;t keep a copy. Export anything you need
          first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {expanded ? (
          <form action={action}>
            <FieldGroup>
              <Field>
                <FieldContent>
                  <FieldLabel htmlFor="confirm_name">
                    Type <strong>{businessName}</strong> to confirm
                  </FieldLabel>
                  <Input id="confirm_name" name="confirm_name" autoComplete="off" required />
                  <FieldDescription>Must match your business name exactly.</FieldDescription>
                </FieldContent>
              </Field>
              {state?.status === "error" && <FieldError>{state.message}</FieldError>}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setExpanded(false)} disabled={pending}>
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={pending} className="flex-1">
                  {pending ? "Deleting…" : "Permanently delete my account"}
                </Button>
              </div>
            </FieldGroup>
          </form>
        ) : (
          <Button type="button" variant="destructive" onClick={() => setExpanded(true)}>
            Delete my account
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
