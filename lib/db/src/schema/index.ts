import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const savesTable = pgTable("saves", {
  userId: integer("user_id")
    .notNull()
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  highScore: integer("high_score").notNull().default(0),
  pearls: integer("pearls").notNull().default(0),
  upgradesJson: text("upgrades_json").notNull().default("{}"),
  currentWave: integer("current_wave").notNull().default(1),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
export type Save = typeof savesTable.$inferSelect;
export type InsertSave = typeof savesTable.$inferInsert;
