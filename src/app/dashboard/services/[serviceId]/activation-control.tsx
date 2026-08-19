"use client";

import { useActionState } from "react";
import { activateService, deactivateService } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ActivationControl({ serviceId, isActive }: { serviceId: string; isActive: boolean }) {
  const boundActivate = activateService.bind(null, serviceId);
  const [state, action, pending] = useActionState(boundActivate, undefined);
  const boundDeactivate = deactivateService.bind(null, serviceId);

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
          <form action={boundDeactivate}>
            <Button type="submit" variant="outline">
              Deactivate
            </Button>
          </form>
        ) : (
          <form action={action}>
            <Button type="submit" disabled={pending}>
              {pending ? "Activating…" : "Activate service"}
            </Button>
            {state?.status === "error" && (
              <p className="mt-2 text-sm text-destructive">{state.message}</p>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
