-- AlterTable
ALTER TABLE "estates" ADD COLUMN     "authority_effective_date" TIMESTAMP(3),
ADD COLUMN     "authority_status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "authority_type" TEXT NOT NULL DEFAULT 'UNSET',
ADD COLUMN     "certified_copies" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deceased_ssn" TEXT;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "password_hash" TEXT;

-- CreateTable
CREATE TABLE "communications" (
    "id" TEXT NOT NULL,
    "estate_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "direction" VARCHAR(10) NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "institution_name" VARCHAR(255),
    "contact_name" VARCHAR(255),
    "contact_channel" VARCHAR(255),
    "subject" VARCHAR(500),
    "notes" TEXT NOT NULL,
    "follow_up_due_at" TIMESTAMPTZ(6),
    "follow_up_completed_at" TIMESTAMPTZ(6),
    "follow_up_completed_by" TEXT,
    "status_change" VARCHAR(50),
    "status_change_effective_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "communications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_attachments" (
    "id" TEXT NOT NULL,
    "communication_id" TEXT NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estate_documents" (
    "id" TEXT NOT NULL,
    "estate_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "file_url" TEXT,
    "total_copies" INTEGER NOT NULL DEFAULT 0,
    "copies_used" INTEGER NOT NULL DEFAULT 0,
    "copies_remaining" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "obtained_date" TIMESTAMP(3),
    "expiration_date" TIMESTAMP(3),
    "issuing_authority" TEXT,
    "reference_number" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estate_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_communications_estate_id" ON "communications"("estate_id");

-- CreateIndex
CREATE INDEX "idx_communications_asset_id" ON "communications"("asset_id");

-- CreateIndex
CREATE INDEX "idx_communications_occurred_at" ON "communications"("occurred_at" DESC);

-- CreateIndex
CREATE INDEX "idx_communications_follow_up" ON "communications"("follow_up_due_at");

-- CreateIndex
CREATE INDEX "idx_communications_estate_occurred" ON "communications"("estate_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "idx_communications_asset_occurred" ON "communications"("asset_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "idx_communication_attachments_communication_id" ON "communication_attachments"("communication_id");

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_estate_id_fkey" FOREIGN KEY ("estate_id") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_follow_up_completed_by_fkey" FOREIGN KEY ("follow_up_completed_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_attachments" ADD CONSTRAINT "communication_attachments_communication_id_fkey" FOREIGN KEY ("communication_id") REFERENCES "communications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_attachments" ADD CONSTRAINT "communication_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estate_documents" ADD CONSTRAINT "estate_documents_estate_id_fkey" FOREIGN KEY ("estate_id") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estate_documents" ADD CONSTRAINT "estate_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
