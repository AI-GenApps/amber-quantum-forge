"use client";

import type { MaintenanceMode } from "@repo/api/types/config";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Switch } from "../../../components/ui/switch";
import { Textarea } from "../../../components/ui/textarea";
import { updateMaintenanceMode } from "../actions";

export function MaintenanceTab({ initial }: { initial: MaintenanceMode }) {
  const [state, setState] = useState<MaintenanceMode>(initial);
  const [pending, start] = useTransition();

  function onSave() {
    start(async () => {
      const result = await updateMaintenanceMode(state);
      if (result.ok) toast.success("Maintenance mode saved");
      else toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Mode</CardTitle>
        <CardDescription>When enabled, the native app shows a full-screen blocker.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-md border p-3">
          <Label htmlFor="enabled" className="cursor-pointer">
            Enabled
          </Label>
          <Switch
            id="enabled"
            checked={state.enabled}
            onCheckedChange={(v) => setState((prev) => ({ ...prev, enabled: v }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Message shown to users</Label>
          <Textarea
            id="message"
            value={state.message}
            onChange={(e) => setState((prev) => ({ ...prev, message: e.target.value }))}
            placeholder="We'll be back shortly."
            rows={3}
          />
        </div>
        <Button onClick={onSave} disabled={pending}>
          {pending ? "Saving…" : "Save Maintenance"}
        </Button>
      </CardContent>
    </Card>
  );
}
