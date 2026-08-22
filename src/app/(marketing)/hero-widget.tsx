// The hero's visual: a static, non-interactive rendering of the real
// embedded widget (see src/app/e/[slug]/estimate-wizard.tsx — describe ->
// one quick question -> price), plus one small "lead" card peeking behind
// it. Not a diagram: this is meant to look like the actual product a
// contractor would embed, so a visitor recognizes it in ~2 seconds. The
// price ($150–$250) is a clearly fictional demo value, formatted the same
// way formatMoney() would ("$X–$Y"). aria-hidden because it's illustrative
// only — the hero's copy already says the same thing in words.
export function HeroWidget() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[360px]">
      {/* Secondary: a lead notification peeking from behind, deliberately
          smaller and lower z-index so it never competes with the widget. */}
      <div className="absolute -top-5 right-6 z-0 w-40 -rotate-6 rounded-lg border border-border bg-card px-3 py-2 opacity-95 shadow-md sm:right-2">
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
          New lead
        </p>
        <p className="mt-0.5 text-xs font-medium">Sarah M.</p>
        <p className="text-[11px] text-muted-foreground">Kitchen Faucet &middot; Repair</p>
      </div>

      {/* Primary: the widget itself */}
      <div className="relative z-10 overflow-hidden rounded-2xl border border-border bg-card shadow-xl ring-1 ring-foreground/10">
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <p className="font-heading text-sm font-medium">Sarah&apos;s Plumbing</p>
          <p className="text-xs text-muted-foreground">Instant Estimate</p>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
            &ldquo;My kitchen faucet has been leaking under the sink.&rdquo;
          </div>

          <div>
            <p className="mb-1.5 text-[11px] text-muted-foreground">Repair or replacement?</p>
            <div className="flex gap-1.5">
              <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
                Repair
              </span>
              <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                Replacement
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-muted/60 px-3 py-4 text-center">
            <p className="text-[11px] text-muted-foreground">Estimated range</p>
            <p className="text-3xl font-medium">$150–$250</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Priced by Sarah&apos;s Plumbing</p>
          </div>
        </div>
      </div>
    </div>
  );
}
