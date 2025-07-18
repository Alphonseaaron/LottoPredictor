import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { automatedPredictionService } from "./services/automated-prediction-service";

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(express.static("public"));

  const server = await registerRoutes(app);

  // Enable automated predictions for SportPesa scraping
  automatedPredictionService.setupAutomatedSchedule();

  // Use Vite's middleware for development or serve static files for production
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000");
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
    console.log(`🤖 Automated prediction service initialized`);
  });
}

startServer().catch(console.error);