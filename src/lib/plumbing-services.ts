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
