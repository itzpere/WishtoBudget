import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const wishlists = sqliteTable('wishlists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  budgetLimit: real('budget_limit').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const items = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  wishlistId: integer('wishlist_id').notNull().references(() => wishlists.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull().default(0),
  status: text('status', { enum: ['pending', 'purchased'] }).notNull().default('pending'),
  priority: integer('priority').notNull().default(0),
  link: text('link'),
  imageUrl: text('image_url'),
  localIconPath: text('local_icon_path'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const history = sqliteTable('history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  type: text('type', { enum: ['budget_change', 'item_add', 'item_update', 'item_delete', 'purchase'] }).notNull(),
  amount: real('amount'),
  description: text('description').notNull(),
});

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export type Wishlist = typeof wishlists.$inferSelect;
export type NewWishlist = typeof wishlists.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type History = typeof history.$inferSelect;
export type NewHistory = typeof history.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
