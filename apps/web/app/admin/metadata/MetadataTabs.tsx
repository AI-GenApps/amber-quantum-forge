"use client";

import type {
  FeatureFlags,
  MaintenanceMode,
  StoreUrls,
  SupportUrls,
  VersionConfig,
} from "@repo/api/types/config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { FeatureFlagsTab } from "./components/FeatureFlagsTab";
import { MaintenanceTab } from "./components/MaintenanceTab";
import { StoreUrlsTab } from "./components/StoreUrlsTab";
import { SupportUrlsTab } from "./components/SupportUrlsTab";
import { VersionTab } from "./components/VersionTab";

interface Props {
  version: VersionConfig;
  flags: FeatureFlags;
  maintenance: MaintenanceMode;
  storeUrls: StoreUrls;
  supportUrls: SupportUrls;
}

export function MetadataTabs({ version, flags, maintenance, storeUrls, supportUrls }: Props) {
  return (
    <Tabs defaultValue="version" className="w-full">
      <TabsList>
        <TabsTrigger value="version">Version</TabsTrigger>
        <TabsTrigger value="flags">Feature Flags</TabsTrigger>
        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        <TabsTrigger value="stores">Store URLs</TabsTrigger>
        <TabsTrigger value="support">Support &amp; Legal</TabsTrigger>
      </TabsList>
      <TabsContent value="version" className="mt-6">
        <VersionTab initial={version} />
      </TabsContent>
      <TabsContent value="flags" className="mt-6">
        <FeatureFlagsTab initial={flags} />
      </TabsContent>
      <TabsContent value="maintenance" className="mt-6">
        <MaintenanceTab initial={maintenance} />
      </TabsContent>
      <TabsContent value="stores" className="mt-6">
        <StoreUrlsTab initial={storeUrls} />
      </TabsContent>
      <TabsContent value="support" className="mt-6">
        <SupportUrlsTab initial={supportUrls} />
      </TabsContent>
    </Tabs>
  );
}
