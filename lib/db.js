import { neon } from '@neondatabase/serverless';

// SQL Injection Prevention: We use the `sql` tagged template literal from the
// Neon driver. The driver automatically parameterizes interpolated values,
// making injection attacks impossible — no raw string concatenation is used.
function getClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }
  return neon(process.env.DATABASE_URL);
}

// Provisions both tables on first call. Safe to call on every request —
// postgres `CREATE TABLE IF NOT EXISTS` is idempotent.
export async function initDb() {
  const sql = getClient();

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      username    TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      failed_login_attempts INTEGER DEFAULT 0,
      locked_until TIMESTAMPTZ DEFAULT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // ON DELETE CASCADE: removing a user automatically removes their audit logs
  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
      action     TEXT NOT NULL,
      ip_address TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function getUserByUsername(username) {
  const sql = getClient();
  await initDb();
  const rows = await sql`SELECT * FROM users WHERE username = ${username} LIMIT 1`;
  return rows[0] ?? null;
}

export async function createUser(username, passwordHash) {
  const sql = getClient();
  await initDb();
  const rows = await sql`
    INSERT INTO users (username, password_hash)
    VALUES (${username}, ${passwordHash})
    RETURNING id, username
  `;
  return rows[0];
}

export async function logAudit(userId, action, ipAddress = 'unknown') {
  const sql = getClient();
  await sql`
    INSERT INTO audit_logs (user_id, action, ip_address)
    VALUES (${userId}, ${action}, ${ipAddress})
  `;
}

export async function updateUserLockout(userId, failedAttempts, lockedUntil = null) {
  const sql = getClient();
  await sql`
    UPDATE users
    SET failed_login_attempts = ${failedAttempts},
        locked_until = ${lockedUntil}
    WHERE id = ${userId}
  `;
}

export async function resetUserLockout(userId) {
  const sql = getClient();
  await sql`
    UPDATE users
    SET failed_login_attempts = 0,
        locked_until = NULL
    WHERE id = ${userId}
  `;
}

export async function getUserAuditLogs(userId) {
  const sql = getClient();
  return sql`
    SELECT action, ip_address, created_at
    FROM audit_logs
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 50
  `;
}

export async function changeUserPassword(userId, newPasswordHash) {
  const sql = getClient();
  await sql`
    UPDATE users SET password_hash = ${newPasswordHash} WHERE id = ${userId}
  `;
}

// Deletes the user AND their audit logs (via ON DELETE CASCADE)
export async function deleteUser(userId) {
  const sql = getClient();
  await sql`DELETE FROM users WHERE id = ${userId}`;
}

// Admin lookup — returns safe fields only. The password_hash is truncated
// to its first 12 chars + "…" so it can be identified without being usable.
export async function lookupUserForAdmin(username) {
  const sql = getClient();
  await initDb();
  const rows = await sql`
    SELECT
      id,
      username,
      LEFT(password_hash, 12) || '…' AS hash_preview,
      LENGTH(password_hash)           AS hash_length,
      failed_login_attempts,
      locked_until,
      created_at
    FROM users
    WHERE username = ${username}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

// Admin list all users — same safe projection, ordered by creation date
export async function listAllUsers() {
  const sql = getClient();
  await initDb();
  return sql`
    SELECT
      id,
      username,
      LEFT(password_hash, 12) || '…' AS hash_preview,
      LENGTH(password_hash)           AS hash_length,
      failed_login_attempts,
      locked_until,
      created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT 100
  `;
}

// Maps database or network connection errors to a user-friendly API response
export function handleApiError(error) {
  console.error('API/DB Error:', error);
  const msg = error.message || '';
  const code = error.code || '';
  
  if (msg.includes('DATABASE_URL') || msg.includes('fetch failed') || code.includes('TIMEOUT')) {
    return { 
      error: 'Cannot reach the database. If you are testing this locally, please configure DATABASE_URL in .env.local and check your firewall/network proxy.', 
      status: 503 
    };
  }
  
  return { error: 'Internal server error', status: 500 };
}
