"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";
import { UNIVERSAL_MODIFIERS } from "@/lib/plumbing-services";
import { formatEstimateResult } from "@/lib/pricing/format";
import type { VariantWithPricing } from "./data";

function centsToDollarString(cents: number | null): string {
  return cents && cents > 0 ? (cents / 100).toFixed(2) : "";
}

export function VariantCard({ variant }: { variant: VariantWithPricing }) {
  const [addOnRows, setAddOnRows] = useState(
    variant.add_ons.length > 0
      ? variant.add_ons.map((a) => ({ name: a.name, price: (a.amount_cents / 100).toFixed(2) }))
      : [{ name: "", price: "" }]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{variant.name}</span>
          {variant.is_active && (
            <span className="text-xs font-normal text-muted-foreground">Priced</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldContent>
              <FieldLabel htmlFor={`price__${variant.key}`}>Starting price</FieldLabel>
              <Input
                id={`price__${variant.key}`}
                name={`price__${variant.key}`}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="e.g. 275"
                defaultValue={centsToDollarString(variant.starting_price_cents)}
              />
              <FieldDescription>
                Shown as a range (±15%) unless marked flat price below.
              </FieldDescription>
            </FieldContent>
          </Field>
          <Field>
            <FieldContent>
              <FieldLabel htmlFor={`minimum__${variant.key}`}>Minimum price</FieldLabel>
              <Input
                id={`minimum__${variant.key}`}
                name={`minimum__${variant.key}`}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="Optional"
                defaultValue={centsToDollarString(variant.minimum_price_cents)}
              />
            </FieldContent>
          </Field>
        </div>

        <FieldLabel htmlFor={`fixed__${variant.key}`}>
          <Checkbox
            id={`fixed__${variant.key}`}
            name={`fixed__${variant.key}`}
            defaultChecked={variant.pricing_mode === "fixed"}
          />
          Flat price (show a single price instead of a range)
        </FieldLabel>

        <div>
          <p className="mb-2 text-sm font-medium">Surcharges</p>
          <div className="grid grid-cols-3 gap-3">
            {UNIVERSAL_MODIFIERS.map((def) => {
              const existing = variant.modifiers.find((m) => m.key === def.key);
              return (
                <Field key={def.key}>
                  <FieldContent>
                    <FieldLabel htmlFor={`mod_${def.key}__${variant.key}`}>{def.label}</FieldLabel>
                    <Input
                      id={`mod_${def.key}__${variant.key}`}
                      name={`mod_${def.key}__${variant.key}`}
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="Not offered"
                      defaultValue={existing ? (existing.amount_cents / 100).toFixed(2) : ""}
                    />
                  </FieldContent>
                </Field>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Optional add-ons</p>
          <div className="flex flex-col gap-2">
            {addOnRows.map((row, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  name={`addon_name__${variant.key}`}
                  placeholder="e.g. Haul away old unit"
                  defaultValue={row.name}
                  className="flex-1"
                />
                <Input
                  name={`addon_price__${variant.key}`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="Price"
                  defaultValue={row.price}
                  className="w-28"
                />
                {addOnRows.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAddOnRows((rows) => rows.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => setAddOnRows((rows) => [...rows, { name: "", price: "" }])}
            >
              Add another
            </Button>
          </div>
        </div>

        {variant.examples && (
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <p className="font-medium">Example estimates with this pricing</p>
            <p className="text-muted-foreground">
              Normal: {formatEstimateResult(variant.examples.normal)}
            </p>
            <p className="text-muted-foreground">
              Emergency, after-hours, weekend, all add-ons:{" "}
              {formatEstimateResult(variant.examples.everything)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
