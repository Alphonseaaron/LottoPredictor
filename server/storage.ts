import { fixtures, predictions, jackpots, type Fixture, type InsertFixture, type Prediction, type InsertPrediction, type Jackpot, type InsertJackpot, type FixtureWithPrediction } from "@shared/schema";

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
      ...insertPrediction,
      id,
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
    
    for (const [id, prediction] of this.predictions) {
      if (fixtureIds.includes(prediction.fixtureId)) {
        this.predictions.delete(id);
      }
    }
  }

  async createJackpot(insertJackpot: InsertJackpot): Promise<Jackpot> {
    const id = this.currentJackpotId++;
    const jackpot: Jackpot = {
      ...insertJackpot,
      id,
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

export const storage = new MemStorage();
