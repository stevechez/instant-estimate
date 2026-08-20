"use client";

import { useActionState } from "react";
import { updateBusinessLogo } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

export function LogoForm({ currentLogoUrl }: { currentLogoUrl: string | null }) {
  const [state, action, pending] = useActionState(updateBusinessLogo, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo</CardTitle>
        <CardDescription>Shown at the top of your Instant Estimate widget.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action}>
          <FieldGroup>
            {currentLogoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- contractor-uploaded logo URL, not a local asset
              <img src={currentLogoUrl} alt="Current logo" className="h-12 w-auto" />
            )}
            <Field>
              <FieldContent>
                <FieldLabel htmlFor="logo">Upload a new logo</FieldLabel>
                <Input id="logo" name="logo" type="file" accept="image/jpeg,image/png,image/webp" />
                <FieldDescription>JPG, PNG, or WEBP, up to 2MB.</FieldDescription>
              </FieldContent>
            </Field>
            {state?.status === "error" && <FieldError>{state.message}</FieldError>}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Uploading…" : "Upload logo"}
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
