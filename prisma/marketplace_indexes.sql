-- ============================================================
-- Script: prisma/marketplace_indexes.sql
-- Description: Performance indexes for Advisor Marketplace
-- Run AFTER prisma db push / migrate deploy:
--   psql $DATABASE_URL -f prisma/marketplace_indexes.sql
-- NOTE: CREATE INDEX CONCURRENTLY cannot run inside a transaction.
-- ============================================================

-- 1. GIN indexes for array search on advisor_profiles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_advisor_specialties_gin
    ON advisor_profiles USING gin(specialties);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_advisor_states_gin
    ON advisor_profiles USING gin(states_served);

-- 2. Partial indexes for advisor status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_advisor_approved
    ON advisor_profiles(created_at DESC)
    WHERE status = 'APPROVED';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_advisor_pending_review
    ON advisor_profiles(created_at ASC)
    WHERE status = 'PENDING_REVIEW';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_advisor_approved_rating
    ON advisor_profiles(avg_rating DESC NULLS LAST, hourly_rate ASC)
    WHERE status = 'APPROVED';

-- 3. Booking conflict check index (critical hot path)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_conflict_check
    ON bookings(advisor_id, start_time, end_time)
    WHERE status IN ('REQUESTED', 'CONFIRMED');

-- 4. Admin audit log indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_admin_created
    ON admin_action_logs(admin_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_target
    ON admin_action_logs(target_type, target_id, created_at DESC);

-- 5. Availability lookup indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_avail_rule_advisor_dow
    ON availability_rules(advisor_id, day_of_week)
    WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_avail_exception_advisor_date_b
    ON availability_exceptions(advisor_id, date);

-- 6. License document expiry index (nightly cron)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_license_expiry_active
    ON advisor_license_documents(expiration_date ASC)
    WHERE status = 'VERIFIED' AND expiration_date IS NOT NULL;

-- 7. Dispute indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dispute_status_created
    ON disputes(status, created_at DESC)
    WHERE status IN ('OPEN', 'UNDER_REVIEW');

-- 8. Payment lookup (webhook handler)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_intent_id
    ON marketplace_payments(stripe_payment_intent_id);

-- 9. Booking by user (my-bookings query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_user_status
    ON bookings(user_id, status, start_time DESC);

-- 10. Verify
DO $$
DECLARE idx_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO idx_count FROM pg_indexes
    WHERE schemaname = 'public' AND indexname IN (
        'idx_advisor_specialties_gin', 'idx_advisor_states_gin',
        'idx_advisor_approved', 'idx_advisor_pending_review',
        'idx_advisor_approved_rating', 'idx_booking_conflict_check',
        'idx_audit_log_admin_created', 'idx_audit_log_target',
        'idx_avail_rule_advisor_dow', 'idx_avail_exception_advisor_date_b',
        'idx_license_expiry_active', 'idx_dispute_status_created',
        'idx_payment_intent_id', 'idx_booking_user_status'
    );
    RAISE NOTICE 'Marketplace indexes verified: % of 14', idx_count;
END $$;
