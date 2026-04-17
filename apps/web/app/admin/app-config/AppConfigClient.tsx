"use client";

import { useState } from "react";
import { updateAppConfig, deleteAppConfigKey } from "./actions";
import { useRouter } from "next/navigation";

interface VersionConfig {
  latestVersion: string;
  minVersion: string;
  updateType: "mandatory" | "optional";
}

interface AppConfigClientProps {
  initialConfig: Record<string, unknown>;
}

const DEFAULT_VERSION_CONFIG: VersionConfig = {
  latestVersion: "1.0.0",
  minVersion: "1.0.0",
  updateType: "optional",
};

export function AppConfigClient({ initialConfig }: AppConfigClientProps) {
  const router = useRouter();

  // Version config
  const versionConfig = (initialConfig.version_config as VersionConfig) || DEFAULT_VERSION_CONFIG;
  const [latestVersion, setLatestVersion] = useState(versionConfig.latestVersion);
  const [minVersion, setMinVersion] = useState(versionConfig.minVersion);
  const [updateType, setUpdateType] = useState<"mandatory" | "optional">(versionConfig.updateType);

  // Feature flags
  const featureFlags = (initialConfig.feature_flags as Record<string, boolean>) || {};
  const [flags, setFlags] = useState<Record<string, boolean>>(featureFlags);
  const [newFlagKey, setNewFlagKey] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const saveVersionConfig = async () => {
    setSaving(true);
    const result = await updateAppConfig("version_config", {
      latestVersion,
      minVersion,
      updateType,
    });
    setSaving(false);
    if (result.success) {
      showMessage("success", "Version config saved");
      router.refresh();
    } else {
      showMessage("error", result.error || "Failed to save");
    }
  };

  const saveFeatureFlags = async () => {
    setSaving(true);
    const result = await updateAppConfig("feature_flags", flags);
    setSaving(false);
    if (result.success) {
      showMessage("success", "Feature flags saved");
      router.refresh();
    } else {
      showMessage("error", result.error || "Failed to save");
    }
  };

  const toggleFlag = (key: string) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addFlag = () => {
    const key = newFlagKey.trim().toLowerCase().replace(/\s+/g, "_");
    if (!key || flags[key] !== undefined) return;
    setFlags((prev) => ({ ...prev, [key]: false }));
    setNewFlagKey("");
  };

  const removeFlag = (key: string) => {
    setFlags((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {message && (
        <div
          className={`p-3 rounded text-sm ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Version Config */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Version Config</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Latest Version</label>
            <input
              type="text"
              value={latestVersion}
              onChange={(e) => setLatestVersion(e.target.value)}
              placeholder="1.2.0"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Minimum Version</label>
            <input
              type="text"
              value={minVersion}
              onChange={(e) => setMinVersion(e.target.value)}
              placeholder="1.0.0"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Update Type</label>
          <select
            value={updateType}
            onChange={(e) => setUpdateType(e.target.value as "mandatory" | "optional")}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="optional">Optional</option>
            <option value="mandatory">Mandatory</option>
          </select>
        </div>
        <p className="text-xs text-gray-500">
          Users running a version below <strong>minVersion</strong> will be forced to update when
          updateType is &quot;mandatory&quot;. Users below <strong>latestVersion</strong> but above
          minVersion will see an optional update prompt.
        </p>
        <button
          onClick={saveVersionConfig}
          disabled={saving}
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Version Config"}
        </button>
      </div>

      {/* Feature Flags */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Feature Flags</h2>
        {Object.keys(flags).length === 0 && (
          <p className="text-sm text-gray-500">No feature flags configured yet.</p>
        )}
        <div className="space-y-2">
          {Object.entries(flags).map(([key, enabled]) => (
            <div key={key} className="flex items-center justify-between border rounded px-3 py-2">
              <span className="text-sm font-mono">{key}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleFlag(key)}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    enabled
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {enabled ? "ON" : "OFF"}
                </button>
                <button
                  onClick={() => removeFlag(key)}
                  className="text-red-500 text-xs hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newFlagKey}
            onChange={(e) => setNewFlagKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFlag()}
            placeholder="new_feature_name"
            className="flex-1 border rounded px-3 py-2 text-sm font-mono"
          />
          <button
            onClick={addFlag}
            className="border rounded px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Add Flag
          </button>
        </div>
        <button
          onClick={saveFeatureFlags}
          disabled={saving}
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Feature Flags"}
        </button>
      </div>
    </div>
  );
}
