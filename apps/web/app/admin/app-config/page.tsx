import { getAppConfig } from "./actions";
import { AppConfigClient } from "./AppConfigClient";

export default async function AppConfigPage() {
  const result = await getAppConfig();
  const config = result.success ? (result.data as Record<string, unknown>) : {};

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">App Config</h1>
      <AppConfigClient initialConfig={config} />
    </div>
  );
}
