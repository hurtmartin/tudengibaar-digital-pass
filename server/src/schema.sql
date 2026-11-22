-- Pragmas are set per connection in openDb(); this file only creates tables.

CREATE TABLE IF NOT EXISTS contenders (
  number      INTEGER PRIMARY KEY CHECK (number BETWEEN 1 AND 99),
  description TEXT    NOT NULL CHECK (length(description) BETWEEN 1 AND 67),
  created_at  INTEGER NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS votes (
  voter_id         TEXT    PRIMARY KEY,                      -- uuid from cookie
  contender_number INTEGER NOT NULL REFERENCES contenders(number) ON DELETE RESTRICT,
  ip               TEXT    NOT NULL,                         -- for soft abuse checks only
  updated_at       INTEGER NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS settings (
  id            INTEGER PRIMARY KEY CHECK (id = 1),          -- single row
  contest_state TEXT    NOT NULL DEFAULT 'closed'
                CHECK (contest_state IN ('closed', 'open', 'locked'))
) STRICT;
INSERT OR IGNORE INTO settings (id) VALUES (1);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT    PRIMARY KEY,                            -- 32 random bytes, base64url
  expires_at INTEGER NOT NULL
) STRICT;
