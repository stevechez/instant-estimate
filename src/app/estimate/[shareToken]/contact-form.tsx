"use client";

import { useState, useTransition } from "react";
import { submitLead } from "@/app/e/[slug]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";

export function ContactForm({ estimateId, businessId }: { estimateId: string; businessId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitLead({
        estimateId,
        businessId,
        name: String(formData.get("name") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        email: String(formData.get("email") ?? ""),
        serviceAddress: String(formData.get("service_address") ?? ""),
      });
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return <p className="text-sm text-muted-foreground">You&apos;re all set — the contractor will be in touch soon.</p>;
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <Field>
        <FieldContent>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input id="name" name="name" required />
        </FieldContent>
      </Field>
      <Field>
        <FieldContent>
          <FieldLabel htmlFor="phone">Phone</FieldLabel>
          <Input id="phone" name="phone" type="tel" required />
        </FieldContent>
      </Field>
      <Field>
        <FieldContent>
          <FieldLabel htmlFor="email">Email (optional)</FieldLabel>
          <Input id="email" name="email" type="email" />
        </FieldContent>
      </Field>
      <Field>
        <FieldContent>
          <FieldLabel htmlFor="service_address">Service address (optional)</FieldLabel>
          <Input id="service_address" name="service_address" />
        </FieldContent>
      </Field>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Request a quote"}
      </Button>
    </form>
  );
}
