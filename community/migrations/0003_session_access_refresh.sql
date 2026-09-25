-- Keep Community program-space projections fresh after purchase changes, refunds and cancellations.
ALTER TABLE sessions ADD COLUMN access_checked_at TEXT;
