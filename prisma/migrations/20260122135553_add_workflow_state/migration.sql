-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "institution_address" TEXT,
ADD COLUMN     "institution_url" TEXT,
ADD COLUMN     "workflow_state" JSONB;

-- CreateTable
CREATE TABLE "institutions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "fax" TEXT,
    "website" TEXT,
    "address" TEXT,
    "logo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "institutions_name_key" ON "institutions"("name");
