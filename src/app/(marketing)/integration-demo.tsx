// Section 3's visual: the real embed pattern (public/embed.js) — a launcher
// pill sitting on the contractor's own site, not a browser-chrome mockup or
// a fake illustrated page. Restrained on purpose: a nav bar and a couple of
// muted content bars are enough context to read as "a website" without
// competing with the pill, which is the actual point.
export function IntegrationDemo() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-md"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="h-2.5 w-20 rounded-sm bg-foreground/70" />
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-8 rounded-full bg-muted-foreground/30" />
          <span className="h-1.5 w-8 rounded-full bg-muted-foreground/30" />
          <span className="h-1.5 w-8 rounded-full bg-muted-foreground/30" />
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-5 py-6">
        <span className="h-2.5 w-2/3 rounded-sm bg-muted" />
        <span className="h-2.5 w-1/2 rounded-sm bg-muted/70" />
        <span className="mt-2 h-2 w-5/6 rounded-sm bg-muted/40" />
        <span className="h-2 w-4/6 rounded-sm bg-muted/40" />
      </div>

      <span className="absolute right-4 bottom-4 rounded-full bg-foreground px-4 py-2.5 text-xs font-medium text-background shadow-lg">
        Get an Instant Estimate
      </span>
    </div>
  );
}
