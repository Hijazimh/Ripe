import { Pool } from 'pg'

// ── Connection pool ───────────────────────────────────────────────────────────
// Uses DATABASE_URL env var (set in Vercel dashboard).
// SSL required for Supabase.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3, // keep small for serverless
})

async function query<T extends object>(text: string, params?: unknown[]): Promise<T[]> {
  const client = await pool.connect()
  try {
    const result = await client.query<T>(text, params)
    return result.rows
  } finally {
    client.release()
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Device {
  id: string
  device_id: string
  invite_code: string | null
  display_name: string | null
  notes: string | null
  registered_at: string
  last_seen_at: string
  is_allowed: boolean
  is_pro: boolean
}

export interface InviteCode {
  id: string
  code: string
  created_at: string
  is_active: boolean
}

// ── Schema setup ──────────────────────────────────────────────────────────────

export async function createTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS invite_codes (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code        VARCHAR(12) UNIQUE NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_active   BOOLEAN NOT NULL DEFAULT TRUE
    )
  `)
  await query(`
    CREATE TABLE IF NOT EXISTS devices (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      device_id     VARCHAR(64) UNIQUE NOT NULL,
      invite_code   VARCHAR(12),
      display_name  VARCHAR(100),
      notes         TEXT,
      registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_allowed    BOOLEAN NOT NULL DEFAULT TRUE,
      is_pro        BOOLEAN NOT NULL DEFAULT FALSE
    )
  `)
}

/** Safe to run on every deploy — idempotent migrations. */
export async function runMigrations() {
  // Add is_pro column if it doesn't exist (new Pro feature)
  await query(`
    ALTER TABLE devices ADD COLUMN IF NOT EXISTS is_pro BOOLEAN NOT NULL DEFAULT FALSE
  `)
  // Make invite_code nullable (devices now auto-register without a code)
  await query(`
    ALTER TABLE devices ALTER COLUMN invite_code DROP NOT NULL
  `)
  // Drop old FK constraint if it exists (invite_code is now optional)
  await query(`
    ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_invite_code_fkey
  `)
}

// ── Invite codes ──────────────────────────────────────────────────────────────

export async function getAllInviteCodes(): Promise<InviteCode[]> {
  return query<InviteCode>(
    'SELECT id, code, created_at, is_active FROM invite_codes ORDER BY created_at DESC'
  )
}

export async function createInviteCode(code: string): Promise<InviteCode> {
  const rows = await query<InviteCode>(
    'INSERT INTO invite_codes (code) VALUES ($1) RETURNING id, code, created_at, is_active',
    [code]
  )
  return rows[0]
}

export async function deactivateInviteCode(id: string): Promise<void> {
  await query('UPDATE invite_codes SET is_active = FALSE WHERE id = $1', [id])
}

export async function deleteInviteCode(id: string): Promise<void> {
  await query('DELETE FROM invite_codes WHERE id = $1', [id])
}

export async function getInviteCode(code: string): Promise<InviteCode | null> {
  const rows = await query<InviteCode>(
    'SELECT id, code, created_at, is_active FROM invite_codes WHERE code = $1',
    [code]
  )
  return rows[0] ?? null
}

// ── Devices ───────────────────────────────────────────────────────────────────

export async function getAllDevices(): Promise<Device[]> {
  return query<Device>(
    'SELECT id, device_id, invite_code, display_name, notes, registered_at, last_seen_at, is_allowed, is_pro FROM devices ORDER BY registered_at DESC'
  )
}

export async function getDeviceByDeviceId(deviceId: string): Promise<Device | null> {
  const rows = await query<Device>(
    'SELECT id, device_id, invite_code, display_name, notes, registered_at, last_seen_at, is_allowed, is_pro FROM devices WHERE device_id = $1',
    [deviceId]
  )
  return rows[0] ?? null
}

/** Auto-register a device (no invite code required). */
export async function registerDevice(deviceId: string): Promise<Device> {
  const rows = await query<Device>(
    `INSERT INTO devices (device_id)
     VALUES ($1)
     ON CONFLICT (device_id) DO UPDATE SET last_seen_at = NOW()
     RETURNING id, device_id, invite_code, display_name, notes, registered_at, last_seen_at, is_allowed, is_pro`,
    [deviceId]
  )
  return rows[0]
}

/** Activate pro license for a device using a valid invite code as pro key. */
export async function activateProLicense(deviceId: string, proKey: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `UPDATE devices SET is_pro = TRUE, invite_code = $2 WHERE device_id = $1 RETURNING id`,
    [deviceId, proKey]
  )
  return rows.length > 0
}

export async function updateDeviceLastSeen(deviceId: string): Promise<void> {
  await query('UPDATE devices SET last_seen_at = NOW() WHERE device_id = $1', [deviceId])
}

export async function updateDevice(
  id: string,
  patch: { is_allowed?: boolean; display_name?: string | null; notes?: string | null; is_pro?: boolean }
): Promise<Device | null> {
  const rows = await query<Device>(
    `UPDATE devices
     SET
       is_allowed   = COALESCE($2, is_allowed),
       display_name = COALESCE($3, display_name),
       notes        = COALESCE($4, notes),
       is_pro       = COALESCE($5, is_pro)
     WHERE id = $1
     RETURNING id, device_id, invite_code, display_name, notes, registered_at, last_seen_at, is_allowed, is_pro`,
    [id, patch.is_allowed ?? null, patch.display_name ?? null, patch.notes ?? null, patch.is_pro ?? null]
  )
  return rows[0] ?? null
}

export async function deleteDevice(id: string): Promise<void> {
  await query('DELETE FROM devices WHERE id = $1', [id])
}
