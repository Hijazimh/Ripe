import { sql } from '@vercel/postgres'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Device {
  id: string
  device_id: string
  invite_code: string
  display_name: string | null
  notes: string | null
  registered_at: string
  last_seen_at: string
  is_allowed: boolean
}

export interface InviteCode {
  id: string
  code: string
  created_at: string
  is_active: boolean
}

// ─── Schema setup (called once via /api/setup) ────────────────────────────────

export async function createTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS invite_codes (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code        VARCHAR(12) UNIQUE NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_active   BOOLEAN NOT NULL DEFAULT TRUE
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS devices (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      device_id     VARCHAR(64) UNIQUE NOT NULL,
      invite_code   VARCHAR(12) NOT NULL REFERENCES invite_codes(code) ON DELETE RESTRICT,
      display_name  VARCHAR(100),
      notes         TEXT,
      registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_allowed    BOOLEAN NOT NULL DEFAULT TRUE
    )
  `
}

// ─── Invite codes ─────────────────────────────────────────────────────────────

export async function getAllInviteCodes(): Promise<InviteCode[]> {
  const { rows } = await sql<InviteCode>`
    SELECT id, code, created_at, is_active
    FROM invite_codes
    ORDER BY created_at DESC
  `
  return rows
}

export async function createInviteCode(code: string): Promise<InviteCode> {
  const { rows } = await sql<InviteCode>`
    INSERT INTO invite_codes (code)
    VALUES (${code})
    RETURNING id, code, created_at, is_active
  `
  return rows[0]
}

export async function deactivateInviteCode(id: string): Promise<void> {
  await sql`UPDATE invite_codes SET is_active = FALSE WHERE id = ${id}`
}

export async function deleteInviteCode(id: string): Promise<void> {
  await sql`DELETE FROM invite_codes WHERE id = ${id}`
}

export async function getInviteCode(code: string): Promise<InviteCode | null> {
  const { rows } = await sql<InviteCode>`
    SELECT id, code, created_at, is_active
    FROM invite_codes
    WHERE code = ${code}
  `
  return rows[0] ?? null
}

// ─── Devices ──────────────────────────────────────────────────────────────────

export async function getAllDevices(): Promise<Device[]> {
  const { rows } = await sql<Device>`
    SELECT id, device_id, invite_code, display_name, notes, registered_at, last_seen_at, is_allowed
    FROM devices
    ORDER BY registered_at DESC
  `
  return rows
}

export async function getDeviceByDeviceId(deviceId: string): Promise<Device | null> {
  const { rows } = await sql<Device>`
    SELECT id, device_id, invite_code, display_name, notes, registered_at, last_seen_at, is_allowed
    FROM devices
    WHERE device_id = ${deviceId}
  `
  return rows[0] ?? null
}

export async function registerDevice(deviceId: string, inviteCode: string): Promise<Device> {
  const { rows } = await sql<Device>`
    INSERT INTO devices (device_id, invite_code)
    VALUES (${deviceId}, ${inviteCode})
    ON CONFLICT (device_id) DO UPDATE SET last_seen_at = NOW()
    RETURNING id, device_id, invite_code, display_name, notes, registered_at, last_seen_at, is_allowed
  `
  return rows[0]
}

export async function updateDeviceLastSeen(deviceId: string): Promise<void> {
  await sql`UPDATE devices SET last_seen_at = NOW() WHERE device_id = ${deviceId}`
}

export async function updateDevice(
  id: string,
  patch: { is_allowed?: boolean; display_name?: string; notes?: string }
): Promise<Device | null> {
  // Build dynamic update — only set fields that were provided
  const { rows } = await sql<Device>`
    UPDATE devices
    SET
      is_allowed   = COALESCE(${patch.is_allowed ?? null}, is_allowed),
      display_name = COALESCE(${patch.display_name ?? null}, display_name),
      notes        = COALESCE(${patch.notes ?? null}, notes)
    WHERE id = ${id}
    RETURNING id, device_id, invite_code, display_name, notes, registered_at, last_seen_at, is_allowed
  `
  return rows[0] ?? null
}

export async function deleteDevice(id: string): Promise<void> {
  await sql`DELETE FROM devices WHERE id = ${id}`
}
