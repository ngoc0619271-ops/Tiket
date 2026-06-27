import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { events } from './events';

export const tickets = pgTable('tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id),
  buyerPublicKey: text('buyer_public_key').notNull(),
  buyerName: text('buyer_name').notNull().default(''),
  assetCode: text('asset_code').notNull(),
  assetIssuer: text('asset_issuer').notNull(),
  // What the holder paid: settlement asset + amount.
  paymentAsset: text('payment_asset').notNull().default('XLM'),
  pricePaid: text('price_paid').notNull().default('0'),
  status: text('status').notNull().default('issued'), // issued (valid) | used | refunded
  // On-chain ticketing contract proofs (the CORE flow).
  onchainTicketId: text('onchain_ticket_id'),
  buyTxHash: text('buy_tx_hash'), // buyer-signed Soroban `buy` (escrow)
  checkinTxHash: text('checkin_tx_hash'), // organizer-signed Soroban `check_in` (settle)
  refundTxHash: text('refund_tx_hash'), // owner-signed Soroban `refund`
  // Retained legacy/secondary proofs (classic clawback-token utilities).
  purchaseTxHash: text('purchase_tx_hash'),
  issueTxHash: text('issue_tx_hash'),
  clawbackTxHash: text('clawback_tx_hash'),
  checkinAt: timestamp('checkin_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
