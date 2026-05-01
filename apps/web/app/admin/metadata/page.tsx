import {
  DEFAULT_MAINTENANCE_MODE,
  DEFAULT_STORE_URLS,
  DEFAULT_SUPPORT_URLS,
  DEFAULT_VERSION_CONFIG,
} from "@repo/api/types/config";
import { getAllMetadata } from "./actions";
import { MetadataTabs } from "./MetadataTabs";

export default async function MetadataPage() {
  const metadata = await getAllMetadata();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">App Metadata</h1>
        <p className="text-sm text-muted-foreground">
          Settings the native app reads from <code>/config/app-metadata</code>.
        </p>
      </div>
      <MetadataTabs
        version={metadata.version_config ?? DEFAULT_VERSION_CONFIG}
        flags={metadata.feature_flags ?? {}}
        maintenance={metadata.maintenance_mode ?? DEFAULT_MAINTENANCE_MODE}
        storeUrls={metadata.store_urls ?? DEFAULT_STORE_URLS}
        supportUrls={metadata.support_urls ?? DEFAULT_SUPPORT_URLS}
      />
    </div>
  );
}
