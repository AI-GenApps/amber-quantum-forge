"use client";

import type { StoreUrls } from "@repo/api/types/config";
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
import { updateStoreUrls } from "../actions";

export function StoreUrlsTab({ initial }: { initial: StoreUrls }) {
  const [state, setState] = useState<StoreUrls>(initial);
  const [pending, start] = useTransition();

  function onSave() {
    start(async () => {
      const result = await updateStoreUrls(state);
      if (result.ok) toast.success("Store URLs saved");
      else toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Store URLs</CardTitle>
        <CardDescription>
          Used by the update prompt when sending users to the stores.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ios">iOS App Store URL</Label>
          <Input
            id="ios"
            value={state.ios}
            onChange={(e) => setState((prev) => ({ ...prev, ios: e.target.value }))}
            placeholder="https://apps.apple.com/app/id..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="android">Android Play Store URL</Label>
          <Input
            id="android"
            value={state.android}
            onChange={(e) => setState((prev) => ({ ...prev, android: e.target.value }))}
            placeholder="https://play.google.com/store/apps/details?id=..."
          />
        </div>
        <Button onClick={onSave} disabled={pending}>
          {pending ? "Saving…" : "Save Store URLs"}
        </Button>
      </CardContent>
    </Card>
  );
}
