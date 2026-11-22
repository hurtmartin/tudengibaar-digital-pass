// The only file that talks to SQLite. Every query is a prepared statement; never build SQL from strings.
import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import { CONTEST_STATE } from './contestState.js'

const SCHEMA = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')

// A rule broken in the DB, with an API error code the routes can return as-is
export class DbError extends Error {
  constructor(code) {
    super(code)
    this.code = code
  }
}

const isConstraint = (err, kind) => err?.code === `SQLITE_CONSTRAINT_${kind}`

export function openDb(path) {
  const db = new Database(path)
  // Per connection, not in schema.sql: SQLite forgets these on every new connection
  db.pragma('foreign_keys = ON')
  db.pragma('journal_mode = WAL')
  // Several Passenger processes may share the file; wait for a lock instead of failing
  db.pragma('busy_timeout = 5000')
  db.exec(SCHEMA)

  const stmt = {
    sqliteVersion: db.prepare('SELECT sqlite_version() AS v'),
    getState: db.prepare('SELECT contest_state AS state FROM settings WHERE id = 1'),
    setState: db.prepare('UPDATE settings SET contest_state = ? WHERE id = 1 AND contest_state = ?'),
    listContenders: db.prepare('SELECT number, description FROM contenders ORDER BY number'),
    addContender: db.prepare('INSERT INTO contenders (number, description, created_at) VALUES (?, ?, ?)'),
    deleteContender: db.prepare('DELETE FROM contenders WHERE number = ?'),
    upsertVote: db.prepare(`
      INSERT INTO votes (voter_id, contender_number, ip, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT (voter_id) DO UPDATE SET
        contender_number = excluded.contender_number, ip = excluded.ip, updated_at = excluded.updated_at`),
    deleteVote: db.prepare('DELETE FROM votes WHERE voter_id = ?'),
    getVote: db.prepare('SELECT contender_number AS number FROM votes WHERE voter_id = ?'),
    voteLog: db.prepare('SELECT ip, contender_number AS number, updated_at AS at FROM votes ORDER BY ip, updated_at'),
    deleteBurst: db.prepare('DELETE FROM votes WHERE ip = ? AND contender_number = ? AND updated_at BETWEEN ? AND ?'),
    results: db.prepare(`
      SELECT c.number, c.description, COUNT(v.voter_id) AS votes
      FROM contenders c LEFT JOIN votes v ON v.contender_number = c.number
      GROUP BY c.number
      ORDER BY votes DESC, c.number ASC`),
    createSession: db.prepare('INSERT INTO sessions (token, expires_at) VALUES (?, ?)'),
    deleteExpiredSessions: db.prepare('DELETE FROM sessions WHERE expires_at <= ?'),
    getSession: db.prepare('SELECT 1 FROM sessions WHERE token = ? AND expires_at > ?'),
    deleteSession: db.prepare('DELETE FROM sessions WHERE token = ?'),
  }

  const getContestState = () => stmt.getState.get().state

  // State check and write in one synchronous transaction, so a vote can't slip in after a lock
  const castVote = db.transaction((voterId, number, ip, now) => {
    if (getContestState() !== CONTEST_STATE.OPEN) throw new DbError('voting_not_open')
    try {
      stmt.upsertVote.run(voterId, number, ip, now)
    } catch (err) {
      if (isConstraint(err, 'FOREIGNKEY')) throw new DbError('unknown_contender')
      throw err
    }
  })

  const clearVote = db.transaction((voterId) => {
    if (getContestState() !== CONTEST_STATE.OPEN) throw new DbError('voting_not_open')
    stmt.deleteVote.run(voterId)
  })

  return {
    raw: db,
    close: () => db.close(),
    sqliteVersion: () => stmt.sqliteVersion.get().v,

    getContestState,
    // Compare-and-set: only moves if the state is still `from`
    setContestState: (from, to) => stmt.setState.run(to, from).changes === 1,

    listContenders: () => stmt.listContenders.all(),
    addContender(number, description, now = Date.now()) {
      try {
        stmt.addContender.run(number, description, now)
      } catch (err) {
        if (isConstraint(err, 'PRIMARYKEY')) throw new DbError('duplicate_number')
        if (isConstraint(err, 'CHECK')) throw new DbError('invalid_contender')
        throw err
      }
    },
    deleteContender(number) {
      try {
        if (stmt.deleteContender.run(number).changes === 0) throw new DbError('not_found')
      } catch (err) {
        // ON DELETE RESTRICT reports as _TRIGGER (not _FOREIGNKEY) in SQLite
        if (isConstraint(err, 'TRIGGER') || isConstraint(err, 'FOREIGNKEY')) throw new DbError('has_votes')
        throw err
      }
    },

    castVote: (voterId, number, ip, now = Date.now()) => castVote(voterId, number, ip, now),
    clearVote: (voterId) => clearVote(voterId),
    getVote: (voterId) => stmt.getVote.get(voterId)?.number ?? null,
    results: () => stmt.results.all(),
    // For spotting scripted bursts (see bursts.js); allowed in any contest state, cleanup usually happens after the lock
    voteLog: () => stmt.voteLog.all(),
    deleteBurst: (ip, number, from, to) => stmt.deleteBurst.run(ip, number, from, to).changes,

    createSession: (token, expiresAt) => stmt.createSession.run(token, expiresAt),
    // Expired rows are cleaned up lazily, on the next check
    isSessionValid(token, now = Date.now()) {
      stmt.deleteExpiredSessions.run(now)
      return Boolean(stmt.getSession.get(token, now))
    },
    deleteSession: (token) => stmt.deleteSession.run(token),
  }
}
