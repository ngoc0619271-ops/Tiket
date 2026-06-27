import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizerPublicKey: text('organizer_public_key').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  venue: text('venue').notNull(),
  city: text('city').notNull().default(''),
  eventDate: timestamp('event_date', { withTimezone: true }).notNull(),
  // Ticket price as a decimal string (Stellar amount). '0' = free entry.
  price: text('price').notNull().default('0'),
  // Settlement asset for the price: 'XLM' (native, default) or 'USDC'.
  priceAsset: text('price_asset').notNull().default('XLM'),
  totalCapacity: integer('total_capacity').notNull(),
  soldCount: integer('sold_count').notNull().default(0),
  usedCount: integer('used_count').notNull().default(0),
  // The clawback-enabled Stellar ticket token issued for this event (retained
  // secondary asset identity).
  assetCode: text('asset_code').notNull(),
  assetIssuer: text('asset_issuer').notNull(),
  // On-chain ticketing contract: the event id recorded by create_event, and the
  // organizer-signed Soroban tx that created it.
  onchainEventId: text('onchain_event_id'),
  createTxHash: text('create_tx_hash'),
  status: text('status').notNull().default('active'), // active | cancelled | completed
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
