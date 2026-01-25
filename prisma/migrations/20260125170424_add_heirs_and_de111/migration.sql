-- AlterTable
ALTER TABLE "estates" ADD COLUMN     "bond_amount" DECIMAL(12,2),
ADD COLUMN     "bond_waived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "codicil_dates" TEXT[],
ADD COLUMN     "est_annual_income" DECIMAL(12,2),
ADD COLUMN     "est_personal_property" DECIMAL(12,2),
ADD COLUMN     "est_real_property" DECIMAL(12,2),
ADD COLUMN     "has_will" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "petitioner_is_attorney" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "petitioner_phone" TEXT,
ADD COLUMN     "will_date" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "heirs" (
    "id" TEXT NOT NULL,
    "estate_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "is_adult" BOOLEAN NOT NULL DEFAULT true,
    "address" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "heirs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "heirs" ADD CONSTRAINT "heirs_estate_id_fkey" FOREIGN KEY ("estate_id") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
