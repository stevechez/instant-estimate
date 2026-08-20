import type { Metadata } from "next";
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_GOVERNING_STATE,
  LEGAL_OPERATOR,
} from "@/lib/legal/meta";

export const metadata: Metadata = {
  title: "Terms of Service — Instant Estimate",
  description: "The rules for using Instant Estimate, and the responsibilities of you and us.",
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground">Effective {LEGAL_EFFECTIVE_DATE}</p>

      <p>
        These terms are an agreement between you and {LEGAL_OPERATOR} (&quot;we,&quot; &quot;us&quot;) covering
        your use of Instant Estimate. By creating an account, you agree to them.
      </p>
      <p>
        These terms are for <strong>contractors</strong> — the businesses that use Instant Estimate. Homeowners
        who fill out an estimate form aren&apos;t entering into this agreement; their relationship is with the
        contractor whose form they used.
      </p>

      <h2 id="alpha">1. Instant Estimate is in alpha</h2>
      <p>
        Instant Estimate is early software in a private alpha. Features will change, some substantially, and
        things will occasionally break. In practice that means:
      </p>
      <ul>
        <li>We don&apos;t promise any particular uptime.</li>
        <li>We may change or remove features.</li>
        <li>
          Data loss is unlikely but not impossible, and you shouldn&apos;t treat Instant Estimate as the only
          record of your leads.
        </li>
      </ul>
      <p>
        We&apos;re not using &quot;alpha&quot; as a blanket excuse. We&apos;ll operate the service carefully and
        tell you about significant changes. But you should go in knowing it&apos;s early.
      </p>

      <h2 id="account">2. Your account</h2>
      <p>
        You need an account to use Instant Estimate. Give accurate information, keep your password secure, and
        take responsibility for what happens under your account. You must be at least 18 and using Instant
        Estimate for a business. One business per account — if you need more, get in touch.
      </p>

      <h2 id="pricing">3. You control your pricing — and you&apos;re responsible for it</h2>
      <p>This is the most important section here, so it&apos;s near the top.</p>
      <p>
        <strong>You configure your pricing.</strong> Base prices, minimums, surcharges for emergency or
        after-hours work, add-ons — all of it comes from you.
      </p>
      <p>
        <strong>We calculate; we don&apos;t price.</strong> Instant Estimate applies your configured pricing to
        what the homeowner tells us, using a deterministic calculation. The AI component only reads a
        homeowner&apos;s description and picks which of <em>your</em> service categories it fits. It does not
        choose, adjust, or invent prices.
      </p>
      <p>
        <strong>So the numbers homeowners see are yours.</strong> If you enter $250 when you meant $2,500, the
        homeowner sees $250. Review your pricing before activating a service, and check it after you change it.
      </p>
      <p>
        You&apos;re responsible for making sure your pricing complies with the laws that apply to your trade and
        your state, including licensing, advertising, and estimate rules.
      </p>

      <h2 id="estimates">4. Estimates are estimates</h2>
      <p>
        Every estimate shown to a homeowner carries a notice that it&apos;s based on the information they
        provided, isn&apos;t a guarantee of final pricing, and that you may need to confirm the scope in person.
        Don&apos;t remove or contradict that notice.
      </p>
      <p>
        We&apos;re not a party to whatever you and the homeowner agree to. We don&apos;t guarantee that any
        estimate is accurate for the actual job, and we&apos;re not responsible for the difference between an
        estimate and what the work turns out to cost. The homeowner&apos;s agreement is with you.
      </p>

      <h2 id="leads">5. Leads and homeowner information</h2>
      <p>When a homeowner submits a request, we pass their information to you and store it in your account. You agree to:</p>
      <ul>
        <li>Use homeowner information only to respond to that request and do the work.</li>
        <li>Not sell it, and not add it to a marketing list without the homeowner&apos;s consent.</li>
        <li>Comply with the laws that apply when you contact them, including the rules on calling and texting.</li>
        <li>Handle it securely and delete it when you no longer need it.</li>
      </ul>
      <p>
        A homeowner giving us their phone number so you can quote a job is not consent to marketing. If you want
        to market to them, get consent yourself.
      </p>

      <h2 id="notifications">6. Notifications</h2>
      <p>
        We notify you of new leads by email. If you add a phone number in settings, we&apos;ll also text you.
      </p>
      <p>
        By adding that number you confirm it&apos;s yours and agree to receive automated informational text
        notifications about your account at that number — roughly one text per lead. Message and data rates may
        apply. Reply <strong>STOP</strong> to any message to stop them, or clear the number in your settings.
        Reply <strong>HELP</strong> for help. We don&apos;t send marketing texts.
      </p>
      <p>
        Notifications are best-effort. If an email or text fails, the lead is still saved in your dashboard.
        Don&apos;t rely solely on notifications.
      </p>

      <h2 id="acceptable-use">7. Acceptable use</h2>
      <p>Don&apos;t:</p>
      <ul>
        <li>Use Instant Estimate for anything illegal, or to mislead homeowners.</li>
        <li>Advertise prices you don&apos;t intend to honor.</li>
        <li>Submit false leads, or collect information you don&apos;t need.</li>
        <li>Try to access another contractor&apos;s account or data.</li>
        <li>Attack, overload, probe, or reverse-engineer the service.</li>
        <li>Scrape it, resell access, or use it to build a competing product.</li>
        <li>Use it for anything other than home-service estimates.</li>
      </ul>
      <p>We rate-limit the public estimate form to prevent abuse. Don&apos;t work around it.</p>

      <h2 id="termination">8. Suspension and termination</h2>
      <p>
        You can stop using Instant Estimate at any time and delete your account from Settings. Deleting your
        account permanently removes your business, pricing, estimates, leads, and uploaded files. We can&apos;t
        recover them afterwards, so export anything you need first.
      </p>
      <p>
        We may suspend or terminate your account if you break these terms, if your use threatens the service or
        other users, or for non-payment if we begin charging. Where we reasonably can, we&apos;ll tell you first
        and give you a chance to fix it. For serious problems — abuse, illegal use, security threats — we may
        act immediately.
      </p>
      <p>
        Suspending an account takes your estimate form and shareable links offline without deleting anything, so
        it can be reversed.
      </p>

      <h2 id="payment">9. Payment</h2>
      <p>
        Instant Estimate is free while it&apos;s in alpha. We don&apos;t collect payment details and there is no
        billing system today.
      </p>
      <p>
        If we start charging, we&apos;ll email you at least 30 days beforehand and you&apos;ll be able to cancel
        before any charge is made.
      </p>

      <h2 id="content">10. Your content</h2>
      <p>
        Your business name, logo, pricing, and the leads in your account are yours. We don&apos;t claim
        ownership. You give us permission to store, process, and display that content as needed to run the
        service — showing your logo and brand color on your estimate form, and applying your pricing to
        calculate estimates. You confirm you have the right to use any logo you upload.
      </p>

      <h2 id="ip">11. Our software</h2>
      <p>
        Instant Estimate — the application, the estimate widget, and the underlying software — is ours. These
        terms don&apos;t give you ownership of it. You may embed the widget on your own website; that&apos;s
        what it&apos;s for.
      </p>

      <h2 id="third-party">12. Third-party services</h2>
      <p>
        Instant Estimate runs on third-party infrastructure and uses third-party services for hosting, data
        storage, AI classification, email, and text messaging. Our <a href="/privacy">Privacy Policy</a> lists
        them. We&apos;re not responsible for their failures, and an outage at one of them may take Instant
        Estimate down with it.
      </p>

      <h2 id="disclaimers">13. Disclaimers</h2>
      <p>
        Instant Estimate is provided &quot;as is.&quot; To the extent the law allows, we disclaim implied
        warranties including merchantability, fitness for a particular purpose, and non-infringement.
      </p>
      <p>
        We specifically don&apos;t warrant that the service will be uninterrupted or error-free, that estimates
        will match final job costs, or that using Instant Estimate will produce any particular number or quality
        of leads.
      </p>
      <p>Some states don&apos;t allow these disclaimers, in which case they apply to the extent permitted.</p>

      <h2 id="liability">14. Limitation of liability</h2>
      <p>To the extent the law allows:</p>
      <p>
        We&apos;re not liable for indirect, incidental, special, or consequential damages, or for lost profits,
        lost business, or lost data.
      </p>
      <p>
        Our total liability for any claim relating to Instant Estimate is limited to the greater of what you
        paid us in the 12 months before the claim, or $100.
      </p>
      <p>This doesn&apos;t limit liability that can&apos;t be limited by law.</p>

      <h2 id="indemnification">15. Indemnification</h2>
      <p>
        You&apos;ll defend and indemnify us against claims arising from your use of Instant Estimate, your
        pricing configuration, your dealings with homeowners, your handling of homeowner information, or your
        breach of these terms.
      </p>

      <h2 id="disputes">16. If there&apos;s a dispute</h2>
      <p>
        <strong>Talk to us first.</strong> If you have a problem, email{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> describing the issue and what
        you&apos;d like us to do. We&apos;ll have 30 days to try to resolve it before either of us starts formal
        proceedings. Most problems are faster to fix this way, and this step applies to both of us.
      </p>
      <p>
        <strong>Time limit.</strong> Any claim relating to Instant Estimate must be brought within one year
        after it arises, or it&apos;s waived — except where the law doesn&apos;t allow that limit.
      </p>

      <h2 id="law">17. Governing law</h2>
      <p>
        These terms are governed by the laws of the State of {LEGAL_GOVERNING_STATE}, without regard to its
        conflict-of-laws rules. Any dispute not resolved under section 16 will be brought in the state or
        federal courts located in {LEGAL_GOVERNING_STATE}, and both of us consent to that jurisdiction.
      </p>
      <p>There is no arbitration requirement in these terms, and neither of us waives the right to a jury trial.</p>

      <h2 id="changes">18. Changes to these terms</h2>
      <p>
        We may update these terms. For material changes we&apos;ll email the address on your account before they
        take effect. Continuing to use Instant Estimate after that means you accept the new terms. If you
        don&apos;t, stop using it and delete your account.
      </p>

      <h2 id="general">19. General</h2>
      <p>
        If a provision is unenforceable, the rest still applies. Our not enforcing something isn&apos;t a waiver
        of it. You can&apos;t transfer these terms without our consent; we may transfer them in connection with
        a sale of the business. These terms and the <a href="/privacy">Privacy Policy</a> are the whole
        agreement between us about Instant Estimate.
      </p>

      <h2 id="contact">20. Contact</h2>
      <p>
        {LEGAL_OPERATOR} — <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
      </p>
    </>
  );
}
