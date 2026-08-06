import { notInArray, sql } from 'drizzle-orm';
import { DEMO_KEYS } from '@/server/config/env';
import { db } from '@/server/db/client';
import { events, sessions, tickets } from '@/server/db/schema';

export type Stats = {
  uniqueWallets: number;
  logins: number;
  events: number;
  ticketsIssued: number;
  checkIns: number;
  settlements: number;
};

export const statsService = {
  async getStats(): Promise<Stats> {
    const sessionWhere =
      DEMO_KEYS.length > 0 ? notInArray(sessions.publicKey, DEMO_KEYS) : undefined;

    const [walletRow] = await db
      .select({ c: sql<number>`count(distinct ${sessions.publicKey})` })
      .from(sessions)
      .where(sessionWhere);

    const [loginRow] = await db
      .select({ c: sql<number>`count(*)` })
      .from(sessions)
      .where(sessionWhere);

    const [eventRow] = await db.select({ c: sql<number>`count(*)` }).from(events);

    const ticketWhere =
      DEMO_KEYS.length > 0 ? notInArray(tickets.buyerPublicKey, DEMO_KEYS) : undefined;

    const [ticketRow] = await db
      .select({ c: sql<number>`count(*)` })
      .from(tickets)
      .where(ticketWhere);

    const [checkinRow] = await db
      .select({ c: sql<number>`count(*) filter (where ${tickets.status} = 'used')` })
      .from(tickets)
      .where(ticketWhere);

    // On-chain settlements = tickets whose escrow was released by a real Soroban
    // `check_in` invoke (the contract tx hash is recorded).
    const [settlementRow] = await db
      .select({ c: sql<number>`count(${tickets.checkinTxHash})` })
      .from(tickets)
      .where(ticketWhere);

    return {
      uniqueWallets: Number(walletRow?.c ?? 0),
      logins: Number(loginRow?.c ?? 0),
      events: Number(eventRow?.c ?? 0),
      ticketsIssued: Number(ticketRow?.c ?? 0),
      checkIns: Number(checkinRow?.c ?? 0),
      settlements: Number(settlementRow?.c ?? 0),
    };
  },
};
