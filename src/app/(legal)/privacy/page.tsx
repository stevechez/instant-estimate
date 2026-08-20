import type { Metadata } from "next";
import { LEGAL_CONTACT_EMAIL, LEGAL_EFFECTIVE_DATE, LEGAL_OPERATOR } from "@/lib/legal/meta";

export const metadata: Metadata = {
  title: "Privacy Policy — Instant Estimate",
  description: "What Instant Estimate collects, why, who receives it, and what choices you have.",
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Effective {LEGAL_EFFECTIVE_DATE}</p>

      <p>
        This explains what Instant Estimate collects, why, who it goes to, and what you can do about it. It
        covers two groups of people, and the answers are different for each:
      </p>
      <ul>
        <li>
          <strong>Contractors</strong> — businesses that create an account and put Instant Estimate on their
          website.
        </li>
        <li>
          <strong>Homeowners</strong> — people who fill out a contractor&apos;s estimate form to get a price
          range.
        </li>
      </ul>
      <p>
        Instant Estimate is operated by {LEGAL_OPERATOR}. You can reach us at{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
      </p>
      <p>
        Instant Estimate is in a private alpha. The product is still changing and this policy will change with
        it — see <a href="#changes">Changes to this policy</a>.
      </p>

      <hr />

      <h2 id="homeowners">If you&apos;re a homeowner</h2>

      <h3>What we collect</h3>
      <ul>
        <li>
          <strong>Your description of the problem</strong> — the text you type.
        </li>
        <li>
          <strong>Your answers</strong> to the follow-up questions, such as whether it&apos;s an emergency.
        </li>
        <li>
          <strong>Your name and phone number</strong> — required, so the contractor can reach you.
        </li>
        <li>
          <strong>Your email address</strong> — optional.
        </li>
        <li>
          <strong>The service address</strong> — optional.
        </li>
        <li>
          <strong>Photos</strong> — optional, up to three.
        </li>
      </ul>
      <p>We also store the estimate we calculated and when you submitted it. You don&apos;t create an account.</p>

      <h3>Why, and who receives it</h3>
      <p>
        To calculate your estimate and pass your request to the contractor whose form you used. That&apos;s the
        whole purpose. We don&apos;t build a profile of you and we don&apos;t market to you.
      </p>
      <p>
        <strong>The contractor</strong> receives your name, phone, email and address if you provided them, your
        description, your photos, and the estimate — by email, and by text if they&apos;ve set that up. Our{" "}
        <a href="#providers">service providers</a> process data so the service can function.
      </p>
      <p>We do not sell your information or share it with advertisers or data brokers.</p>

      <h3 id="ai">The AI part, specifically</h3>
      <p>
        We use Anthropic&apos;s Claude API for one narrow job: reading your description and deciding which of
        that contractor&apos;s service categories it matches — routing &quot;water heater is leaking&quot; to
        their &quot;Water Heater Repair&quot; category.
      </p>
      <p>
        What we send to Anthropic is <strong>your description text and the contractor&apos;s list of service
        names</strong>. That&apos;s it. We do <strong>not</strong> send your name, phone number, email address,
        service address, or photos — the classification step happens before we ever ask for your contact
        details.
      </p>
      <p>
        One honest caveat: the description box is free text. If you type your address or phone number{" "}
        <em>into the description itself</em>, that text goes to Anthropic with the rest of it.
      </p>
      <p>
        Anthropic&apos;s published commercial terms state that Anthropic does not train its models on customer
        content submitted through the API, and that API inputs and outputs are deleted from their systems within
        30 days — except where content is flagged by their automated trust-and-safety systems, which they retain
        for up to two years. Those are Anthropic&apos;s commitments under their terms as of the effective date
        above, not guarantees we can make on their behalf.
      </p>
      <p>
        <strong>AI does not set your price.</strong> The model only picks a category. The price comes from a
        calculation using the pricing the contractor configured.
      </p>

      <h3>Photos</h3>
      <p>
        Photos go to a private storage bucket. They aren&apos;t public and aren&apos;t linked from anywhere; the
        contractor views them through their dashboard using short-lived links. We don&apos;t send photos to
        Anthropic or analyze them automatically.
      </p>

      <h3>The shareable estimate link</h3>
      <p>
        After you submit, you get a link to view your estimate again. It contains a long random identifier and
        works without logging in, so anyone with the link can open it. That page shows the estimate, the
        service, your description, and the contractor&apos;s branding.{" "}
        <strong>It does not show your name, phone number, email, or address.</strong> Still, treat the link as
        private — like a package tracking link.
      </p>

      <h3>Text messages</h3>
      <p>
        We never text homeowners. If you get a text about your request, it came from the contractor directly,
        not from us.
      </p>

      <hr />

      <h2 id="contractors">If you&apos;re a contractor</h2>

      <h3>What we collect and why</h3>
      <ul>
        <li>
          <strong>Email and password</strong> at signup. Passwords are handled by our authentication provider
          and stored hashed — we never see or store your actual password.
        </li>
        <li>
          <strong>Business details</strong> — name, a URL slug derived from it, brand color, and a logo if you
          upload one. These appear on your public estimate form.
        </li>
        <li>
          <strong>Your pricing configuration.</strong> Homeowners never see this as configuration — only the
          resulting estimate.
        </li>
        <li>
          <strong>A notification phone number</strong>, only if you add one for text alerts.
        </li>
      </ul>
      <p>We use these to run your account, serve your estimate form, calculate estimates, and tell you about leads.</p>

      <h3>Emails and texts we send you</h3>
      <p>
        <strong>Email:</strong> account confirmation, password reset, and one notification per new lead. All
        transactional — about your account or your leads. We don&apos;t send marketing email. If that changes,
        we&apos;ll add a way to unsubscribe and this policy will say so.
      </p>
      <p>
        <strong>Text:</strong> only if you enter a notification phone number. One text per new lead, containing
        the homeowner&apos;s name, the service, the estimate, and a link. Message and data rates may apply. To
        stop, reply <strong>STOP</strong> to any message or clear the number in your settings; reply{" "}
        <strong>HELP</strong> for help. We don&apos;t send marketing texts.
      </p>

      <hr />

      <h2 id="technical">Technical information</h2>
      <p>We&apos;ve kept this deliberately minimal. What actually happens:</p>
      <p>
        <strong>Cookies.</strong> One purpose only: keeping contractors logged in. No advertising cookies, no
        analytics cookies, no third-party trackers on any page. If you&apos;re a homeowner using an estimate
        form, we don&apos;t set a login cookie for you at all.
      </p>
      <p>
        <strong>IP addresses.</strong> We record the IP address of requests to the public estimate form solely
        to rate-limit abuse — to stop someone scripting thousands of fake submissions at a contractor or running
        up our AI costs. It&apos;s stored as a counter keyed to the address, isn&apos;t attached to your
        estimate or your lead, and isn&apos;t used to identify or track you.{" "}
        <strong>These records are deleted automatically once they&apos;re older than 30 days.</strong>
      </p>
      <p>
        <strong>Analytics.</strong> We don&apos;t use Google Analytics or any other analytics or tracking
        product.
      </p>
      <p>
        <strong>Error reports.</strong> When enabled, we use Sentry to record application errors so we can fix
        them. It&apos;s configured not to collect IP addresses, cookies, request headers, or request bodies, and
        we never attach user identities to reports. Error reports can still incidentally contain information
        that happens to appear in the error itself.
      </p>
      <p>
        <strong>Do Not Track.</strong> We don&apos;t track you across other websites, so there&apos;s nothing
        for a Do Not Track signal to turn off, and we don&apos;t respond to it. No third party collects
        personally identifiable information about your activity across other sites through our service.
      </p>

      <hr />

      <h2 id="providers">Service providers</h2>
      <p>
        These companies process data so Instant Estimate can work. Each is bound by its own agreement with us
        and its own privacy terms. We&apos;re not responsible for their practices; their current policies are on
        their websites.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>What it handles</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Supabase</td>
              <td>Database, authentication, and file storage for logos and photos</td>
            </tr>
            <tr>
              <td>Anthropic</td>
              <td>Classifying homeowner descriptions into service categories (description text only)</td>
            </tr>
            <tr>
              <td>Twilio</td>
              <td>Text notifications to contractors who opt in</td>
            </tr>
            <tr>
              <td>Sentry</td>
              <td>Application error reports, when enabled</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        We also use an email delivery provider to send account and lead notification emails, and a hosting
        provider to run the application.
      </p>

      <hr />

      <h2 id="retention">How long we keep things</h2>
      <p>
        Contractor accounts, business details, pricing, estimates, leads, and photos are kept for as long as the
        account is open.
      </p>
      <p>
        <strong>If a contractor deletes their account, it is deleted permanently</strong> — the business,
        services, pricing, estimates, leads, and the photo and logo files themselves. Contractors can do this
        from Settings; it takes effect immediately and cannot be undone. We don&apos;t keep a copy.
      </p>
      <p>
        Rate-limit records described above are deleted after 30 days. Error reports are retained by Sentry
        according to its own retention schedule.
      </p>
      <p>
        Homeowners: your information lives inside the contractor&apos;s account. To have it removed, contact the
        contractor you submitted it to, or email us and we&apos;ll work with them.
      </p>

      <hr />

      <h2 id="security">Security</h2>
      <p>
        Contractor data is isolated at the database level — one account cannot read or modify another&apos;s,
        and that&apos;s enforced by the database itself rather than only by application code. Photos are stored
        privately and served through short-lived links. Credentials that grant elevated access are held
        server-side and never sent to the browser.
      </p>
      <p>
        No system is perfectly secure and we&apos;re not going to claim otherwise. We don&apos;t hold any
        security certifications.
      </p>

      <hr />

      <h2 id="rights">Your rights</h2>
      <p>
        Whoever and wherever you are: you can ask what we hold about you, ask us to correct it, or ask us to
        delete it. Email <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> and we&apos;ll
        respond.
      </p>
      <p>
        <strong>California residents.</strong> Instant Estimate does not currently meet the thresholds that make
        a business subject to the California Consumer Privacy Act — we&apos;re well under the revenue threshold,
        we don&apos;t buy, sell, or share the personal information of 100,000 or more California residents or
        households, and we make no revenue from selling personal information. We&apos;re not claiming CCPA
        compliance, because the law doesn&apos;t presently apply to us and saying otherwise would be misleading.
        We&apos;ll honor access, correction, and deletion requests from California residents anyway, and if we
        cross those thresholds we&apos;ll update this policy and meet the requirements that come with it.
      </p>
      <p>We don&apos;t sell personal information, and we don&apos;t share it for cross-context behavioral advertising.</p>

      <h2 id="children">Children</h2>
      <p>
        Instant Estimate isn&apos;t directed at children and isn&apos;t designed for them. We don&apos;t
        knowingly collect information from anyone under 13. If you believe a child submitted information through
        an estimate form, contact us and we&apos;ll delete it.
      </p>

      <h2 id="where">Where we operate</h2>
      <p>
        Instant Estimate is built for home-service businesses in the United States, and our providers process
        data in the United States. It isn&apos;t designed for users in the EU or UK and we don&apos;t offer it
        there.
      </p>

      <h2 id="changes">Changes to this policy</h2>
      <p>
        We&apos;ll update this policy when the product changes in a way that affects it. For material changes
        we&apos;ll update the effective date above and email contractors at the address on their account before
        the change takes effect.
      </p>

      <h2 id="contact">Contact</h2>
      <p>
        {LEGAL_OPERATOR} — <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
      </p>
    </>
  );
}
