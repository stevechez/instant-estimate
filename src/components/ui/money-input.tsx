import * as React from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * A dollar-amount Input with a "$" prefix. Every price field in the
 * contractor dashboard (starting price, surcharges, add-ons — see
 * PRICING_ENGINE_SPEC.md Section 5) is a flat dollar amount, but a bare
 * number input gives no hint of that: without a unit, "0.75" reads as
 * ambiguous (75 cents? a multiplier? a percentage?) rather than obviously
 * "$0.75". This is purely a visual affordance — parseDollarsToCents
 * (src/lib/money.ts) already strips a leading "$" from typed input, so it
 * doesn't change what values are accepted.
 */
function MoneyInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-muted-foreground md:text-sm"
      >
        $
      </span>
      <Input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        className={cn("pl-5", className)}
        {...props}
      />
    </div>
  )
}

export { MoneyInput }
