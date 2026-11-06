import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';
export const enquiries = sqliteTable(
  'enquiries',
  {
    seq: integer('seq').primaryKey({ autoIncrement: true }),
    id: text('id').notNull().unique(),
    requestKey: text('request_key').notNull().unique(),
    payloadHash: text('payload_hash').notNull(),
    createdAt: integer('created_at').notNull(),
    expiresAt: integer('expires_at').notNull(),
    dataJson: text('data_json').notNull(),
  },
  (table) => [
    index('enquiries_created').on(table.createdAt),
    index('enquiries_expiry').on(table.expiresAt),
    index('enquiries_fingerprint').on(table.payloadHash, table.createdAt),
  ],
);
export const rateLimits = sqliteTable(
  'enquiry_rate_limits',
  {
    rateKey: text('rate_key').notNull(),
    windowStart: integer('window_start').notNull(),
    attempts: integer('attempts').notNull(),
  },
  (table) => [primaryKey({ columns: [table.rateKey, table.windowStart] })],
);
