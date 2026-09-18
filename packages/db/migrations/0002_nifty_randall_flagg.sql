ALTER TABLE "merge_relay_records" ADD COLUMN "alias" text;--> statement-breakpoint
ALTER TABLE "merge_relay_records" ADD COLUMN "target_subject" text;--> statement-breakpoint
ALTER TABLE "merge_relay_records" ADD COLUMN "lookup_key" text;--> statement-breakpoint
CREATE INDEX "merge_relay_records_alias_idx" ON "merge_relay_records" USING btree ("app_id","environment","record_type","alias");--> statement-breakpoint
CREATE INDEX "merge_relay_records_target_idx" ON "merge_relay_records" USING btree ("app_id","environment","record_type","owner_subject","target_subject");--> statement-breakpoint
CREATE INDEX "merge_relay_records_lookup_idx" ON "merge_relay_records" USING btree ("app_id","environment","record_type","lookup_key");