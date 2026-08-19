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
          // Keyed by updated_at (bumped by the DB on every successful save)
          // as well as id, so a successful save remounts the card with
          // fresh server truth instead of keeping stale uncontrolled-input
          // state (price/minimum/modifiers/add-ons all use defaultValue,
          // which React only honors on mount). On a failed save updated_at
          // is unchanged (the RPC rolled back), so the card correctly keeps
          // showing what the contractor typed rather than wiping it.
          <VariantCard key={`${variant.id}-${variant.updated_at}`} variant={variant} />
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
