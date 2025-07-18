import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFixtureSchema, insertPredictionSchema, insertJackpotSchema } from "@shared/schema";
import { automatedPredictionService } from "./services/automated-prediction-service";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current jackpot
  app.get("/api/jackpot/current", async (req, res) => {
    try {
      const jackpot = await storage.getCurrentJackpot();
      res.json(jackpot);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jackpot" });
    }
  });

  // Create fixtures
  app.post("/api/fixtures", async (req, res) => {
    try {
      const fixturesData = z.array(insertFixtureSchema).parse(req.body);
      const createdFixtures = [];
      
      for (const fixtureData of fixturesData) {
        const fixture = await storage.createFixture(fixtureData);
        createdFixtures.push(fixture);
      }
      
      res.json(createdFixtures);
    } catch (error) {
      res.status(400).json({ message: "Invalid fixture data" });
    }
  });

  // Get fixtures with predictions
  app.get("/api/fixtures/:jackpotId", async (req, res) => {
    try {
      const { jackpotId } = req.params;
      const fixtures = await storage.getFixturesWithPredictions(jackpotId);
      res.json(fixtures);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fixtures" });
    }
  });

  // Generate predictions
  app.post("/api/predictions/generate", async (req, res) => {
    try {
      const { jackpotId, strategy = "balanced", includeWildcards = false } = req.body;
      
      // Clear existing predictions
      await storage.deletePredictionsByJackpotId(jackpotId);
      
      const fixtures = await storage.getFixturesByJackpotId(jackpotId);
      
      if (fixtures.length !== 17) {
        return res.status(400).json({ message: "Exactly 17 fixtures required for jackpot" });
      }

      const predictions = [];
      
      // Generate balanced predictions (5-6-6 distribution)
      const results = generateBalancedPredictions(fixtures.length, strategy);
      
      for (let i = 0; i < fixtures.length; i++) {
        const fixture = fixtures[i];
        const prediction = await storage.createPrediction({
          fixtureId: fixture.id,
          prediction: results[i].prediction,
          confidence: results[i].confidence,
          reasoning: results[i].reasoning,
          strategy
        });
        predictions.push(prediction);
      }
      
      res.json(predictions);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate predictions" });
    }
  });

  // Get predictions summary
  app.get("/api/predictions/summary/:jackpotId", async (req, res) => {
    try {
      const { jackpotId } = req.params;
      const fixtures = await storage.getFixturesWithPredictions(jackpotId);
      
      const summary = {
        homeWins: fixtures.filter(f => f.prediction?.prediction === "1").length,
        draws: fixtures.filter(f => f.prediction?.prediction === "X").length,
        awayWins: fixtures.filter(f => f.prediction?.prediction === "2").length,
        totalMatches: fixtures.length
      };
      
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });

  // Automated prediction generation
  app.post("/api/predictions/automated", async (req, res) => {
    try {
      console.log("🚀 Starting automated prediction generation...");
      const result = await automatedPredictionService.generateAutomatedPredictions();
      res.json(result);
    } catch (error) {
      console.error("❌ Automated prediction error:", error);
      res.status(500).json({ 
        message: "Failed to generate automated predictions",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get real-time jackpot data
  app.get("/api/jackpot/live", async (req, res) => {
    try {
      const { sportpesaScraper } = await import("./scrapers/sportpesa-scraper");
      const jackpotData = await sportpesaScraper.getCurrentJackpot();
      
      if (!jackpotData) {
        return res.status(404).json({ message: "No current jackpot found" });
      }
      
      res.json(jackpotData);
    } catch (error) {
      console.error("Error fetching live jackpot:", error);
      res.status(500).json({ message: "Failed to fetch live jackpot data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateBalancedPredictions(count: number, strategy: string) {
  const predictions = [];
  const reasonings = [
    "Strong home form",
    "Recent away victories",
    "Even recent form",
    "Head-to-head advantage",
    "Home advantage factor",
    "Away team momentum",
    "Tactical matchup favors home",
    "Away team's strong attack",
    "Defensive stalemate expected",
    "Historical draw tendency",
    "Form guide suggests home win",
    "Away team injury concerns favor home",
    "Balanced teams likely draw",
    "Home crowd advantage",
    "Away team desperate for points",
    "Recent meeting ended in draw",
    "Home team needs the points"
  ];

  // Balanced strategy: approximately 5-6-6 distribution
  let homeWins = 5;
  let draws = 6;
  let awayWins = 6;
  
  if (strategy === "conservative") {
    homeWins = 8;
    draws = 5;
    awayWins = 4;
  } else if (strategy === "aggressive") {
    homeWins = 3;
    draws = 7;
    awayWins = 7;
  }

  // Generate predictions with the desired distribution
  const results = [];
  
  for (let i = 0; i < homeWins && results.length < count; i++) {
    results.push({
      prediction: "1",
      confidence: Math.floor(Math.random() * 20) + 70, // 70-90%
      reasoning: reasonings[Math.floor(Math.random() * reasonings.length)]
    });
  }
  
  for (let i = 0; i < draws && results.length < count; i++) {
    results.push({
      prediction: "X",
      confidence: Math.floor(Math.random() * 20) + 60, // 60-80%
      reasoning: reasonings[Math.floor(Math.random() * reasonings.length)]
    });
  }
  
  for (let i = 0; i < awayWins && results.length < count; i++) {
    results.push({
      prediction: "2",
      confidence: Math.floor(Math.random() * 20) + 65, // 65-85%
      reasoning: reasonings[Math.floor(Math.random() * reasonings.length)]
    });
  }

  // Shuffle the results to randomize order
  for (let i = results.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [results[i], results[j]] = [results[j], results[i]];
  }

  return results;
}
