PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS support_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  base_count INTEGER NOT NULL CHECK (base_count >= 0),
  legacy_counter_last INTEGER NOT NULL CHECK (legacy_counter_last >= 0),
  migrated_at TEXT NOT NULL
);

-- Przed wdrożeniem zastąp oba wystąpienia __MIGRATED_COUNTER_VALUE__
-- aktualną wartością odczytaną z produkcyjnego CounterAPI.
-- Nie uruchamiaj migracji z placeholderem.
INSERT INTO support_state (
  id,
  base_count,
  legacy_counter_last,
  migrated_at
)
VALUES (
  1,
  __MIGRATED_COUNTER_VALUE__,
  __MIGRATED_COUNTER_VALUE__,
  CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_votes (
  request_id TEXT PRIMARY KEY,
  device_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_votes_created_at
ON support_votes(created_at);
