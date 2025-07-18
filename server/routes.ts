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
      const { jackpotId } = req.body;
      
      // Clear existing predictions
      await storage.deletePredictionsByJackpotId(jackpotId);
      
      const fixtures = await storage.getFixturesByJackpotId(jackpotId);
      
      if (fixtures.length !== 17) {
        return res.status(400).json({ message: "Exactly 17 fixtures required for jackpot" });
      }

      const predictions = [];
      
      // Generate balanced predictions using Python analyzer
      const { pythonAnalyzer } = await import("./ai/python-analyzer");
      
      for (let i = 0; i < fixtures.length; i++) {
        const fixture = fixtures[i];
        
        // Generate prediction using Python analyzer
        const analysis = await pythonAnalyzer.analyzeMatch(
          fixture.homeTeam,
          fixture.awayTeam,
          {
            position: Math.floor(Math.random() * 20) + 1,
            points: Math.floor(Math.random() * 50) + 10,
            form: 'WWDLL',
            goalsFor: Math.floor(Math.random() * 30) + 10,
            goalsAgainst: Math.floor(Math.random() * 25) + 5,
            homeRecord: { wins: 5, draws: 3, losses: 2 },
            awayRecord: { wins: 3, draws: 4, losses: 3 }
          },
          {
            position: Math.floor(Math.random() * 20) + 1,
            points: Math.floor(Math.random() * 50) + 10,
            form: 'WDWLL',
            goalsFor: Math.floor(Math.random() * 25) + 8,
            goalsAgainst: Math.floor(Math.random() * 30) + 8,
            homeRecord: { wins: 4, draws: 2, losses: 4 },
            awayRecord: { wins: 2, draws: 5, losses: 3 }
          },
          {
            totalMeetings: 10,
            homeWins: 4,
            draws: 3,
            awayWins: 3
          }
        );
        
        const prediction = await storage.createPrediction({
          fixtureId: fixture.id,
          prediction: analysis.prediction,
          confidence: analysis.confidence,
          reasoning: analysis.reasoning,
          strategy: 'ai-analysis'
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

  // Create jackpot with custom fixtures
  app.post("/api/jackpot/create", async (req, res) => {
    try {
      const { amount, fixtures: fixtureList } = req.body;
      
      // Create jackpot
      const jackpot = await storage.createJackpot({
        amount: amount || "KSH 100,000,000",
        drawDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'active'
      });
      
      // Create fixtures from provided list
      const fixtures = [];
      for (const fixture of fixtureList) {
        const created = await storage.createFixture({
          homeTeam: fixture.homeTeam,
          awayTeam: fixture.awayTeam,
          matchDate: new Date(),
          jackpotId: jackpot.id.toString()
        });
        fixtures.push(created);
      }
      
      res.json({ jackpot, fixtures });
    } catch (error) {
      console.error("Error creating jackpot:", error);
      res.status(500).json({ message: "Failed to create jackpot" });
    }
  });

  // Create jackpot with custom fixtures
  app.post("/api/jackpot/custom", async (req, res) => {
    try {
      const { amount, fixtureText } = req.body;
      
      if (!amount || !fixtureText) {
        return res.status(400).json({ message: "Amount and fixture text are required" });
      }
      
      const { fixtureParser } = await import("./services/fixture-parser");
      const parsedFixtures = fixtureParser.parseFixtureList(fixtureText);
      
      if (parsedFixtures.length === 0) {
        return res.status(400).json({ message: "No valid fixtures found in the text" });
      }
      
      // Create jackpot
      const jackpot = await storage.createJackpot({
        amount,
        drawDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'active'
      });
      
      // Create fixtures
      const fixtures = await Promise.all(
        parsedFixtures.map((fixture, index) => 
          storage.createFixture({
            homeTeam: fixture.homeTeam,
            awayTeam: fixture.awayTeam,
            matchDate: new Date(fixture.matchDate),
            jackpotId: jackpot.id.toString()
          })
        )
      );
      
      res.json({
        jackpot,
        fixtures,
        message: `Created jackpot with ${fixtures.length} fixtures`
      });
    } catch (error) {
      console.error("Error creating custom jackpot:", error);
      res.status(500).json({ message: "Failed to create custom jackpot" });
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
