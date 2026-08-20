# Privacy Policy

**Effective date:** [DECISION REQUIRED: date this is first published]

This policy explains what Instant Estimate collects, why, who it goes to, and what you can do about it. It covers two different groups of people, and the answers are different for each:

- **Contractors** — the businesses that create an account and use Instant Estimate on their website.
- **Homeowners** — people who fill out a contractor's Instant Estimate form to get a price range.

Instant Estimate is operated by [DECISION REQUIRED: legal entity name, or your name if operating as a sole proprietor]. You can reach us at [DECISION REQUIRED: contact email].

Instant Estimate is currently in a private alpha. The product is still changing, and this policy will change with it. See "Changes to this policy" below.

---

## If you're a homeowner

### What we collect

When you use a contractor's Instant Estimate form, we collect:

- **Your description of the problem** — the free text you type ("my kitchen faucet is leaking under the sink").
- **Your answers** to the follow-up questions (for example, whether it's an emergency).
- **Your name and phone number** — required, so the contractor can get back to you.
- **Your email address** — optional.
- **The service address** — optional.
- **Photos** — optional, up to three.

You don't create an account and we don't ask you to.

We also record the estimate we calculated for you and the time you submitted it.

### Why we collect it

To calculate your estimate and to pass your request to the contractor whose form you used. That's the entire purpose. We don't build a profile of you, and we don't use your information to market anything to you.

### Who receives it

**The contractor whose form you filled out.** This is the point of the service. They receive your name, phone number, email and address if you gave them, your description, your photos, and the estimate. They receive this by email and, if they've set one up, by text message.

**Our service providers**, listed under "Service providers" below. They process data so the service can function — they don't get it to use for their own purposes.

We do not sell your information. We do not share it with advertisers or data brokers.

### The AI part, specifically

We use Anthropic's Claude API for one narrow job: reading your free-text description and deciding which of that contractor's service categories it matches — for example, routing "water heater is leaking" to their "Water Heater Repair" category.

What we send to Anthropic is **your description text and the contractor's list of service names**. That's it.

We do **not** send your name, phone number, email address, service address, or photos to Anthropic. The classification step happens before we ever ask for your contact details.

One honest caveat: the description field is free text. If you type your address or phone number *into the description itself*, that text goes to Anthropic along with the rest of it.

**AI does not set your price.** The model only picks a category. The price comes from a calculation using the pricing the contractor configured. See our Terms for more on that.

[DECISION REQUIRED: Anthropic's handling of API data — including whether inputs are used for model training and how long they are retained — is governed by the terms of our Anthropic account, not by our code. Verify the current terms for your account and state the accurate position here before publishing. Do not state "your data is never used for training" unless you have confirmed that is true for your account tier.]

### Photos

Photos are stored in a private storage bucket. They are not public, and they are not indexed or linked from anywhere. The contractor views them through their dashboard using short-lived links generated on demand. We do not send photos to Anthropic or analyze them automatically.

### The shareable estimate link

After you submit, you get a link to view your estimate again. That link contains a long random identifier and works without logging in — anyone with the link can see the estimate.

That page shows the estimate, the service, your description, and the contractor's branding. **It does not show your name, phone number, email, or address.** Still, treat the link as private, the same way you would a package tracking link.

### Text messages

We never text homeowners. If you get a text about your request, it came from the contractor directly, not from us.

---

## If you're a contractor

### What we collect

- **Your email address and password** when you create an account. Passwords are handled by our authentication provider (Supabase) and stored hashed — we never see or store your actual password.
- **Your business details** — business name, a URL slug derived from it, brand color, and a logo if you upload one.
- **Your pricing configuration** — services, prices, minimums, surcharges, add-ons.
- **A notification phone number**, only if you choose to add one for text alerts.

### Why we collect it

To run your account, serve your estimate widget to homeowners, calculate estimates using your pricing, and tell you when you get a lead.

### Who receives it

Your business name, logo, and brand color appear on your public estimate form and shareable estimate pages — that's the point of them. Your pricing configuration is never shown to homeowners as configuration; only the resulting estimate is.

Your email address and phone number are used to notify you. They are not shown to homeowners.

### Emails and texts we send you

**Emails:** account confirmation, password reset, and a notification each time you get a new lead. These are all transactional — they're about your account or your leads. We don't currently send marketing email. If that changes, we'll add a way to unsubscribe from it, and this policy will say so.

**Text messages:** only if you enter a notification phone number in your settings. You'll get one text per new lead, containing the homeowner's name, the service, the estimate, and a link to the lead. Message and data rates may apply.

To stop texts, either clear the phone number in your settings or reply **STOP** to any message. Replying **HELP** returns contact information. We don't send marketing texts.

---

## Technical information

We've kept this deliberately minimal. Here's what actually happens:

**Cookies.** We use cookies for one thing: keeping contractors logged in. There are no advertising cookies, no analytics cookies, and no third-party trackers on any page. If you're a homeowner using an estimate form, we don't set a login cookie for you at all.

**IP addresses.** We record the IP address of requests to the public estimate form, solely to rate-limit abuse — to stop someone from scripting thousands of fake submissions at a contractor or running up our AI costs. It's stored as a counter keyed to the address. It isn't attached to your estimate or your lead, and we don't use it to identify or track you.

[DECISION REQUIRED: these rate-limit records are currently kept indefinitely because nothing deletes them. Decide a retention period — 30 days is more than enough for their purpose — and either implement the cleanup or state the actual behavior here. Do not state a period you aren't actually enforcing.]

**Analytics.** We don't use Google Analytics or any other analytics or tracking product.

**Error reports.** When enabled, we use Sentry to record application errors so we can fix them. It's configured to not collect IP addresses, cookies, request headers, or request bodies, and we never attach user identities to reports. Error reports can still incidentally contain information that happens to appear in the error itself.

**Do Not Track.** We don't track you across other websites, so there's nothing for a Do Not Track signal to turn off, and we don't respond to it. No third party collects personally identifiable information about your activity across other sites through our service.

---

## Service providers

These companies process data so Instant Estimate can work. Each is bound by its own agreement with us and its own privacy terms.

| Provider | What it handles |
|---|---|
| **Supabase** | Database, login/authentication, and file storage (logos and photos) |
| **Anthropic** | Classifying homeowner descriptions into service categories (description text only) |
| [DECISION REQUIRED: email provider — Resend, Postmark, SES, etc.] | Sending account and lead notification emails |
| **Twilio** | Sending text notifications to contractors who opt in |
| **Sentry** | Application error reports, when enabled |
| [DECISION REQUIRED: hosting provider — Vercel, etc.] | Running the application and serving it to browsers |

We are not responsible for these companies' own privacy practices. Their current policies are on their websites.

---

## How long we keep things

Contractor accounts, business details, pricing, estimates, leads, and photos are kept for as long as the contractor's account is open.

If a contractor deletes their account, their business, services, pricing, estimates, leads, and photos are deleted along with it.

[DECISION REQUIRED: There is currently no self-service "delete my account" button. Deletion works and cascades correctly, but it has to be done by us on request. Either build the button or commit here to handling deletion requests manually within a stated timeframe — 30 days is a reasonable commitment. Also decide whether you keep anything after deletion (e.g. billing records) and say so.]

Homeowners: your information lives inside the contractor's account. If you want it removed, contact the contractor you submitted it to, or contact us at the address above and we'll work with them.

---

## Security

Contractor data is isolated at the database level — one contractor's account cannot read or modify another's, and this is enforced by the database itself rather than only by application code. Photos are stored privately and served through short-lived links. Credentials that grant elevated access are held server-side and are never sent to the browser.

No system is perfectly secure, and we're not going to claim otherwise. We don't hold any security certifications.

---

## Your rights

Whoever and wherever you are: you can ask us what we hold about you, ask us to correct it, or ask us to delete it. Email [DECISION REQUIRED: contact email] and we'll respond.

**California residents:** Instant Estimate does not currently meet the thresholds that make a business subject to the California Consumer Privacy Act — we are well under the revenue threshold, we don't buy, sell, or share the personal information of 100,000 or more California residents or households, and we make no revenue from selling personal information. We are therefore not claiming CCPA compliance, because the law doesn't presently apply to us and saying otherwise would be misleading. We'll honor access, correction, and deletion requests from California residents anyway, and if we cross those thresholds we'll update this policy and meet the requirements that come with it.

**We don't sell personal information**, and we don't share it for cross-context behavioral advertising.

---

## Children

Instant Estimate isn't directed at children and isn't designed for them. We don't knowingly collect information from anyone under 13. If you believe a child has submitted information through an estimate form, contact us and we'll delete it.

---

## Where we operate

Instant Estimate is built for home-service businesses in the United States and our providers process data in the United States. It isn't designed for users in the EU or UK, and we don't offer it there.

---

## Changes to this policy

We'll update this policy when the product changes in a way that affects it. When we make a material change, we'll update the effective date at the top and notify contractors by email at the address on their account before it takes effect.

---

## Contact

[DECISION REQUIRED: contact email, and a postal address if you decide to include one]
