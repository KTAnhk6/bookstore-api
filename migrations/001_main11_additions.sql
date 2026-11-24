-- MANUAL ONLY. Select the intended existing database first. Read README_MERGE.md.
-- Run the precheck SELECT first. Execute ONLY ALTER statements for columns ABSENT.
-- MySQL DDL commits implicitly: backup and rehearsal required. Do NOT source blindly.
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN ('orders','reviews','password_reset_tokens')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- Existing orders MUST retain NULL points_used: the service recognizes legacy awards.
-- No order/user points backfill, no balance adjustment, no data import.
-- ALTER TABLE orders ADD COLUMN points_used INT NULL;
-- ALTER TABLE orders ADD COLUMN points_discount DECIMAL(12,2) NULL;
-- ALTER TABLE orders ADD COLUMN points_earned INT NULL;
-- Existing public reviews remain approved; Java creates NEW reviews as PENDING.
-- ALTER TABLE reviews ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'APPROVED';
-- Retained main11 field; current 16-character token flow does not use attempt counters.
-- ALTER TABLE password_reset_tokens ADD COLUMN failed_attempts INT NOT NULL DEFAULT 0;
