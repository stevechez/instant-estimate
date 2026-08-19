"use client";

import { useActionState } from "react";
import { savePricing } from "./actions";
import { VariantCard } from "./variant-card";
import { ActivationControl } from "./activation-control";
import { Button } from "@/components/ui/button";
import type { OwnedService } from "@/lib/auth/dal";
import type { VariantWithPricing } from "./data";

export function PricingForm({
  service,
  variants,
}: {
  service: OwnedService;
  variants: VariantWithPricing[];
}) {
  const boundSavePricing = savePricing.bind(null, service.id);
  const [state, action, pending] = useActionState(boundSavePricing, undefined);

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4">
        {variants.map((variant) => (
          <VariantCard key={variant.id} variant={variant} />
        ))}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save pricing"}
          </Button>
          {state?.status === "saved" && (
            <span className="text-sm text-muted-foreground">Saved.</span>
          )}
          {state?.status === "error" && (
            <span className="text-sm text-destructive">{state.message}</span>
          )}
        </div>
      </form>

      <ActivationControl serviceId={service.id} isActive={service.is_active} />
    </div>
  );
}
