-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "role" TEXT,
    "state" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deceased_first_name" TEXT NOT NULL,
    "deceased_last_name" TEXT NOT NULL,
    "deceased_date_of_birth" TIMESTAMP(3),
    "deceased_date_of_death" TIMESTAMP(3) NOT NULL,
    "deceased_state" TEXT NOT NULL,
    "estate_type" TEXT,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "estate_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "account_number" TEXT,
    "value" DOUBLE PRECISION,
    "status" TEXT,
    "priority" TEXT,
    "last_contact_date" TIMESTAMP(3),
    "next_follow_up_date" TIMESTAMP(3),
    "institution_phone" TEXT,
    "institution_email" TEXT,
    "institution_fax" TEXT,
    "contact_person" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_communications" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "communication_date" TIMESTAMP(3) NOT NULL,
    "communication_type" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT,
    "response" TEXT,
    "response_date" TIMESTAMP(3),
    "next_action_date" TIMESTAMP(3),
    "next_action_type" TEXT,
    "contact_person" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_communications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- AddForeignKey
ALTER TABLE "estates" ADD CONSTRAINT "estates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_estate_id_fkey" FOREIGN KEY ("estate_id") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_communications" ADD CONSTRAINT "asset_communications_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_communications" ADD CONSTRAINT "asset_communications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
