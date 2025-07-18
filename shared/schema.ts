import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const fixtures = pgTable("fixtures", {
  id: serial("id").primaryKey(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  matchDate: timestamp("match_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed
  jackpotId: text("jackpot_id").notNull(),
});

export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  fixtureId: integer("fixture_id").references(() => fixtures.id).notNull(),
  prediction: text("prediction").notNull(), // "1", "X", "2"
  confidence: integer("confidence").notNull(), // 0-100
  reasoning: text("reasoning"),
  strategy: text("strategy").notNull().default("balanced"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jackpots = pgTable("jackpots", {
  id: serial("id").primaryKey(),
  amount: text("amount").notNull(),
  drawDate: timestamp("draw_date").notNull(),
  status: text("status").notNull().default("active"), // active, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFixtureSchema = createInsertSchema(fixtures).omit({
  id: true,
});

export const insertPredictionSchema = createInsertSchema(predictions).omit({
  id: true,
  createdAt: true,
});

export const insertJackpotSchema = createInsertSchema(jackpots).omit({
  id: true,
  createdAt: true,
});

export type InsertFixture = z.infer<typeof insertFixtureSchema>;
export type Fixture = typeof fixtures.$inferSelect;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictions.$inferSelect;
export type InsertJackpot = z.infer<typeof insertJackpotSchema>;
export type Jackpot = typeof jackpots.$inferSelect;

export interface FixtureWithPrediction extends Fixture {
  prediction?: Prediction;
}

export interface PredictionSummary {
  homeWins: number;
  draws: number;
  awayWins: number;
  totalMatches: number;
}
