// Section 2's visual — the flagship demonstration after the hero, since
// "no AI guessing" is the strongest trust claim on the page. One cohesive
// product panel (not two floating cards): pricing rules on the left, in the
// same $-prefixed field language as MoneyInput (src/components/ui/money-input.tsx)
// and variant-card.tsx, flowing into the computed range on the right — the
// arithmetic is shown, not asserted.
function PriceRow({ label, value, active }: { label: string; value: string; active?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={
          "flex items-center gap-0.5 rounded-md border bg-background px-2.5 py-1.5 text-sm font-medium tabular-nums shadow-xs " +
          (active ? "border-ring ring-3 ring-ring/50" : "border-input")
        }
      >
        <span className="text-muted-foreground">$</span>
        {value}
      </span>
    </div>
  );
}

export function PricingDemo() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl ring-1 ring-foreground/10"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex flex-col gap-5 p-6 sm:p-8">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Pricing rules
            </p>
            <p className="font-heading mt-1 text-sm font-medium">Kitchen Faucet &mdash; Repair</p>
          </div>
          <div className="flex flex-col gap-3">
            <PriceRow label="Starting price" value="85.00" active />
            <PriceRow label="Emergency surcharge" value="40.00" />
            <PriceRow label="Haul away old unit" value="25.00" />
          </div>
        </div>

        <div className="flex items-center justify-center py-4 text-muted-foreground md:py-0">
          <span className="flex size-9 items-center justify-center rounded-full border border-border bg-background text-base font-medium">
            =
          </span>
        </div>

        <div className="flex flex-col items-center justify-center gap-1.5 border-t border-border bg-muted/40 p-6 text-center sm:p-8 md:border-t-0 md:border-l">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Estimated range
          </p>
          <p className="text-4xl font-medium tabular-nums">$150&ndash;$250</p>
          <p className="text-xs text-muted-foreground">$85 + $40 + $25, shown as a range</p>
        </div>
      </div>
    </div>
  );
}
