/* eslint-disable no-console */
// Reset upcoming events + seed Stellar Hackathon.
//   npx tsx scripts/seed-stellar-hackathon.ts
//   # Or with explicit env file:
//   dotenv -e .env.local -- npx tsx scripts/seed-stellar-hackathon.ts
import { config } from 'dotenv';
config({ path: '.env.local' });
import { Pool } from 'pg';

const url = process.env.DRIZZLE_DATABASE_URL;
const issuer = process.env.STELLAR_ISSUER_PUBLIC;
if (!url) throw new Error('DRIZZLE_DATABASE_URL missing');
if (!issuer) throw new Error('STELLAR_ISSUER_PUBLIC missing');

async function main() {
  const pool = new Pool({ connectionString: url, max: 2 });
  try {
    // 1. Delete upcoming events (status=active, event_date > now).
    const upcoming = await pool.query<{ id: string; name: string; event_date: Date }>(
      `SELECT id, name, event_date FROM events
       WHERE status = 'active' AND event_date > NOW() ORDER BY event_date ASC`,
    );
    console.log(`Found ${upcoming.rowCount} upcoming event(s) to delete:`);
    for (const r of upcoming.rows) {
      console.log(`  - ${r.name} (${r.event_date.toISOString()}) id=${r.id}`);
    }
    for (const r of upcoming.rows) {
      // Delete tickets that reference this event first (FK constraint).
      const tix = await pool.query(`DELETE FROM tickets WHERE event_id = $1`, [r.id]);
      console.log(`  - ${r.name}: deleted ${tix.rowCount ?? 0} ticket(s)`);
      await pool.query(`DELETE FROM events WHERE id = $1`, [r.id]);
    }
    console.log(`Deleted ${upcoming.rowCount} upcoming event(s).`);

    // 2. Insert Stellar Hackathon.
    const eventDate = new Date('2026-07-01T00:00:00.000Z');
    const assetCode = 'TKTHACKA';
    const inserted = await pool.query(
      `INSERT INTO events (
         organizer_public_key, name, description, venue, city, event_date,
         price, price_asset, total_capacity, sold_count, used_count,
         asset_code, asset_issuer, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id, name, event_date, venue, total_capacity, price, status`,
      [
        issuer,
        'Stellar Hackathon',
        'Builders in Stellar Ecosystem',
        'APAC',
        '',
        eventDate.toISOString(),
        '0.01',
        'XLM',
        100,
        0,
        0,
        assetCode,
        issuer,
        'active',
      ],
    );
    console.log('Inserted event:', inserted.rows[0]);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});