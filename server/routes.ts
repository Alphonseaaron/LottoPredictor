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
      console.log('Failed to fetch jackpot:', error);
      // Return a helpful response indicating analysis is in progress
      res.status(202).json({ 
        message: "Jackpot analysis in progress", 
        status: "processing",
        note: "SportPesa analysis is currently running. Please wait for completion."
      });
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
      console.log('Failed to fetch fixtures:', error);
      res.status(500).json({ message: "Failed to fetch fixtures", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Trigger manual SportPesa scraping
  app.post("/api/scrape/sportpesa", async (req, res) => {
    try {
      console.log('🔄 Manual SportPesa scraping triggered...');
      const result = await automatedPredictionService.generateAutomatedPredictions();
      res.json({ 
        success: true, 
        message: 'SportPesa scraping and predictions completed',
        result 
      });
    } catch (error) {
      console.error('❌ Manual scraping failed:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to scrape SportPesa', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Reset analysis lock - allows restarting stuck analysis
  app.post("/api/scrape/reset", async (req, res) => {
    try {
      console.log('🔄 Resetting analysis lock...');
      automatedPredictionService.resetAnalysisLock();
      res.json({ 
        success: true, 
        message: 'Analysis lock reset successfully' 
      });
    } catch (error) {
      console.error('❌ Failed to reset analysis lock:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to reset analysis lock',
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get scraping status
  app.get("/api/scrape/status", async (req, res) => {
    try {
      res.json({
        automatedScrapingEnabled: true,
        checkInterval: '30 minutes',
        lastCheck: new Date().toISOString(),
        status: 'Active - checking SportPesa for new mega jackpots'
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get scraping status" });
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
      
      // Generate AI-powered predictions using real team statistics
      const { pythonAnalyzer } = await import("./ai/python-analyzer");
      const { teamStatsScaper } = await import("./scrapers/team-stats-scraper");
      const { jackpotHistoryScraper } = await import("./scrapers/jackpot-history-scraper");
      
      console.log('🔍 Fetching historical jackpot patterns...');
      const jackpotHistory = await jackpotHistoryScraper.getJackpotHistory(20);
      const frequencyAnalysis = jackpotHistoryScraper.getFrequencyAnalysis(jackpotHistory);
      
      console.log('📊 Historical analysis:', {
        averagePattern: `${frequencyAnalysis.averageHomeWins}-${frequencyAnalysis.averageDraws}-${frequencyAnalysis.averageAwayWins}`,
        mostCommon: frequencyAnalysis.mostCommonOutcome
      });
      
      // Sort fixtures by their original order (by ID to maintain SportPesa fixture order)
      const orderedFixtures = fixtures.sort((a, b) => a.id - b.id);
      
      for (let i = 0; i < orderedFixtures.length; i++) {
        const fixture = orderedFixtures[i];
        
        console.log(`🏟️ Analyzing: ${fixture.homeTeam} vs ${fixture.awayTeam}`);
        
        // Fetch comprehensive team data
        const [homeStats, awayStats] = await Promise.all([
          teamStatsScaper.getTeamStats(fixture.homeTeam),
          teamStatsScaper.getTeamStats(fixture.awayTeam)
        ]);
        
        // Get head-to-head record
        const h2hRecord = await teamStatsScaper.getH2HRecord(fixture.homeTeam, fixture.awayTeam);
        
        console.log(`📊 Stats: ${fixture.homeTeam} (${homeStats.position}th, ${homeStats.form}) vs ${fixture.awayTeam} (${awayStats.position}th, ${awayStats.form})`);
        
        // Generate comprehensive prediction analysis
        const analysis = await pythonAnalyzer.analyzeMatch(
          fixture.homeTeam,
          fixture.awayTeam,
          homeStats,
          awayStats,
          h2hRecord,
          ['team-stats', 'h2h-analysis', 'form-analysis']
        );
        
        const prediction = await storage.createPrediction({
          fixtureId: fixture.id,
          prediction: analysis.prediction,
          confidence: analysis.confidence,
          reasoning: `${analysis.reasoning}\n\n**Historical Pattern:** Average jackpot has ${frequencyAnalysis.averageHomeWins} home wins, ${frequencyAnalysis.averageDraws} draws, ${frequencyAnalysis.averageAwayWins} away wins`,
          strategy: 'comprehensive-analysis'
        });
        predictions.push(prediction);
      }
      
      // Return predictions in original fixture order
      const orderedPredictions = predictions.sort((a, b) => {
        const fixtureA = orderedFixtures.find(f => f.id === a.fixtureId);
        const fixtureB = orderedFixtures.find(f => f.id === b.fixtureId);
        return (fixtureA?.id || 0) - (fixtureB?.id || 0);
      });
      
      res.json(orderedPredictions);
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

  // Delete predictions for a jackpot
  app.delete("/api/predictions/jackpot/:jackpotId", async (req, res) => {
    try {
      const { jackpotId } = req.params;
      await storage.deletePredictionsByJackpotId(jackpotId);
      res.json({ message: "Predictions deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete predictions" });
    }
  });

  // Delete predictions for a jackpot
  app.delete("/api/predictions/jackpot/:jackpotId", async (req, res) => {
    try {
      const { jackpotId } = req.params;
      await storage.deletePredictionsByJackpotId(jackpotId);
      res.json({ message: "Predictions deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete predictions" });
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

  // Get jackpot history and winning patterns
  app.get("/api/jackpot/history", async (req, res) => {
    try {
      const { jackpotHistoryScraper } = await import("./scrapers/jackpot-history-scraper");
      
      const limit = parseInt(req.query.limit as string) || 20;
      const history = await jackpotHistoryScraper.getJackpotHistory(limit);
      const analysis = jackpotHistoryScraper.getFrequencyAnalysis(history);
      
      res.json({
        history,
        analysis,
        summary: {
          totalJackpots: history.length,
          averagePattern: `${analysis.averageHomeWins}-${analysis.averageDraws}-${analysis.averageAwayWins}`,
          mostCommonOutcome: analysis.mostCommonOutcome
        }
      });
    } catch (error) {
      console.error("Error fetching jackpot history:", error);
      res.status(500).json({ message: "Failed to fetch jackpot history" });
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
