"use client";

import type { SupportUrls } from "@repo/api/types/config";
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
import { updateSupportUrls } from "../actions";

export function SupportUrlsTab({ initial }: { initial: SupportUrls }) {
  const [state, setState] = useState<SupportUrls>(initial);
  const [pending, start] = useTransition();

  const set = <K extends keyof SupportUrls>(key: K, value: SupportUrls[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  function onSave() {
    start(async () => {
      const result = await updateSupportUrls(state);
      if (result.ok) toast.success("Support URLs saved");
      else toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support &amp; Legal URLs</CardTitle>
        <CardDescription>Surfaced from the native settings screen.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="supportEmail">Support email</Label>
          <Input
            id="supportEmail"
            type="email"
            value={state.supportEmail}
            onChange={(e) => set("supportEmail", e.target.value)}
            placeholder="support@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supportUrl">Support URL</Label>
          <Input
            id="supportUrl"
            value={state.supportUrl}
            onChange={(e) => set("supportUrl", e.target.value)}
            placeholder="https://help.example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="termsUrl">Terms of service URL</Label>
          <Input
            id="termsUrl"
            value={state.termsUrl}
            onChange={(e) => set("termsUrl", e.target.value)}
            placeholder="https://example.com/terms"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="privacyUrl">Privacy policy URL</Label>
          <Input
            id="privacyUrl"
            value={state.privacyUrl}
            onChange={(e) => set("privacyUrl", e.target.value)}
            placeholder="https://example.com/privacy"
          />
        </div>
        <Button onClick={onSave} disabled={pending}>
          {pending ? "Saving…" : "Save Support URLs"}
        </Button>
      </CardContent>
    </Card>
  );
}
