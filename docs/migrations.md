# Production schema changes

The initial Alembic baseline is additive. Use one API worker and one API instance for this release; websocket broadcasting is process-local. The relational database is the durable source of room state.

For a schema change:

1. Back up both databases and verify restoration into an isolated environment. Leave the frozen baseline metadata unchanged; create a new Alembic revision with explicit operations.
2. Expand: add nullable columns or new tables and indexes without dropping old fields. On large PostgreSQL tables, use concurrent index creation outside a transaction.
3. Deploy compatible code. If replacing a field, dual-write old and new representations inside the same transaction.
4. Backfill in bounded, retryable batches. Record checkpoints and compare counts and values. Do not backfill on quiz answer requests.
5. Switch reads behind a feature flag after validation. Keep old writes during the observation period.
6. Contract in a later release: remove old writes, then drop obsolete columns only after the rollback window closes.

Snapshot MongoDB question documents into `session_questions` when starting each match. Do not mutate active snapshots when updating the bank. Lesson documents carry versions and unique slugs.

Do not run destructive automatic downgrades. Restore a tested backup or deploy a forward fix. Neither database may acquire birth-input or chat-payload columns.
