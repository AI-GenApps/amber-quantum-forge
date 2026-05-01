"use client";

import type { FeatureFlags } from "@repo/api/types/config";
import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Switch } from "../../../components/ui/switch";
import { updateFeatureFlags } from "../actions";

export function FeatureFlagsTab({ initial }: { initial: FeatureFlags }) {
  const [flags, setFlags] = useState<FeatureFlags>(initial);
  const [newKey, setNewKey] = useState("");
  const [pending, start] = useTransition();

  function addFlag() {
    const key = newKey.trim().toLowerCase().replace(/\s+/g, "_");
    if (!key || flags[key] !== undefined) return;
    setFlags((prev) => ({ ...prev, [key]: false }));
    setNewKey("");
  }

  function toggle(key: string) {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function remove(key: string) {
    setFlags((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function onSave() {
    start(async () => {
      const result = await updateFeatureFlags(flags);
      if (result.ok) toast.success("Feature flags saved");
      else toast.error(result.error);
    });
  }

  const entries = Object.entries(flags);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <CardDescription>
          Boolean toggles consumed via <code>isFeatureEnabled(key)</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No flags yet.</p>
        ) : (
          <ul className="space-y-2">
            {entries.map(([key, enabled]) => (
              <li key={key} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <code className="text-sm">{key}</code>
                  <Badge variant={enabled ? "default" : "secondary"}>
                    {enabled ? "on" : "off"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={enabled} onCheckedChange={() => toggle(key)} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(key)}
                    aria-label={`Remove ${key}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFlag()}
            placeholder="new_feature_name"
            className="font-mono"
          />
          <Button variant="outline" onClick={addFlag}>
            Add
          </Button>
        </div>
        <Button onClick={onSave} disabled={pending}>
          {pending ? "Saving…" : "Save Flags"}
        </Button>
      </CardContent>
    </Card>
  );
}
