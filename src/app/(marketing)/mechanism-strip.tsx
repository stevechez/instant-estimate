// Section 1's visual: a numbered filmstrip under the approved intro
// paragraph. Deliberately no captions of its own — the paragraph beside it
// already carries the words; this just shows four real UI fragments from
// the same flow as the hero (describe -> question -> price -> lead) at a
// reduced scale so it reads as a filmstrip, not a repeat of the hero.
function Stage({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col items-center gap-3 text-center">
      <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium text-muted-foreground">
        {n}
      </span>
      <div className="flex h-16 w-full max-w-[9rem] items-center justify-center">{children}</div>
    </div>
  );
}

export function MechanismStrip() {
  return (
    <div aria-hidden="true" className="relative mx-auto mt-14 w-full max-w-3xl">
      {/* Connector line: vertical, centered under the badges, on mobile;
          horizontal spanning the first-to-last badge centers at sm+. */}
      <div className="absolute top-3.5 left-1/2 block h-[calc(100%-1.75rem)] w-px -translate-x-1/2 bg-border sm:hidden" />
      <div className="absolute top-3.5 right-[12.5%] left-[12.5%] hidden h-px bg-border sm:block" />

      <div className="flex flex-col gap-8 sm:flex-row sm:gap-4">
        <Stage n="01">
          <div className="w-full rounded-md border border-border bg-muted/30 px-2.5 py-2 text-left text-[11px] text-muted-foreground shadow-sm">
            <span className="line-clamp-2">&ldquo;My kitchen faucet has been leaking&hellip;&rdquo;</span>
          </div>
        </Stage>
        <Stage n="02">
          <div className="flex flex-wrap justify-center gap-1.5">
            <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
              Repair
            </span>
            <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
              Replacement
            </span>
          </div>
        </Stage>
        <Stage n="03">
          <div className="rounded-md bg-muted/60 px-3 py-2 text-center">
            <p className="text-sm font-medium">$150&ndash;$250</p>
          </div>
        </Stage>
        <Stage n="04">
          <div className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 shadow-sm">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-medium text-primary">
              SM
            </span>
            <span className="truncate text-[11px] font-medium">Sarah M.</span>
          </div>
        </Stage>
      </div>
    </div>
  );
}
