// Section 4's visual: the estimate flow at real phone scale, not a
// decorative device shell. Three real states (describe -> question ->
// price) crossfade in a slow (9s), pure-CSS loop — the one deliberate
// motion moment on the page (see --animate-phone-cycle in globals.css).
// motion-safe: means prefers-reduced-motion users just see the static
// price frame, which is the strongest single frame to rest on anyway.
function Header() {
  return (
    <div className="text-center">
      <p className="font-heading text-xs font-medium">Sarah&apos;s Plumbing</p>
      <p className="text-[10px] text-muted-foreground">Instant Estimate</p>
    </div>
  );
}

export function MobileDemo() {
  return (
    <div aria-hidden="true" className="mx-auto w-[260px]">
      <div className="rounded-[2.5rem] border-[6px] border-foreground bg-foreground p-1.5 shadow-2xl">
        <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2rem] bg-background">
          <div className="absolute top-2.5 left-1/2 z-20 h-1.5 w-14 -translate-x-1/2 rounded-full bg-foreground/15" />

          <div
            className="motion-safe:animate-phone-cycle absolute inset-0 flex flex-col gap-3 px-4 pt-9 opacity-0"
            style={{ animationDelay: "0s" }}
          >
            <Header />
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs">
              &ldquo;My water heater is making a strange noise.&rdquo;
            </div>
          </div>

          <div
            className="motion-safe:animate-phone-cycle absolute inset-0 flex flex-col gap-3 px-4 pt-9 opacity-0"
            style={{ animationDelay: "3s" }}
          >
            <Header />
            <div>
              <p className="mb-1.5 text-[11px] text-muted-foreground">Is this an emergency?</p>
              <div className="flex flex-col gap-1.5">
                <span className="rounded-md border border-primary bg-primary/5 px-2.5 py-1.5 text-xs font-medium">
                  Yes, right away
                </span>
                <span className="rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground">
                  No, it can wait
                </span>
              </div>
            </div>
          </div>

          <div
            className="motion-safe:animate-phone-cycle absolute inset-0 flex flex-col gap-3 px-4 pt-9 opacity-100"
            style={{ animationDelay: "6s" }}
          >
            <Header />
            <div className="rounded-lg bg-muted/60 px-3 py-5 text-center">
              <p className="text-[11px] text-muted-foreground">Estimated range</p>
              <p className="text-2xl font-medium">$210&ndash;$275</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
