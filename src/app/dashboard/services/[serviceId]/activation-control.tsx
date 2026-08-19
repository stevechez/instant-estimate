"use client";

import { useActionState } from "react";
import { activateService, deactivateService } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ActivationControl({ serviceId, isActive }: { serviceId: string; isActive: boolean }) {
  const [activateState, activateAction, activatePending] = useActionState(
    activateService.bind(null, serviceId),
    undefined
  );
  const [deactivateState, deactivateAction, deactivatePending] = useActionState(
    deactivateService.bind(null, serviceId),
    undefined
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isActive ? "This service is active" : "Not active yet"}</CardTitle>
        <CardDescription>
          {isActive
            ? "Homeowners can get an instant estimate for this service on your widget."
            : "Save a starting price above, then activate to make this service live on your widget."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isActive ? (
          <form action={deactivateAction}>
            <Button type="submit" variant="outline" disabled={deactivatePending}>
              {deactivatePending ? "Deactivating…" : "Deactivate"}
            </Button>
            {deactivateState?.status === "error" && (
              <p className="mt-2 text-sm text-destructive">{deactivateState.message}</p>
            )}
          </form>
        ) : (
          <form action={activateAction}>
            <Button type="submit" disabled={activatePending}>
              {activatePending ? "Activating…" : "Activate service"}
            </Button>
            {activateState?.status === "error" && (
              <p className="mt-2 text-sm text-destructive">{activateState.message}</p>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
