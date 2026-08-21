// Route group for the marketing site (currently just "/"), kept separate
// from the app routes (dashboard/, onboarding/, (auth)/) per the App Router
// restructuring. No marketing-specific chrome exists yet — this is a
// pass-through until landing-page content/design is built.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
