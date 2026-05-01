"use client";

import type { VersionConfig } from "@repo/api/types/config";
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
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { updateVersionConfig } from "../actions";

export function VersionTab({ initial }: { initial: VersionConfig }) {
  const [state, setState] = useState<VersionConfig>(initial);
  const [pending, start] = useTransition();

  const set = <K extends keyof VersionConfig>(key: K, value: VersionConfig[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  function onSave() {
    start(async () => {
      const result = await updateVersionConfig(state);
      if (result.ok) toast.success("Version config saved");
      else toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Version Gate</CardTitle>
        <CardDescription>
          Below <code>minVersion</code> + <code>mandatory</code> = full-screen blocker. Below{" "}
          <code>latestVersion</code> + <code>optional</code> = dismissible banner.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latestVersion">Latest Version</Label>
            <Input
              id="latestVersion"
              value={state.latestVersion}
              onChange={(e) => set("latestVersion", e.target.value)}
              placeholder="1.2.0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minVersion">Minimum Version</Label>
            <Input
              id="minVersion"
              value={state.minVersion}
              onChange={(e) => set("minVersion", e.target.value)}
              placeholder="1.0.0"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="updateType">Update Type</Label>
          <select
            id="updateType"
            value={state.updateType}
            onChange={(e) => set("updateType", e.target.value as VersionConfig["updateType"])}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="optional">Optional</option>
            <option value="mandatory">Mandatory</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="forceUpdateMessage">Force-update message</Label>
          <Textarea
            id="forceUpdateMessage"
            value={state.forceUpdateMessage ?? ""}
            onChange={(e) => set("forceUpdateMessage", e.target.value)}
            placeholder="A new version is required to keep using the app."
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="optionalUpdateMessage">Optional-update message</Label>
          <Textarea
            id="optionalUpdateMessage"
            value={state.optionalUpdateMessage ?? ""}
            onChange={(e) => set("optionalUpdateMessage", e.target.value)}
            placeholder="A new version is available."
            rows={2}
          />
        </div>
        <Button onClick={onSave} disabled={pending}>
          {pending ? "Saving…" : "Save Version Config"}
        </Button>
      </CardContent>
    </Card>
  );
}
