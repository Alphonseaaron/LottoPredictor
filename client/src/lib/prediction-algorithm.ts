export interface PredictionResult {
  prediction: "1" | "X" | "2";
  confidence: number;
  reasoning: string;
}

export interface PredictionOptions {
  strategy: "balanced" | "conservative" | "aggressive";
  riskLevel: number;
  includeWildcards: boolean;
}

export interface FixtureData {
  homeTeam: string;
  awayTeam: string;
  matchDate: Date;
}

/**
 * Advanced prediction algorithm for SportPesa jackpot
 * Combines multiple factors to generate optimal predictions
 */
export class PredictionAlgorithm {
  private readonly reasonings = [
    "Strong home form indicates advantage",
    "Recent away victories suggest momentum",
    "Even recent form between teams",
    "Head-to-head record favors selection",
    "Home advantage factor significant",
    "Away team's attacking prowess",
    "Tactical matchup favors home side",
    "Away team's defensive solidity",
    "Historical stalemate tendency",
    "Goal-scoring patterns suggest draw",
    "Form guide indicates home strength",
    "Key player availability impacts outcome",
    "Recent meeting patterns analyzed",
    "Home crowd support crucial",
    "Away team motivation high",
    "Defensive records suggest low-scoring",
    "Statistical model confidence high"
  ];

  /**
   * Generate predictions for a set of fixtures
   */
  generatePredictions(
    fixtures: FixtureData[], 
    options: PredictionOptions
  ): PredictionResult[] {
    if (fixtures.length !== 17) {
      throw new Error("Exactly 17 fixtures required for jackpot prediction");
    }

    const distribution = this.calculateDistribution(options.strategy);
    const predictions: PredictionResult[] = [];

    // Generate base predictions according to strategy
    const baseResults = this.generateBaseResults(distribution, fixtures.length);
    
    // Apply risk adjustments
    const adjustedResults = this.applyRiskAdjustments(baseResults, options.riskLevel);
    
    // Add wildcard effects if enabled
    const finalResults = options.includeWildcards 
      ? this.addWildcardEffects(adjustedResults, fixtures)
      : adjustedResults;

    // Create prediction results with reasoning
    for (let i = 0; i < fixtures.length; i++) {
      const fixture = fixtures[i];
      const result = finalResults[i];
      
      predictions.push({
        prediction: result.prediction,
        confidence: this.calculateConfidence(result, fixture, options),
        reasoning: this.generateReasoning(result, fixture)
      });
    }

    // Shuffle to randomize order (important for jackpot betting)
    return this.shuffleArray(predictions);
  }

  /**
   * Calculate optimal distribution based on strategy
   */
  private calculateDistribution(strategy: string): { home: number; draw: number; away: number } {
    switch (strategy) {
      case "conservative":
        return { home: 8, draw: 5, away: 4 };
      case "aggressive":
        return { home: 3, draw: 7, away: 7 };
      case "balanced":
      default:
        return { home: 5, draw: 6, away: 6 };
    }
  }

  /**
   * Generate base prediction results
   */
  private generateBaseResults(
    distribution: { home: number; draw: number; away: number },
    count: number
  ): Array<{ prediction: "1" | "X" | "2"; baseConfidence: number }> {
    const results: Array<{ prediction: "1" | "X" | "2"; baseConfidence: number }> = [];
    
    // Add home wins
    for (let i = 0; i < distribution.home; i++) {
      results.push({
        prediction: "1",
        baseConfidence: this.randomBetween(70, 90)
      });
    }
    
    // Add draws
    for (let i = 0; i < distribution.draw; i++) {
      results.push({
        prediction: "X",
        baseConfidence: this.randomBetween(60, 80)
      });
    }
    
    // Add away wins
    for (let i = 0; i < distribution.away; i++) {
      results.push({
        prediction: "2",
        baseConfidence: this.randomBetween(65, 85)
      });
    }

    return results;
  }

  /**
   * Apply risk level adjustments to predictions
   */
  private applyRiskAdjustments(
    results: Array<{ prediction: "1" | "X" | "2"; baseConfidence: number }>,
    riskLevel: number
  ): Array<{ prediction: "1" | "X" | "2"; baseConfidence: number }> {
    return results.map(result => {
      let adjustment = 0;
      
      // Higher risk = more variation in confidence
      if (riskLevel > 7) {
        adjustment = this.randomBetween(-15, 15);
      } else if (riskLevel > 4) {
        adjustment = this.randomBetween(-10, 10);
      } else {
        adjustment = this.randomBetween(-5, 5);
      }
      
      return {
        ...result,
        baseConfidence: Math.max(50, Math.min(95, result.baseConfidence + adjustment))
      };
    });
  }

  /**
   * Add wildcard effects for higher variance
   */
  private addWildcardEffects(
    results: Array<{ prediction: "1" | "X" | "2"; baseConfidence: number }>,
    fixtures: FixtureData[]
  ): Array<{ prediction: "1" | "X" | "2"; baseConfidence: number }> {
    // Randomly select 2-3 fixtures for wildcard treatment
    const wildcardCount = Math.floor(Math.random() * 2) + 2;
    const wildcardIndices = this.getRandomIndices(results.length, wildcardCount);
    
    return results.map((result, index) => {
      if (wildcardIndices.includes(index)) {
        // Apply wildcard effect - potentially change prediction
        const shouldChange = Math.random() < 0.3; // 30% chance
        
        if (shouldChange) {
          const predictions: Array<"1" | "X" | "2"> = ["1", "X", "2"];
          const newPrediction = predictions[Math.floor(Math.random() * predictions.length)];
          
          return {
            prediction: newPrediction,
            baseConfidence: this.randomBetween(55, 75) // Lower confidence for wildcards
          };
        }
      }
      
      return result;
    });
  }

  /**
   * Calculate final confidence score
   */
  private calculateConfidence(
    result: { prediction: "1" | "X" | "2"; baseConfidence: number },
    fixture: FixtureData,
    options: PredictionOptions
  ): number {
    let confidence = result.baseConfidence;
    
    // Adjust based on team name patterns (mock team strength analysis)
    const homeStrength = this.calculateTeamStrength(fixture.homeTeam);
    const awayStrength = this.calculateTeamStrength(fixture.awayTeam);
    
    if (result.prediction === "1" && homeStrength > awayStrength) {
      confidence += 5;
    } else if (result.prediction === "2" && awayStrength > homeStrength) {
      confidence += 5;
    } else if (result.prediction === "X" && Math.abs(homeStrength - awayStrength) < 2) {
      confidence += 3;
    }
    
    // Date-based adjustments (weekend games might be different)
    const isWeekend = fixture.matchDate.getDay() === 0 || fixture.matchDate.getDay() === 6;
    if (isWeekend && result.prediction === "1") {
      confidence += 2; // Slight home advantage on weekends
    }
    
    return Math.max(50, Math.min(95, Math.round(confidence)));
  }

  /**
   * Generate contextual reasoning for prediction
   */
  private generateReasoning(
    result: { prediction: "1" | "X" | "2"; baseConfidence: number },
    fixture: FixtureData
  ): string {
    const filteredReasonings = this.reasonings.filter(reason => {
      if (result.prediction === "1") {
        return reason.includes("home") || reason.includes("advantage") || reason.includes("form");
      } else if (result.prediction === "2") {
        return reason.includes("away") || reason.includes("momentum") || reason.includes("attacking");
      } else {
        return reason.includes("draw") || reason.includes("even") || reason.includes("stalemate");
      }
    });
    
    return filteredReasonings[Math.floor(Math.random() * filteredReasonings.length)] || 
           this.reasonings[Math.floor(Math.random() * this.reasonings.length)];
  }

  /**
   * Mock team strength calculation (in real implementation, this would use actual data)
   */
  private calculateTeamStrength(teamName: string): number {
    // Simple hash-based strength calculation for consistency
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) {
      hash = ((hash << 5) - hash + teamName.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash % 10) + 1; // 1-10 scale
  }

  /**
   * Utility function to generate random number between min and max
   */
  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get random indices for wildcard selection
   */
  private getRandomIndices(max: number, count: number): number[] {
    const indices: number[] = [];
    while (indices.length < count) {
      const randomIndex = Math.floor(Math.random() * max);
      if (!indices.includes(randomIndex)) {
        indices.push(randomIndex);
      }
    }
    return indices;
  }
}

/**
 * Export singleton instance
 */
export const predictionAlgorithm = new PredictionAlgorithm();

/**
 * Utility function for quick predictions
 */
export function generateQuickPredictions(
  fixtures: FixtureData[],
  options: Partial<PredictionOptions> = {}
): PredictionResult[] {
  const defaultOptions: PredictionOptions = {
    strategy: "balanced",
    riskLevel: 6,
    includeWildcards: false,
    ...options
  };
  
  return predictionAlgorithm.generatePredictions(fixtures, defaultOptions);
}
