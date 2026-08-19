"use client";

import { useActionState } from "react";
import { createBusiness } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

const DEFAULT_BRAND_COLOR = "#0f172a";

export function BusinessForm() {
  const [state, action, pending] = useActionState(createBusiness, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tell us about your business</CardTitle>
        <CardDescription>
          This is what homeowners see on your Instant Estimate widget.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action}>
          <FieldGroup>
            <Field>
              <FieldContent>
                <FieldLabel htmlFor="name">Business name</FieldLabel>
                <Input id="name" name="name" placeholder="Ace Plumbing Co." required minLength={2} />
              </FieldContent>
            </Field>
            <Field>
              <FieldContent>
                <FieldLabel htmlFor="brand_color">Brand color</FieldLabel>
                <Input
                  id="brand_color"
                  name="brand_color"
                  type="color"
                  defaultValue={DEFAULT_BRAND_COLOR}
                  className="h-10 w-20 p-1"
                />
                <FieldDescription>
                  Used to color your widget so it feels like part of your site. You can change this later.
                </FieldDescription>
              </FieldContent>
            </Field>
            {state?.status === "error" && <FieldError>{state.message}</FieldError>}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Saving…" : "Continue"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
