import { db } from "../src/db";
import { appConfig } from "../src/schema";

const rows = [
  {
    key: "version_config",
    value: { latestVersion: "1.0.0", minVersion: "1.0.0", updateType: "optional" },
  },
  {
    key: "feature_flags",
    value: {},
  },
  {
    key: "maintenance_mode",
    value: { enabled: false, message: "" },
  },
  {
    key: "store_urls",
    value: { ios: "", android: "" },
  },
  {
    key: "support_urls",
    value: { supportEmail: "", supportUrl: "", termsUrl: "", privacyUrl: "" },
  },
];

async function main() {
  await db.insert(appConfig).values(rows).onConflictDoNothing();
  console.log(`Seeded ${rows.length} app_config rows`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
