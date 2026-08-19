@AGENTS.md

# CLAUDE.md

# Instant Estimate

Instant Estimate is an embeddable instant-estimate and lead-capture platform for home-service businesses.

The initial product thesis is:

> If a home-service company can put an "Instant Estimate" experience on its website, homeowners will use it when the contractor is unavailable, and enough of those interactions will become qualified leads that contractors will pay for the system.

The initial product is intentionally narrow.

The first goal is not to build a complete contractor-management platform.

The first goal is to validate whether an instant-estimate widget can generate useful, qualified homeowner leads for contractors.

---

# 1. Project Status

This project is in the MVP definition and implementation stage.

We have deliberately spent significant time researching the market and competitors before beginning implementation.

Do not treat the project as an invitation to invent additional features.

The current direction is:

- embeddable homeowner widget
- instant estimate
- contractor-controlled pricing
- lead capture
- mobile-first homeowner experience
- custom branding
- simple contractor setup
- estimate range / disclaimer
- email notifications
- photo upload
- natural-language homeowner description
- dynamic questions
- contractor-defined pricing rules
- qualified lead information
- shareable estimate links
- SMS notification

The initial vertical is expected to be a single home-service vertical, with plumbing currently the leading candidate.

Do not expand the MVP into a generic multi-vertical platform unless explicitly instructed.

---

# 2. Core Product Principle

The most important architectural and product distinction is:

> AI interprets the homeowner. The pricing engine determines the price.

AI may help understand homeowner input.

AI must not independently invent or determine contractor pricing.

Pricing must originate from explicit contractor-configured pricing rules.

The pricing engine must be deterministic.

---

# 3. Source of Truth

Project specifications are the source of truth for product behavior.

Before implementing a feature, consult the relevant specification.

Do not assume that a previous conversation, an old implementation, or an intuitive interpretation overrides the current specification.

The intended hierarchy is:

```text
CLAUDE.md
    ↓
Product / architecture specifications
    ↓
Implementation
    ↓
Tests

First, review /docs/PRODUCT_SPEC.md
```
