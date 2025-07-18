import { fixtures, predictions, jackpots, type Fixture, type InsertFixture, type Prediction, type InsertPrediction, type Jackpot, type InsertJackpot, type FixtureWithPrediction } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Fixtures
  createFixture(fixture: InsertFixture): Promise<Fixture>;
  getFixturesByJackpotId(jackpotId: string): Promise<Fixture[]>;
  getFixturesWithPredictions(jackpotId: string): Promise<FixtureWithPrediction[]>;
  
  // Predictions
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  getPredictionsByFixtureId(fixtureId: number): Promise<Prediction[]>;
  deletePredictionsByJackpotId(jackpotId: string): Promise<void>;
  
  // Jackpots
  createJackpot(jackpot: InsertJackpot): Promise<Jackpot>;
  getCurrentJackpot(): Promise<Jackpot | undefined>;
  updateJackpot(id: number, updates: Partial<Jackpot>): Promise<Jackpot>;
}

export class MemStorage implements IStorage {
  private fixtures: Map<number, Fixture>;
  private predictions: Map<number, Prediction>;
  private jackpots: Map<number, Jackpot>;
  private currentFixtureId: number;
  private currentPredictionId: number;
  private currentJackpotId: number;

  constructor() {
    this.fixtures = new Map();
    this.predictions = new Map();
    this.jackpots = new Map();
    this.currentFixtureId = 1;
    this.currentPredictionId = 1;
    this.currentJackpotId = 1;
    
    // Initialize with default jackpot
    this.createJackpot({
      amount: "KSH 15M",
      drawDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      status: "active"
    });
  }

  async createFixture(insertFixture: InsertFixture): Promise<Fixture> {
    const id = this.currentFixtureId++;
    const fixture: Fixture = {
      ...insertFixture,
      id,
      status: "pending"
    };
    this.fixtures.set(id, fixture);
    return fixture;
  }

  async getFixturesByJackpotId(jackpotId: string): Promise<Fixture[]> {
    return Array.from(this.fixtures.values()).filter(
      fixture => fixture.jackpotId === jackpotId
    );
  }

  async getFixturesWithPredictions(jackpotId: string): Promise<FixtureWithPrediction[]> {
    const fixtures = await this.getFixturesByJackpotId(jackpotId);
    return fixtures.map(fixture => {
      const prediction = Array.from(this.predictions.values()).find(
        p => p.fixtureId === fixture.id
      );
      return { ...fixture, prediction };
    });
  }

  async createPrediction(insertPrediction: InsertPrediction): Promise<Prediction> {
    const id = this.currentPredictionId++;
    const prediction: Prediction = {
      id,
      fixtureId: insertPrediction.fixtureId,
      prediction: insertPrediction.prediction,
      confidence: insertPrediction.confidence,
      reasoning: insertPrediction.reasoning || null,
      strategy: insertPrediction.strategy || "balanced",
      createdAt: new Date()
    };
    this.predictions.set(id, prediction);
    return prediction;
  }

  async getPredictionsByFixtureId(fixtureId: number): Promise<Prediction[]> {
    return Array.from(this.predictions.values()).filter(
      prediction => prediction.fixtureId === fixtureId
    );
  }

  async deletePredictionsByJackpotId(jackpotId: string): Promise<void> {
    const fixtures = await this.getFixturesByJackpotId(jackpotId);
    const fixtureIds = fixtures.map(f => f.id);
    
    const entriesToDelete: number[] = [];
    this.predictions.forEach((prediction, id) => {
      if (fixtureIds.includes(prediction.fixtureId)) {
        entriesToDelete.push(id);
      }
    });
    
    entriesToDelete.forEach(id => this.predictions.delete(id));
  }

  async createJackpot(insertJackpot: InsertJackpot): Promise<Jackpot> {
    const id = this.currentJackpotId++;
    const jackpot: Jackpot = {
      id,
      amount: insertJackpot.amount,
      drawDate: insertJackpot.drawDate,
      status: insertJackpot.status || "active",
      createdAt: new Date()
    };
    this.jackpots.set(id, jackpot);
    return jackpot;
  }

  async getCurrentJackpot(): Promise<Jackpot | undefined> {
    return Array.from(this.jackpots.values()).find(
      jackpot => jackpot.status === "active"
    );
  }

  async updateJackpot(id: number, updates: Partial<Jackpot>): Promise<Jackpot> {
    const existing = this.jackpots.get(id);
    if (!existing) {
      throw new Error("Jackpot not found");
    }
    
    const updated = { ...existing, ...updates };
    this.jackpots.set(id, updated);
    return updated;
  }
}

// Database storage implementation using Drizzle ORM
export class DatabaseStorage implements IStorage {
  async createFixture(fixture: InsertFixture): Promise<Fixture> {
    if (!db) throw new Error("Database not initialized");
    const [created] = await db.insert(fixtures).values(fixture).returning();
    return created;
  }

  async getFixturesByJackpotId(jackpotId: string): Promise<Fixture[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(fixtures).where(eq(fixtures.jackpotId, jackpotId));
  }

  async getFixturesWithPredictions(jackpotId: string): Promise<FixtureWithPrediction[]> {
    if (!db) throw new Error("Database not initialized");
    const fixtureList = await this.getFixturesByJackpotId(jackpotId);
    
    const result: FixtureWithPrediction[] = [];
    for (const fixture of fixtureList) {
      const [prediction] = await db.select().from(predictions).where(eq(predictions.fixtureId, fixture.id));
      result.push({ ...fixture, prediction });
    }
    
    return result;
  }

  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    if (!db) throw new Error("Database not initialized");
    const [created] = await db.insert(predictions).values({
      ...prediction,
      strategy: prediction.strategy || "balanced"
    }).returning();
    return created;
  }

  async getPredictionsByFixtureId(fixtureId: number): Promise<Prediction[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(predictions).where(eq(predictions.fixtureId, fixtureId));
  }

  async deletePredictionsByJackpotId(jackpotId: string): Promise<void> {
    if (!db) throw new Error("Database not initialized");
    const fixtureList = await this.getFixturesByJackpotId(jackpotId);
    const fixtureIds = fixtureList.map(f => f.id);
    
    for (const fixtureId of fixtureIds) {
      await db.delete(predictions).where(eq(predictions.fixtureId, fixtureId));
    }
  }

  async createJackpot(jackpot: InsertJackpot): Promise<Jackpot> {
    if (!db) throw new Error("Database not initialized");
    const [created] = await db.insert(jackpots).values({
      ...jackpot,
      status: jackpot.status || "active"
    }).returning();
    return created;
  }

  async getCurrentJackpot(): Promise<Jackpot | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [current] = await db.select().from(jackpots).where(eq(jackpots.status, "active")).limit(1);
    return current;
  }

  async updateJackpot(id: number, updates: Partial<Jackpot>): Promise<Jackpot> {
    if (!db) throw new Error("Database not initialized");
    const [updated] = await db.update(jackpots).set(updates).where(eq(jackpots.id, id)).returning();
    return updated;
  }
}

// Use database storage in production, memory storage for development fallback
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
