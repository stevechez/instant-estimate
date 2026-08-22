import Link from "next/link";
import { CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HeroWidget } from "./hero-widget";
import { MechanismStrip } from "./mechanism-strip";
import { PricingDemo } from "./pricing-demo";
import { IntegrationDemo } from "./integration-demo";
import { MobileDemo } from "./mobile-demo";
import { LeadCard } from "./lead-card";

// The MVP landing page. Copy is grounded in what CLAUDE.md's feature list
// and the plumbing-vertical decision actually commit to — no invented
// pricing plans or testimonials. Authenticated visitors never see this:
// proxy.ts's AUTH_PAGES redirects them straight to /dashboard.
export default function MarketingHome() {
  return (
    <>
      <section className="mx-auto grid w-full max-w-5xl items-center gap-12 px-4 pt-16 pb-16 sm:pt-20 sm:pb-20 lg:grid-cols-2 lg:gap-16 lg:pt-24 lg:pb-28">
        <div className="text-center lg:text-left">
          <h1 className="font-heading text-4xl font-medium tracking-tight sm:text-5xl">
            Give homeowners a price before they call someone else.
          </h1>
          <p className="mt-5 text-lg font-medium sm:text-xl">
            Instant Estimate lets plumbing companies give website visitors an immediate price
            range — even when nobody is available to answer the phone.
          </p>
        </div>
        <div className="flex justify-center lg:justify-end">
          <HeroWidget />
        </div>
      </section>

      {/* Section 1 — mechanism: approved intro paragraph + a numbered
          filmstrip of real UI fragments from the same flow as the hero. */}
      <section className="mx-auto w-full max-w-2xl px-4 pb-20 sm:pb-28">
        <p className="text-center text-lg text-muted-foreground">
          The homeowner describes the job, answers a few questions, and gets a price range
          based on <span className="font-medium text-foreground">your pricing rules</span>. You
          get the homeowner&apos;s contact information and job details so you can follow up with
          a potential customer.
        </p>
        <MechanismStrip />
      </section>

      {/* Section 2 — pricing control: the flagship demonstration. Larger
          type than the other sections and the most polished visual after
          the hero, since "no AI guessing" is the strongest trust claim on
          the page. */}
      <section className="mx-auto w-full max-w-4xl px-4 pb-20 sm:pb-28">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-heading text-3xl font-medium tracking-tight sm:text-4xl">
            Your prices. Your rules. No AI guessing.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Set the starting price for each service, then add the surcharges and options that
            apply. Every estimate follows the rules you define — so the numbers come from you,
            not an AI making up a price.
          </p>
        </div>
        <div className="mt-12">
          <PricingDemo />
        </div>
      </section>

      {/* Section 3 — website integration: visual left / text right, flips
          the hero's orientation. */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-20 sm:pb-28">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <IntegrationDemo />
          </div>
          <div className="order-1 text-center lg:order-2 lg:text-left">
            <h2 className="font-heading text-xl font-medium sm:text-2xl">
              Works on the website you already have.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Instant Estimate is an embeddable widget, so you don&apos;t need a new website or a
              complicated booking system. Add it to your existing site and give homeowners a way
              to get an answer immediately.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4 — mobile homeowner experience: a centered spotlight
          rather than a two-column card, on the page's base background
          (no tint) so it reads as one composition with the rest of the
          page, not a divider block. */}
      <section className="mx-auto w-full max-w-xl px-4 pb-20 text-center sm:pb-28">
        <h2 className="font-heading text-xl font-medium sm:text-2xl">
          Built for homeowners on their phones.
        </h2>
        <p className="mt-3 text-muted-foreground">
          A homeowner searching for a plumber at 9:30 PM doesn&apos;t want to fill out a
          generic contact form and wait until tomorrow. Instant Estimate gives them something
          useful right away.
        </p>
        <div className="mt-12">
          <MobileDemo />
        </div>
      </section>

      {/* Section 5 — lead capture: text left / visual right, bookending
          the hero's orientation. Reuses the hero's exact job (Sarah M.,
          the kitchen faucet, $150-$250) as a deliberate narrative callback. */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-20 sm:pb-28">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <h2 className="font-heading text-xl font-medium sm:text-2xl">
              And you get the lead.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Before receiving their estimate, the homeowner provides their contact information
              and details about the job. Instead of another anonymous website visitor, you have a
              potential customer you can actually follow up with.
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <LeadCard />
          </div>
        </div>
      </section>

      {/* Pricing — founder offer. Not positioned as a free beta: this is a
          real, paid product from day one. render={<Link href="/signup" />}
          is the CTA target for now — there is no checkout to send it to yet
          (see HANDOFF.md, Billing). */}
      <section id="pricing" className="mx-auto w-full max-w-xl px-4 pb-20 sm:pb-28">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-medium tracking-tight sm:text-4xl">
            Founder Pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join now as a founding contractor and this price is locked in for as long as
            you&apos;re a customer — it never goes up.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-8 shadow-xl ring-1 ring-foreground/10 sm:p-10">
          <div className="text-center">
            <p className="flex items-baseline justify-center gap-1.5">
              <span className="text-5xl font-medium tracking-tight">$49</span>
              <span className="text-muted-foreground">/month</span>
            </p>
            <p className="mt-2 text-sm font-medium text-primary">
              Founder Pricing — Locked In For Life
            </p>
          </div>

          <ul className="mt-8 flex flex-col gap-3 text-sm">
            {[
              "AI-powered instant estimates",
              "Branded estimator",
              "Unlimited estimates",
              "Customer lead capture",
              "Photo uploads",
              "Contractor dashboard",
              "Lead details",
              "Founder pricing locked in for life",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <CheckIcon className="size-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <Button render={<Link href="/signup" />} size="lg" className="mt-8 w-full">
            Become a Founding Contractor
          </Button>
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:py-20">
          <h2 className="font-heading text-2xl font-medium tracking-tight sm:text-3xl">
            Stop making homeowners wait for an answer.
          </h2>
          <div className="mt-4 text-muted-foreground">
            <p>Give them a price range now.</p>
            <p>Get the lead.</p>
            <p>Follow up when you&apos;re ready.</p>
          </div>
          <div className="mt-8">
            <Button render={<Link href="/signup" />} size="lg">
              Get started
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
