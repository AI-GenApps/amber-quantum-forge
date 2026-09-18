ALTER TABLE "merge_relay_records" ADD COLUMN "owner_subject" text;--> statement-breakpoint
ALTER TABLE "merge_relay_records" ADD COLUMN "challenge_id" text;--> statement-breakpoint
ALTER TABLE "merge_relay_records" ADD COLUMN "result_id" text;--> statement-breakpoint
ALTER TABLE "merge_relay_records" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
CREATE INDEX "merge_relay_records_owner_idx" ON "merge_relay_records" USING btree ("app_id","environment","record_type","owner_subject","updated_at");--> statement-breakpoint
CREATE INDEX "merge_relay_records_challenge_idx" ON "merge_relay_records" USING btree ("app_id","environment","record_type","challenge_id","owner_subject","updated_at");--> statement-breakpoint
CREATE INDEX "merge_relay_records_result_idx" ON "merge_relay_records" USING btree ("app_id","environment","record_type","result_id","owner_subject","updated_at");--> statement-breakpoint
CREATE INDEX "merge_relay_records_idempotency_idx" ON "merge_relay_records" USING btree ("app_id","environment","record_type","idempotency_key","owner_subject");