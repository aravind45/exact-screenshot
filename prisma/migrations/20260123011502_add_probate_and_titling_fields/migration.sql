-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "ownership_type" TEXT NOT NULL DEFAULT 'INDIVIDUAL';

-- AlterTable
ALTER TABLE "estates" ADD COLUMN     "court_case_number" TEXT,
ADD COLUMN     "probate_county" TEXT,
ADD COLUMN     "probate_status" TEXT NOT NULL DEFAULT 'NOT_STARTED';
