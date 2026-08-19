"use client";

import { useActionState } from "react";
import { updateLeadStatus } from "./actions";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FieldLabel } from "@/components/ui/field";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export function StatusControl({ leadId, currentStatus }: { leadId: string; currentStatus: string }) {
  const [state, action, pending] = useActionState(updateLeadStatus.bind(null, leadId), undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <RadioGroup name="status" defaultValue={currentStatus} className="grid-cols-4">
        {STATUS_OPTIONS.map((option) => (
          <FieldLabel key={option.value} htmlFor={`status-${option.value}`} className="justify-center">
            <RadioGroupItem id={`status-${option.value}`} value={option.value} />
            {option.label}
          </FieldLabel>
        ))}
      </RadioGroup>
      {state?.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
      <Button type="submit" disabled={pending} variant="outline" size="sm" className="self-start">
        {pending ? "Updating…" : "Update status"}
      </Button>
    </form>
  );
}
