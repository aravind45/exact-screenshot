/*
  Warnings:

  - A unique constraint covering the columns `[estate_id,document_type]` on the table `estate_documents` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "estate_documents_estate_id_document_type_key" ON "estate_documents"("estate_id", "document_type");
