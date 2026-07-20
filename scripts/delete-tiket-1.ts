import { config } from 'dotenv';
config({ path: '.env.local' });
import { Pool } from 'pg';

const url = process.env.DRIZZLE_DATABASE_URL;
if (!url) throw new Error('DRIZZLE_DATABASE_URL missing');

const id = 'b742202e-cdd4-4685-9e2b-05a1415c918d';

async function main() {
  const pool = new Pool({ connectionString: url, max: 2 });
  try {
    const tix = await pool.query(`DELETE FROM tickets WHERE event_id = $1`, [id]);
    console.log(`deleted ${tix.rowCount ?? 0} ticket(s)`);
    const ev = await pool.query(`DELETE FROM events WHERE id = $1`, [id]);
    console.log(`deleted ${ev.rowCount ?? 0} event(s)`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});