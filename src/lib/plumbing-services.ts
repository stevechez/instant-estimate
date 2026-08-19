/**
 * The fixed V1 plumbing service catalog (PRODUCT_SPEC.md Section 7). This is
 * intentionally not contractor-editable — a contractor picks from this list
 * rather than typing in arbitrary service names, matching the MVP's
 * opinionated, non-generic setup experience (Section 13, Section 27).
 */
export interface PlumbingServiceCatalogEntry {
  key: string;
  name: string;
}

export const PLUMBING_SERVICE_CATALOG: PlumbingServiceCatalogEntry[] = [
  { key: "faucet", name: "Faucet Repair / Replacement" },
  { key: "toilet", name: "Toilet Repair / Replacement" },
  { key: "drain_cleaning", name: "Drain Cleaning" },
  { key: "garbage_disposal", name: "Garbage Disposal Repair / Replacement" },
  { key: "water_heater", name: "Water Heater Repair / Replacement" },
  { key: "hose_bib", name: "Outdoor Faucet / Hose Bib Repair / Replacement" },
  { key: "minor_leak", name: "Minor Leak / Supply-Line Repair" },
];

export interface DefaultVariant {
  key: string;
  name: string;
}

/**
 * Default service_variants created automatically when a contractor selects a
 * service (see onboarding/services/actions.ts) — not authored by the
 * contractor. Five of the seven catalog entries have "Repair / Replacement"
 * right in their name, so those get two variants, each with its own
 * starting price (PRICING_ENGINE_SPEC.md Section 4: a variant is a distinct
 * base price, not a modifier). Drain Cleaning and Minor Leak don't have that
 * split, so they get a single variant. V1 does not offer a UI to add,
 * rename, or remove variants beyond this fixed default — see PRICING_ENGINE_SPEC.md
 * Section 14 (out of scope for V1: contractor-defined variant structures).
 */
export const DEFAULT_VARIANTS: Record<string, DefaultVariant[]> = {
  faucet: [
    { key: "repair", name: "Repair" },
    { key: "replacement", name: "Replacement" },
  ],
  toilet: [
    { key: "repair", name: "Repair" },
    { key: "replacement", name: "Replacement" },
  ],
  drain_cleaning: [{ key: "standard", name: "Drain Cleaning" }],
  garbage_disposal: [
    { key: "repair", name: "Repair" },
    { key: "replacement", name: "Replacement" },
  ],
  water_heater: [
    { key: "repair", name: "Repair" },
    { key: "replacement", name: "Replacement" },
  ],
  hose_bib: [
    { key: "repair", name: "Repair" },
    { key: "replacement", name: "Replacement" },
  ],
  minor_leak: [{ key: "standard", name: "Repair" }],
};

export interface UniversalModifierDef {
  /** Matches pricing_modifiers.key */
  key: string;
  /** Contractor-facing label */
  label: string;
  /** Matches pricing_modifiers.condition_question_key */
  conditionQuestionKey: string;
  /** Matches pricing_modifiers.condition_equals */
  conditionEquals: string;
}

/**
 * Fixed, system-provided modifier dimensions every variant can optionally
 * price (PRODUCT_SPEC.md Section 12 lists these as base pricing dimensions,
 * distinct from Section 11's per-service diagnostic questions like
 * "is the toilet constantly running?"). A contractor sets a flat $ amount
 * for each; leaving one at $0/blank means that surcharge isn't offered.
 * Contractor-authored custom questions/modifiers are not in V1 — see
 * PRICING_ENGINE_SPEC.md Section 14.
 */
export const UNIVERSAL_MODIFIERS: UniversalModifierDef[] = [
  {
    key: "urgency_emergency",
    label: "Emergency / same-day service",
    conditionQuestionKey: "urgency",
    conditionEquals: "emergency",
  },
  {
    key: "after_hours",
    label: "After-hours (evenings)",
    conditionQuestionKey: "after_hours",
    conditionEquals: "true",
  },
  {
    key: "weekend",
    label: "Weekend",
    conditionQuestionKey: "weekend",
    conditionEquals: "true",
  },
];
