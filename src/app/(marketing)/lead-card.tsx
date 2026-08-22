// Section 5's visual: the same estimate from the hero (Sarah M., the
// kitchen-faucet job, $150-$250), now realized as a full lead record. The
// callback is deliberate — it's the same job a visitor already saw at the
// top of the page, arriving here as the payoff. Fields mirror the real
// lead detail view (src/app/dashboard/leads/[leadId]/page.tsx): name,
// contact, service, description, estimate.
export function LeadCard() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-lg ring-1 ring-foreground/10"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
            SM
          </span>
          <div>
            <p className="text-sm font-medium">Sarah M.</p>
            <p className="text-xs text-muted-foreground">Just now</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          New lead
        </span>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4">
        <div>
          <p className="text-xs text-muted-foreground">Kitchen Faucet &middot; Repair</p>
          <p className="mt-1 text-sm">
            &ldquo;My kitchen faucet has been leaking under the sink.&rdquo;
          </p>
        </div>

        <div className="flex items-end justify-between gap-3 border-t border-border pt-4">
          <div>
            <p className="text-[11px] text-muted-foreground">Estimated range</p>
            <p className="text-xl font-medium tabular-nums">$150&ndash;$250</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">Contact</p>
            <p className="text-sm font-medium">(555) 123-4567</p>
          </div>
        </div>
      </div>
    </div>
  );
}
