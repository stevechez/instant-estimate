# Instant Estimate — Product Specification

**Status:** Active  
**Version:** 1.0  
**Last Updated:** 2026-08-19  
**Product Name:** Instant Estimate  
**Repository:** `instant-estimate`

---

## 1. Document Purpose

This document is the product source of truth for Instant Estimate.

It defines:

- what the product is
- who it serves
- the problem it solves
- the core user experiences
- the MVP feature set
- estimate behavior
- pricing behavior
- lead behavior
- AI responsibilities
- product boundaries
- success criteria

Technical implementation decisions belong in architecture and engineering documentation unless they directly affect externally observable product behavior.

### Implementation Rule

Claude Code and other implementation tools must not invent product behavior that conflicts with this specification.

When an implementation question is not explicitly answered here, the implementation should favor:

1. the simplest behavior consistent with this specification
2. the smallest implementation that validates the product thesis
3. preserving future extensibility without building future features

Unresolved product questions must be surfaced rather than silently decided during implementation.

---

## 2. Product Definition

Instant Estimate is a 24/7 website-based estimate and lead-capture system for home-service businesses.

A homeowner visiting a participating business's website can:

1. start an instant estimate
2. describe their service need in natural language
3. optionally upload photos
4. answer a small number of relevant questions
5. receive an estimate range
6. provide contact information
7. request follow-up from the contractor

The contractor receives a qualified lead containing the information collected during the estimate process.

The initial product will be validated with plumbing businesses.

The underlying product model should support additional home-service verticals without requiring a fundamental redesign.

---

## 3. Product Thesis

If a home-service business can place an "Instant Estimate" widget on its website, homeowners will use it when they want immediate pricing information, including outside normal business hours or when the contractor cannot immediately answer the phone.

If the interaction provides a useful estimate range and produces a qualified lead, the resulting incremental business will be valuable enough for the contractor to pay a recurring monthly fee.

The MVP exists to test this thesis.

---

## 4. Problem

### Homeowner Problem

A homeowner with an immediate service need often wants to know:

- What is probably wrong?
- What kind of service do I need?
- Roughly what will it cost?
- Can someone help me?
- What should I do next?

Traditional website contact forms answer none of these questions.

Calling the business may also fail when:

- the business is closed
- the contractor is working
- nobody answers
- the homeowner does not want to call
- the homeowner wants pricing information before speaking to someone

### Contractor Problem

A contractor wants to capture potential customers without requiring staff to personally handle every website inquiry.

Potential leads can be lost when:

- nobody answers the phone
- the business is closed
- the contractor is on a job
- office staff are busy
- a homeowner is unwilling to call
- a homeowner leaves the website without submitting contact information

### Product Opportunity

Instant Estimate creates a bridge between these two problems:

**Homeowner gets immediate useful information.**

**Contractor gets a qualified lead.**

---

## 5. Product Outcome

The primary product outcome is:

> Convert a website visitor with a home-service need into a qualified, actionable lead for the contractor.

The estimate is the mechanism that creates value for the homeowner and encourages lead conversion.

The product therefore optimizes for:

1. useful homeowner experience
2. estimate credibility
3. low interaction friction
4. estimate completion
5. lead conversion
6. lead quality
7. contractor response speed

The product does not optimize for:

- AI complexity
- number of features
- number of questions
- maximum estimate precision
- replacing the contractor's existing business software

---

## 6. Initial Customer

### Primary Customer

Independent home-service businesses that:

- have an existing website
- receive consumer service inquiries
- provide services that can be estimated using defined rules
- lose or delay leads when staff cannot immediately respond
- do not need or want a complete field-service-management platform

### Initial Validation Vertical

**Plumbing.**

The MVP will be designed, configured, and validated against plumbing businesses first.

### Customer Size

The initial target is a small-to-medium independent plumbing business.

The MVP will not specifically target:

- national enterprises
- large franchises
- multi-location enterprise operations
- businesses requiring complex enterprise integrations

---

## 7. Initial Plumbing Service Set

The initial plumbing configuration will support seven service categories:

1. Faucet Repair / Replacement
2. Toilet Repair / Replacement
3. Drain Cleaning
4. Garbage Disposal Repair / Replacement
5. Water Heater Repair / Replacement
6. Outdoor Faucet / Hose Bib Repair / Replacement
7. Minor Leak / Supply-Line Repair

These services were selected because they represent relatively common residential plumbing requests while offering a reasonable opportunity for structured intake and contractor-defined pricing.

### Explicitly Excluded From Initial Estimation

The MVP will not attempt to provide automated estimates for:

- sewer line replacement
- sewer excavation
- whole-house repiping
- slab leaks
- major water-line replacement
- extensive water damage
- complex gas-line work
- major remodel plumbing
- jobs requiring substantial inspection before scope can be determined
- situations where the available information is insufficient

These requests may still become leads.

They simply use a request-for-quote / contractor-confirmation path rather than presenting an automated estimate.

---

## 8. Homeowner Experience

The homeowner does not create an account.

The homeowner experience must be:

- mobile-first
- fast
- understandable without technical knowledge
- low-friction
- usable without downloading an application

### Core Flow

Website  
→ Start Instant Estimate  
→ Describe problem  
→ Identify service  
→ Upload photos (optional)  
→ Answer relevant questions  
→ Calculate estimate  
→ Display estimate range  
→ Offer contractor follow-up  
→ Capture contact information  
→ Create lead  
→ Confirmation

---

## 9. Natural-Language Intake

The homeowner should be encouraged to describe the problem in their own words.

Example:

> "My kitchen faucet has been leaking underneath the sink."

The system uses this information to identify the likely service category and determine the appropriate next questions.

The homeowner should not be required to understand plumbing terminology.

---

## 10. Photo Upload

The homeowner may upload up to three photos during the estimate flow.

Photos are intended to:

- provide additional context
- improve lead quality
- help the contractor understand the request
- potentially assist AI classification in future versions

### MVP Photo Behavior

Photos are supporting evidence.

The MVP does not depend on AI image analysis to calculate the estimate.

The product must not imply that a photo provides a guaranteed diagnosis or guarantees estimate accuracy.

---

## 11. Dynamic Questions

The system asks only questions relevant to the homeowner's identified service/problem.

Questions should be:

- short
- understandable
- answerable on mobile
- limited to information that affects classification, qualification, or pricing

Example:

### Toilet

- Is the toilet constantly running?
- Is there visible leaking?
- Does it flush normally?

### Water Heater

- Is the unit leaking?
- Are you getting hot water?
- Do you know whether it is gas or electric?

### Faucet

- Is this a repair or replacement?
- Which room is the faucet in?
- Is water leaking from the faucet, underneath the sink, or both?

The system must not ask questions merely because information exists that could theoretically be collected.

Every question should have a product purpose.

---

## 12. Contractor Pricing

Contractors are the source of truth for customer-facing pricing.

Instant Estimate does not determine what a contractor should charge.

The contractor configures pricing rules that the system applies to the information collected from the homeowner.

### Pricing Model

The MVP supports:

- base service price
- price modifiers
- optional add-ons
- minimum price where applicable
- estimate range configuration

Potential modifiers include:

- service variant
- complexity
- urgency
- after-hours
- weekend
- location
- property type
- additional work

Only pricing dimensions required by the initial plumbing configuration should be implemented in V1.

The pricing engine must be deterministic and testable.

---

## 13. Contractor Pricing Setup

The contractor should not be required to construct a complicated pricing-rule system from scratch.

The MVP should provide an opinionated setup experience.

For each supported service, the contractor is guided through:

1. selecting the service
2. entering a normal starting price or price range
3. configuring relevant variations
4. configuring optional add-ons
5. reviewing example estimates
6. activating the service

The system should provide sensible defaults where possible.

The contractor must be able to review the resulting estimate logic before making the service live.

### Important Constraint

Pricing configuration must remain understandable to a non-technical business owner.

The MVP must not expose a general-purpose programming language, formula builder, or unnecessarily complex rules engine.

---

## 14. Estimate Calculation

The estimate is calculated by applying contractor-defined pricing rules to structured information collected during the homeowner flow.

Conceptually:

**Homeowner input**  
→ **Service classification**  
→ **Structured answers**  
→ **Applicable pricing rules**  
→ **Estimate range**

AI may assist with classification and interpretation.

AI does not independently determine the contractor's price.

### Estimate Output

The default output is a price range.

Example:

> **Estimated range**  
> **$250–$325**

The system should avoid false precision such as:

> $287.43

unless the contractor explicitly configures a fixed-price service.

### Estimate Disclaimer

Every automated estimate must clearly communicate that:

- the estimate is based on information supplied by the homeowner
- actual conditions may change the final price
- the contractor may need to confirm the scope
- the estimate is not a guarantee of final pricing

---

## 15. Uncertain or Unestimable Jobs

The system must not fabricate an estimate when there is insufficient information to produce a meaningful result.

If the system cannot confidently classify or price a request, it should transition to a contractor-contact path.

Example:

> "This type of plumbing issue usually requires an in-person evaluation. We can still send your information to the plumber so they can follow up with you."

The homeowner may then submit:

- name
- phone
- email
- description
- photos
- location
- urgency

The resulting submission is still a valid lead.

### Principle

**A qualified lead without an automated estimate is preferable to a misleading estimate.**

---

## 16. Estimate-to-Lead Conversion

After displaying an estimate, the system should present a clear next action.

Example:

> **Want the plumber to confirm your estimate?**

The homeowner can then submit contact information.

The system should not require contact information merely to begin the estimate.

The estimate should provide value before requesting personal information.

### Required Lead Information

At minimum:

- name
- phone number

Optional:

- email
- service address
- preferred contact method
- preferred service timing

---

## 17. Lead Definition

A qualified lead is a homeowner submission containing enough information for the contractor to understand and act on the request.

A lead should contain, when available:

- homeowner name
- phone
- email
- service category
- homeowner description
- answers to relevant questions
- uploaded photos
- estimate range
- urgency
- service address
- creation timestamp

The system should preserve the information used to produce the estimate so the contractor can understand how the estimate was generated.

---

## 18. Contractor Dashboard

The MVP dashboard provides a simple view of submitted leads.

A contractor can:

- view new leads
- view lead details
- see the estimate
- see homeowner answers
- view uploaded photos
- view contact information
- see urgency
- see when the lead was submitted
- mark a lead's basic status

### MVP Lead Statuses

- New
- Contacted
- Won
- Lost

The dashboard is not intended to become a CRM.

---

## 19. Notifications

A contractor must be notified promptly when a new lead is submitted.

### MVP

Email notification is required.

### Notification Content

The notification should include:

- homeowner name
- service
- estimate range
- urgency
- short description
- contact information
- link to the lead

### SMS

SMS notifications are planned as the next notification channel.

The system architecture should permit SMS without requiring a fundamental redesign.

SMS is not required for the first working MVP unless implementation cost and validation justify including it immediately.

---

## 20. Shareable Estimate

The system should support a shareable estimate URL.

A contractor or other authorized user can send a homeowner a link that opens the estimate experience.

The link may eventually support:

- returning to an existing estimate
- completing a partially completed estimate
- sharing an estimate request

The MVP only requires a simple shareable entry point and does not require a full customer portal.

---

## 21. Embeddable Widget

The Instant Estimate experience must be embeddable into an existing contractor website.

The contractor should not need to rebuild their website.

### MVP Requirements

The widget must:

- work on desktop
- work on mobile
- load independently
- display contractor branding
- launch the estimate flow
- return the homeowner to a useful confirmation state
- support installation without requiring programming knowledge beyond copying the provided embed code

### Installation

The contractor receives a copy/paste installation method.

The MVP does not require native integrations with WordPress, Squarespace, Wix, Webflow, or other website platforms.

---

## 22. Branding

The contractor can configure basic branding.

MVP branding includes:

- business name
- logo
- primary brand color
- basic accent styling
- contractor-facing business messaging

The homeowner should understand that the estimate experience belongs to the contractor.

The MVP does not require a full theme editor.

---

## 23. AI Responsibilities

AI is an assistive component of Instant Estimate.

AI may:

- interpret natural-language homeowner descriptions
- classify likely service categories
- identify relevant follow-up questions
- summarize homeowner information
- assist with photo interpretation in future versions
- identify ambiguous or incomplete information
- assist with lead qualification

AI must not:

- invent contractor pricing
- override contractor pricing rules
- present unsupported certainty
- fabricate missing information
- claim to provide a professional diagnosis
- force an estimate when insufficient information exists

### AI Failure Behavior

When AI confidence is insufficient, the system should:

1. ask a clarifying question when useful, or
2. route the homeowner to contractor confirmation/request-for-quote

The system must prefer uncertainty over fabricated confidence.

---

## 24. Data Sources

The following sources are authoritative:

### Contractor Profile

The contractor's configured business information is authoritative.

### Pricing

The contractor's active pricing configuration is authoritative.

### Homeowner Input

The homeowner's submitted information is the source of truth for the information they provided.

### Estimate

The pricing engine's calculated result is the source of truth for the estimate generated by the system.

### AI Output

AI output is interpretive and must not be treated as authoritative pricing or verified factual information.

---

## 25. Security and Privacy Requirements

The MVP must:

- isolate contractor data between accounts
- prevent one contractor from accessing another contractor's leads
- protect homeowner contact information
- restrict uploaded photos to authorized contexts
- require authentication for contractor dashboard access
- avoid exposing private lead information through public widget URLs

Homeowner account creation is not required.

Public estimate interactions must expose only the information necessary to complete the estimate flow.

---

## 26. Commercial Model

### Launch Pricing

The initial commercial experiment will use:

> **$27/month**

This is a founding/launch price intended to reduce purchasing friction while validating the product.

The $27 price is not considered a permanent pricing commitment.

### MVP Principle

Pricing should remain simple.

The MVP does not require multiple complex plans.

The initial goal is to determine whether contractors will pay for the core value proposition:

> qualified leads generated through an instant-estimate experience.

---

## 27. Non-Goals

The MVP is not:

- a CRM
- a field-service management platform
- a dispatch system
- an invoicing platform
- a payment processor
- a scheduling platform
- a marketplace
- a contractor directory
- a replacement for Jobber
- a replacement for Housecall Pro
- a replacement for ServiceTitan
- a general-purpose AI chatbot
- an autonomous AI pricing agent
- a professional diagnostic system
- a consumer home-repair advisor

The MVP will not attempt to support every home-service vertical at launch.

The MVP will validate plumbing first.

---

## 28. Product Model

The underlying product should conceptually model:

**Business**  
→ **Services**  
→ **Questions**  
→ **Pricing Rules**  
→ **Estimate**  
→ **Lead**

The plumbing implementation is configuration applied to this model, not a separate plumbing-specific application.

### Example

```text
Business
  └── Plumbing Services
       ├── Faucet
       ├── Toilet
       ├── Drain
       ├── Garbage Disposal
       ├── Water Heater
       ├── Hose Bib
       └── Minor Leak
```

29. MVP Scope
    Contractor
    account creation/login
    business profile
    basic branding
    service configuration
    pricing configuration
    estimate configuration
    widget installation
    lead dashboard
    lead detail
    email notification
    Homeowner
    mobile-first widget
    natural-language description
    service classification
    photo upload
    dynamic questions
    estimate calculation
    estimate range
    estimate disclaimer
    lead capture
    confirmation
    System
    multi-tenant data isolation
    authentication
    pricing engine
    AI-assisted classification
    file storage
    email notification
    basic lead status
    shareable estimate entry point
30. Post-MVP Roadmap

Features below are explicitly outside the initial MVP.

V1.1
SMS notifications
richer pricing rules
estimate history
improved lead management
AI-assisted photo analysis
more plumbing services
additional contractor customization
V2
additional verticals
CRM integrations
scheduling integrations
Jobber integration
Housecall Pro integration
Google Business Profile integration
financing
payments
automated lead follow-up
advanced analytics
SEO/structured-data features
AI voice intake
Not Planned Without Strong Validation
full CRM
dispatch
technician mobile application
accounting
inventory management
complete field-service-management suite 31. Success Metrics

The MVP exists to validate six hypotheses.

H1 — Homeowner Adoption

Homeowners will start an estimate when presented with the widget.

H2 — Estimate Completion

Homeowners will provide enough information to receive an estimate or appropriately transition to a contractor-contact path.

H3 — Lead Conversion

A meaningful percentage of homeowners who receive an estimate will submit contact information.

H4 — Lead Quality

Contractors will consider the resulting leads sufficiently qualified to be actionable.

H5 — Economic Value

Contractors will believe the system generates incremental business worth more than the subscription price.

H6 — Retention

Contractors who receive useful leads will continue using the service.

Primary Business Metric

The most important early metric is not:

number of estimates
number of users
number of AI calls
number of widget impressions

It is:

Qualified leads generated per contractor per month.

Secondary metrics include:

widget start rate
estimate completion rate
lead conversion rate
contractor response rate
lead-to-job conversion
estimated revenue generated
monthly retention 32. Product Principles

1. Useful Beats Impressive

The homeowner should receive useful information, not an impressive AI demonstration.

2. Contractor Controls Pricing

Instant Estimate provides the mechanism.

The contractor controls the economics.

3. Minimize Homeowner Friction

No account.

No unnecessary questions.

No unnecessary steps.

4. AI Assists; Rules Decide

AI interprets ambiguous human input.

Explicit pricing rules determine the estimate.

5. Uncertainty Is Better Than False Precision

If the system cannot produce a defensible estimate, it should capture the lead rather than fabricate an answer.

6. Lead Quality Matters More Than Lead Quantity

The goal is not to collect contact information.

The goal is to produce leads the contractor can actually act on.

7. The Estimate Creates the Lead

The estimate is not the ultimate product outcome.

It is the value exchange that encourages the homeowner to become a lead.

8. Build the Smallest Product That Proves the Thesis

Features should be added because they improve the core product loop, not because competitors have them.

9. Vertical First, Platform Second

Validate the product with one vertical before expanding the go-to-market scope.

10. Preserve Extensibility Without Building Complexity

The underlying model should support future verticals, but the MVP should remain opinionated and simple.

33. Product Definition of Done

The MVP is product-complete when a real plumbing business can:

create an account
configure its business profile
configure its supported services
configure its pricing
customize basic branding
obtain an embed snippet
install the widget on a website
receive a homeowner estimate request
have the system classify and process the request
produce a contractor-configured estimate range when appropriate
gracefully handle requests that cannot be estimated
capture a qualified lead
receive notification of the lead
view the lead in the contractor dashboard
understand the information that produced the estimate

A homeowner must be able to complete the experience from a mobile device without creating an account.

34. Final Product Definition

Instant Estimate is a simple, embeddable 24/7 estimate and lead capture system for home-service businesses.

The initial product is built for plumbing businesses.

A homeowner describes a plumbing problem, optionally provides photos, answers a small number of relevant questions, and receives a contractor-configured estimate range.

The homeowner can then request follow-up.

The contractor receives a qualified lead containing the information needed to act.

The system uses AI to interpret and organize homeowner input.

The pricing engine uses contractor-defined rules to determine the estimate.

The product does not attempt to replace the contractor's CRM, scheduling, dispatch, invoicing, or field-service software.

Its job is much simpler:

Turn website visitors into informed homeowners and qualified leads, 24 hours a day.

**I would consider this the baseline product contract.** Before we start implementation, the next document should be `PRICING_ENGINE_SPEC.md`, because that's where we need to get extremely concrete about how a contractor's rules turn homeowner answers into an actual `$X–$Y` estimate.
