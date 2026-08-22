"use client";

import { useActionState } from "react";
import { saveServiceSelection } from "./actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PLUMBING_SERVICE_CATALOG } from "@/lib/plumbing-services";

export function ServiceSelectionForm({
  initiallySelectedKeys,
}: {
  initiallySelectedKeys: string[];
}) {
  const [state, action, pending] = useActionState(
    saveServiceSelection,
    undefined,
  );
  const selected = new Set(initiallySelectedKeys);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Which services do you offer?</CardTitle>
        <CardDescription>
          Select the plumbing services you want to offer instant estimates for.
          You&apos;ll set up pricing for each one next.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action}>
          <FieldGroup>
            <div className="flex flex-col gap-3">
              {PLUMBING_SERVICE_CATALOG.map((service) => (
                <div key={service.key} className="flex items-center gap-3">
                  <Checkbox
                    id={`service-${service.key}`}
                    name="services"
                    value={service.key}
                    defaultChecked={selected.has(service.key)}
                  />
                  <FieldLabel htmlFor={`service-${service.key}`}>{service.name}</FieldLabel>
                </div>
              ))}
            </div>
            {state?.status === "error" && (
              <FieldError>{state.message}</FieldError>
            )}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Saving…" : "Continue"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
