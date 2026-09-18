ALTER TABLE "merge_relay_records" ADD COLUMN "revision" integer;--> statement-breakpoint
UPDATE "merge_relay_records"
SET "revision" = CASE
  WHEN "payload"->>'revision' ~ '^[0-9]+$' THEN ("payload"->>'revision')::integer
  ELSE NULL
END
WHERE "record_type" = 'config';--> statement-breakpoint
CREATE INDEX "merge_relay_records_config_revision_idx" ON "merge_relay_records" USING btree ("app_id","environment","record_type","revision");
