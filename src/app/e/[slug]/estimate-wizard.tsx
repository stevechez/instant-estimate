"use client";

import { useState, useTransition } from "react";
import {
  classifyDescription,
  getVariantOptions,
  submitEstimate,
  submitLead,
  submitUnmatchedEstimate,
} from "./actions";
import type { PublicBusiness, PublicServiceOption, VariantForEstimate } from "./data";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { formatEstimateResult } from "@/lib/pricing/format";
import { ESTIMATE_DISCLAIMER } from "@/lib/estimate-disclaimer";
import type { PricingResult } from "@/lib/pricing/types";

type Step =
  | "describe"
  | "questions"
  | "estimate"
  | "contact"
  | "confirmation";

interface Answers {
  urgency?: "normal" | "emergency";
  after_hours?: boolean;
  weekend?: boolean;
}

export function EstimateWizard({
  business,
  services,
}: {
  business: PublicBusiness;
  services: PublicServiceOption[];
}) {
  const [step, setStep] = useState<Step>("describe");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [matchedService, setMatchedService] = useState<PublicServiceOption | null>(null);
  const [variants, setVariants] = useState<VariantForEstimate[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [selectedAddOnKeys, setSelectedAddOnKeys] = useState<string[]>([]);

  const [estimateId, setEstimateId] = useState<string | null>(null);
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;

  function handleDescribeSubmit() {
    setError(null);
    startTransition(async () => {
      const classification = await classifyDescription(business.id, description);

      if (classification.status === "unmatched") {
        const result = await submitUnmatchedEstimate(business.id, description);
        if (result.status === "error") {
          setError(result.message);
          return;
        }
        setEstimateId(result.estimateId);
        setPricingResult(result.result);
        setStep("estimate");
        return;
      }

      setMatchedService(classification.service);
      const { variants: loadedVariants } = await getVariantOptions(business.id, classification.service.id);
      if (loadedVariants.length === 0) {
        // Matched a service, but nothing about it is actually priced right now.
        const result = await submitUnmatchedEstimate(business.id, description);
        if (result.status === "error") {
          setError(result.message);
          return;
        }
        setEstimateId(result.estimateId);
        setPricingResult(result.result);
        setStep("estimate");
        return;
      }

      setVariants(loadedVariants);
      setSelectedVariantId(loadedVariants[0].id);
      setStep("questions");
    });
  }

  function handleQuestionsSubmit() {
    if (!matchedService || !selectedVariant) return;
    setError(null);
    startTransition(async () => {
      const result = await submitEstimate({
        businessId: business.id,
        serviceId: matchedService.id,
        variantId: selectedVariant.id,
        description,
        aiMatchedServiceKey: matchedService.key,
        answers,
        selectedAddOnKeys,
      });
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setEstimateId(result.estimateId);
      setPricingResult(result.result);
      setStep("estimate");
    });
  }

  function handleLeadSubmit(formData: FormData) {
    if (!estimateId) return;
    setError(null);
    startTransition(async () => {
      const result = await submitLead({
        estimateId,
        businessId: business.id,
        name: String(formData.get("name") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        email: String(formData.get("email") ?? ""),
        serviceAddress: String(formData.get("service_address") ?? ""),
        preferredContactMethod: String(formData.get("preferred_contact_method") ?? ""),
        preferredServiceTiming: String(formData.get("preferred_service_timing") ?? ""),
      });
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setStep("confirmation");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        {business.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element -- contractor-supplied logo URL, not a local asset
          <img src={business.logo_url} alt={business.name} className="mx-auto mb-2 h-10" />
        )}
        <h1 className="font-heading text-xl font-medium">{business.name}</h1>
        <p className="text-sm text-muted-foreground">Instant Estimate</p>
      </div>

      {step === "describe" && (
        <Card>
          <CardHeader>
            <CardTitle>What&apos;s going on?</CardTitle>
            <CardDescription>Describe the problem in your own words.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. My kitchen faucet has been leaking underneath the sink."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              We can help with: {services.map((s) => s.name).join(", ")}
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleDescribeSubmit} disabled={pending || description.trim().length < 3}>
              {pending ? "Thinking…" : "Get my estimate"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "questions" && matchedService && (
        <QuestionsStep
          serviceName={matchedService.name}
          variants={variants}
          selectedVariant={selectedVariant}
          onSelectVariant={setSelectedVariantId}
          answers={answers}
          onAnswersChange={setAnswers}
          selectedAddOnKeys={selectedAddOnKeys}
          onAddOnsChange={setSelectedAddOnKeys}
          pending={pending}
          error={error}
          onSubmit={handleQuestionsSubmit}
        />
      )}

      {step === "estimate" && pricingResult && (
        <EstimateStep result={pricingResult} onContinue={() => setStep("contact")} />
      )}

      {step === "contact" && (
        <ContactStep pending={pending} error={error} onSubmit={handleLeadSubmit} />
      )}

      {step === "confirmation" && <ConfirmationStep businessName={business.name} />}
    </div>
  );
}

function QuestionsStep({
  serviceName,
  variants,
  selectedVariant,
  onSelectVariant,
  answers,
  onAnswersChange,
  selectedAddOnKeys,
  onAddOnsChange,
  pending,
  error,
  onSubmit,
}: {
  serviceName: string;
  variants: VariantForEstimate[];
  selectedVariant: VariantForEstimate | null;
  onSelectVariant: (id: string) => void;
  answers: Answers;
  onAnswersChange: (a: Answers) => void;
  selectedAddOnKeys: string[];
  onAddOnsChange: (keys: string[]) => void;
  pending: boolean;
  error: string | null;
  onSubmit: () => void;
}) {
  const activeQuestionKeys = new Set(selectedVariant?.modifiers.map((m) => m.condition_question_key) ?? []);
  const addOns = selectedVariant?.add_ons ?? [];
  const nothingToAsk = variants.length <= 1 && activeQuestionKeys.size === 0 && addOns.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{serviceName}</CardTitle>
        <CardDescription>
          {nothingToAsk ? "One more tap and we'll calculate your estimate." : "A few quick questions."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {variants.length > 1 && (
          <Field>
            <FieldContent>
              <FieldLabel>Is this a repair or a replacement?</FieldLabel>
              <RadioGroup
                value={selectedVariant?.id}
                onValueChange={(value) => onSelectVariant(String(value))}
              >
                {variants.map((variant) => (
                  <FieldLabel key={variant.id} htmlFor={`variant-${variant.id}`}>
                    <RadioGroupItem id={`variant-${variant.id}`} value={variant.id} />
                    {variant.name}
                  </FieldLabel>
                ))}
              </RadioGroup>
            </FieldContent>
          </Field>
        )}

        {activeQuestionKeys.has("urgency") && (
          <Field>
            <FieldContent>
              <FieldLabel>Is this an emergency?</FieldLabel>
              <RadioGroup
                value={answers.urgency ?? "normal"}
                onValueChange={(value) => onAnswersChange({ ...answers, urgency: value as "normal" | "emergency" })}
              >
                <FieldLabel htmlFor="urgency-normal">
                  <RadioGroupItem id="urgency-normal" value="normal" />
                  No, it can wait
                </FieldLabel>
                <FieldLabel htmlFor="urgency-emergency">
                  <RadioGroupItem id="urgency-emergency" value="emergency" />
                  Yes, I need help right away
                </FieldLabel>
              </RadioGroup>
            </FieldContent>
          </Field>
        )}

        {activeQuestionKeys.has("after_hours") && (
          <FieldLabel htmlFor="after-hours">
            <Checkbox
              id="after-hours"
              checked={answers.after_hours ?? false}
              onCheckedChange={(checked) => onAnswersChange({ ...answers, after_hours: checked === true })}
            />
            This would be after normal business hours (evening)
          </FieldLabel>
        )}

        {activeQuestionKeys.has("weekend") && (
          <FieldLabel htmlFor="weekend">
            <Checkbox
              id="weekend"
              checked={answers.weekend ?? false}
              onCheckedChange={(checked) => onAnswersChange({ ...answers, weekend: checked === true })}
            />
            This would be on a weekend
          </FieldLabel>
        )}

        {addOns.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Anything else you&apos;d like included?</p>
            <div className="flex flex-col gap-2">
              {addOns.map((addOn) => (
                <FieldLabel key={addOn.key} htmlFor={`addon-${addOn.key}`}>
                  <Checkbox
                    id={`addon-${addOn.key}`}
                    checked={selectedAddOnKeys.includes(addOn.key)}
                    onCheckedChange={(checked) =>
                      onAddOnsChange(
                        checked === true
                          ? [...selectedAddOnKeys, addOn.key]
                          : selectedAddOnKeys.filter((k) => k !== addOn.key)
                      )
                    }
                  />
                  {addOn.name}
                </FieldLabel>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={onSubmit} disabled={pending || !selectedVariant}>
          {pending ? "Calculating…" : "See my estimate"}
        </Button>
      </CardContent>
    </Card>
  );
}

function EstimateStep({ result, onContinue }: { result: PricingResult; onContinue: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {result.status === "quote_required" ? "We'll need a closer look" : "Your estimated range"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {result.status === "quote_required" ? (
          <p className="text-sm text-muted-foreground">
            This type of job usually needs an in-person evaluation to price accurately. We can still send your
            information to the contractor so they can follow up with you.
          </p>
        ) : (
          <>
            <p className="text-center text-3xl font-medium">{formatEstimateResult(result)}</p>
            <p className="text-sm text-muted-foreground">{ESTIMATE_DISCLAIMER}</p>
          </>
        )}
        <Button onClick={onContinue}>
          {result.status === "quote_required" ? "Request a quote" : "Want the contractor to confirm this estimate?"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ContactStep({
  pending,
  error,
  onSubmit,
}: {
  pending: boolean;
  error: string | null;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How should we reach you?</CardTitle>
        <CardDescription>We&apos;ll pass this along so the contractor can follow up.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={onSubmit} className="flex flex-col gap-4">
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input id="name" name="name" required />
            </FieldContent>
          </Field>
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="phone">Phone</FieldLabel>
              <Input id="phone" name="phone" type="tel" required />
            </FieldContent>
          </Field>
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="email">Email (optional)</FieldLabel>
              <Input id="email" name="email" type="email" />
            </FieldContent>
          </Field>
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="service_address">Service address (optional)</FieldLabel>
              <Input id="service_address" name="service_address" />
            </FieldContent>
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send my request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ConfirmationStep({ businessName }: { businessName: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>You&apos;re all set</CardTitle>
        <CardDescription>
          {businessName} has received your request and will be in touch soon.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
