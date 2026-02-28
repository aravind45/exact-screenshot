-- AlterTable: Add Authority Type Change Policy fields
ALTER TABLE "estates" ADD COLUMN "authority_type_source" TEXT;
ALTER TABLE "estates" ADD COLUMN "authority_pinned_at" TIMESTAMPTZ(6);
ALTER TABLE "estates" ADD COLUMN "authority_change_pending" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "estates" ADD COLUMN "recommended_authority_type" TEXT;
ALTER TABLE "estates" ADD COLUMN "recommended_authority_reason" JSONB;

-- CreateTable: Authority Change Event for audit trail
CREATE TABLE "authority_change_events" (
    "id" TEXT NOT NULL,
    "estate_id" TEXT NOT NULL,
    "previous_type" TEXT,
    "new_type" TEXT NOT NULL,
    "change_source" TEXT NOT NULL,
    "triggered_by" TEXT,
    "computed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_at" TIMESTAMPTZ(6),
    "diff_summary" JSONB,
    "migration_notes" TEXT,
    "reverted_at" TIMESTAMPTZ(6),
    "revert_reason" TEXT,

    CONSTRAINT "authority_change_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "authority_change_events_estate_id_idx" ON "authority_change_events"("estate_id");

-- CreateIndex
CREATE INDEX "authority_change_events_estate_id_computed_at_idx" ON "authority_change_events"("estate_id", "computed_at");

-- AddForeignKey
ALTER TABLE "authority_change_events" ADD CONSTRAINT "authority_change_events_estate_id_fkey" FOREIGN KEY ("estate_id") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
