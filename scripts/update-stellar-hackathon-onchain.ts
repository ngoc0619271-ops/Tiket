import { config } from 'dotenv';
config({ path: '.env.local' });
import { Pool } from 'pg';

const url = process.env.DRIZZLE_DATABASE_URL;
if (!url) throw new Error('DRIZZLE_DATABASE_URL missing');

const eventId = 'a92859b1-df9e-46fd-b59d-6dc3800cb4b6';
const onchainEventId = '1';
const createTxHash = '63466df584e64a35174230d88397f75ca554b62bd11351dc73aa3b2eeb4643bb';
const eventDate = new Date('2026-07-30T00:00:00.000Z');

async function main() {
  const pool = new Pool({ connectionString: url, max: 2 });
  try {
    const r = await pool.query(
      `UPDATE events
       SET event_date = $1, onchain_event_id = $2, create_tx_hash = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, event_date, onchain_event_id, create_tx_hash`,
      [eventDate.toISOString(), onchainEventId, createTxHash, eventId],
    );
    console.log('Updated:', r.rows[0]);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});