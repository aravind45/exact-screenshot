-- Durable workflow primitives: outbox, inbox, workflow, dead-letter

CREATE TABLE IF NOT EXISTS "outbox_events" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "event_type" TEXT NOT NULL,
  "aggregate_type" TEXT,
  "aggregate_id" TEXT,
  "correlation_id" TEXT,
  "dedupe_key" TEXT,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "max_retries" INTEGER NOT NULL DEFAULT 8,
  "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_error" TEXT,
  "processed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "outbox_events_dedupe_key_key"
  ON "outbox_events"("dedupe_key")
  WHERE "dedupe_key" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_outbox_status_next_attempt"
  ON "outbox_events"("status", "next_attempt_at");

CREATE INDEX IF NOT EXISTS "idx_outbox_event_status"
  ON "outbox_events"("event_type", "status");

CREATE INDEX IF NOT EXISTS "idx_outbox_aggregate"
  ON "outbox_events"("aggregate_type", "aggregate_id");

CREATE TABLE IF NOT EXISTS "inbox_events" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "source" TEXT NOT NULL,
  "source_event_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "correlation_id" TEXT,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "max_retries" INTEGER NOT NULL DEFAULT 8,
  "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_error" TEXT,
  "processed_at" TIMESTAMP(3),
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inbox_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "inbox_source_event_unique"
  ON "inbox_events"("source", "source_event_id");

CREATE INDEX IF NOT EXISTS "idx_inbox_status_next_attempt"
  ON "inbox_events"("status", "next_attempt_at");

CREATE INDEX IF NOT EXISTS "idx_inbox_source_status"
  ON "inbox_events"("source", "status");

CREATE TABLE IF NOT EXISTS "workflow_runs" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "workflow_type" TEXT NOT NULL,
  "correlation_id" TEXT,
  "aggregate_type" TEXT,
  "aggregate_id" TEXT,
  "state" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RUNNING',
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" TIMESTAMP(3),
  "last_error" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workflow_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "workflow_type_aggregate_unique"
  ON "workflow_runs"("workflow_type", "aggregate_id")
  WHERE "aggregate_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_workflow_type_status"
  ON "workflow_runs"("workflow_type", "status");

CREATE INDEX IF NOT EXISTS "idx_workflow_aggregate"
  ON "workflow_runs"("aggregate_type", "aggregate_id");

CREATE TABLE IF NOT EXISTS "workflow_steps" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "workflow_run_id" TEXT NOT NULL,
  "step_name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempt" INTEGER NOT NULL DEFAULT 0,
  "started_at" TIMESTAMP(3),
  "ended_at" TIMESTAMP(3),
  "last_error" TEXT,
  "payload" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workflow_steps_workflow_run_id_fkey"
    FOREIGN KEY ("workflow_run_id") REFERENCES "workflow_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "workflow_step_unique"
  ON "workflow_steps"("workflow_run_id", "step_name");

CREATE INDEX IF NOT EXISTS "idx_workflow_step_run_status"
  ON "workflow_steps"("workflow_run_id", "status");

CREATE TABLE IF NOT EXISTS "dead_letter_events" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "source_table" TEXT NOT NULL,
  "source_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "correlation_id" TEXT,
  "workflow_run_id" TEXT,
  "payload" JSONB NOT NULL,
  "reason" TEXT NOT NULL,
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "moved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "replayed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dead_letter_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "dead_letter_source_unique"
  ON "dead_letter_events"("source_table", "source_id");

CREATE INDEX IF NOT EXISTS "idx_dead_letter_status_moved_at"
  ON "dead_letter_events"("status", "moved_at");

CREATE INDEX IF NOT EXISTS "idx_dead_letter_event_type"
  ON "dead_letter_events"("event_type");
