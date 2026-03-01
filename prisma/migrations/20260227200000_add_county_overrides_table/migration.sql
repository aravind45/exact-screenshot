CREATE TABLE IF NOT EXISTS "county_overrides" (
    "id" TEXT NOT NULL,
    "state_code" TEXT NOT NULL,
    "county_name" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "fee_amount" DECIMAL(12,2),
    "primary_action_url" TEXT,
    "form_names" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attachments" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    CONSTRAINT "county_overrides_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "county_overrides_state_county_idx" ON "county_overrides"("state_code", "county_name");
