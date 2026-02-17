-- Drop existing (in case of retry)
DROP TABLE IF EXISTS "rag_chunk_embeddings";
DROP TABLE IF EXISTS "rag_chunks";
DROP TABLE IF EXISTS "rag_documents";
DROP TYPE IF EXISTS "DocType";

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('STATUTE', 'POLICY', 'PLAYBOOK', 'FAQ', 'FORM', 'BLOG', 'OTHER');

-- CreateTable
CREATE TABLE "rag_documents" (
    "id" TEXT NOT NULL,
    "sourceUri" TEXT,
    "title" TEXT NOT NULL,
    "docType" "DocType" NOT NULL DEFAULT 'OTHER',
    "jurisdiction" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "version" TEXT,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "securityTags" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "rag_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_chunks" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "heading_path" TEXT,
    "section_id" TEXT,
    "page_start" INTEGER,
    "page_end" INTEGER,
    "text" TEXT NOT NULL,
    "token_count" INTEGER,
    "content_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_chunk_embeddings" (
    "id" TEXT NOT NULL,
    "chunk_id" TEXT NOT NULL,
    "vector_type" TEXT NOT NULL DEFAULT 'content',
    "model_id" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rag_chunk_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rag_documents_jurisdiction_idx" ON "rag_documents"("jurisdiction");

-- CreateIndex
CREATE INDEX "rag_documents_docType_idx" ON "rag_documents"("docType");

-- CreateIndex
CREATE INDEX "rag_documents_effectiveDate_idx" ON "rag_documents"("effectiveDate");

-- CreateIndex
CREATE INDEX "rag_chunks_document_id_idx" ON "rag_chunks"("document_id");

-- CreateIndex
CREATE INDEX "rag_chunks_parent_id_idx" ON "rag_chunks"("parent_id");

-- CreateIndex
CREATE INDEX "rag_chunks_section_id_idx" ON "rag_chunks"("section_id");

-- CreateIndex
CREATE UNIQUE INDEX "rag_chunks_document_id_content_hash_key" ON "rag_chunks"("document_id", "content_hash");

-- CreateIndex
CREATE INDEX "rag_chunk_embeddings_chunk_id_idx" ON "rag_chunk_embeddings"("chunk_id");

-- CreateIndex
CREATE INDEX "rag_chunk_embeddings_vector_type_model_id_idx" ON "rag_chunk_embeddings"("vector_type", "model_id");

-- AddForeignKey
ALTER TABLE "rag_chunks" ADD CONSTRAINT "rag_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "rag_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_chunks" ADD CONSTRAINT "rag_chunks_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "rag_chunks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_chunk_embeddings" ADD CONSTRAINT "rag_chunk_embeddings_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "rag_chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ==========================================
-- CUSTOM SQL FOR HYBRID SEARCH AND INDEXING
-- ==========================================

-- 3.1 Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 3.2 Add tsvector column to RagChunk
ALTER TABLE "rag_chunks"
ADD COLUMN IF NOT EXISTS "tsv" tsvector;

-- Keep updated via trigger
CREATE OR REPLACE FUNCTION rag_chunk_tsv_trigger() RETURNS trigger AS $$
begin
  new.tsv :=
    setweight(to_tsvector('english', coalesce(new."heading_path",'')), 'A') ||
    setweight(to_tsvector('english', coalesce(new."section_id",'')), 'A') ||
    setweight(to_tsvector('english', new."text"), 'B');
  return new;
end
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tsv_update ON "rag_chunks";
CREATE TRIGGER tsv_update
BEFORE INSERT OR UPDATE OF "heading_path","section_id","text"
ON "rag_chunks"
FOR EACH ROW EXECUTE FUNCTION rag_chunk_tsv_trigger();

-- 3.3 Lexical indexes
CREATE INDEX IF NOT EXISTS rag_chunks_tsv_gin ON "rag_chunks" USING GIN ("tsv");
CREATE INDEX IF NOT EXISTS rag_chunks_text_trgm ON "rag_chunks" USING GIN ("text" gin_trgm_ops);

-- 3.4 Vector index
-- HNSW index for cosine (pgvector supports vector_cosine_ops)
CREATE INDEX IF NOT EXISTS rag_chunk_embeddings_hnsw_cos
ON "rag_chunk_embeddings"
USING hnsw ("embedding" vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
