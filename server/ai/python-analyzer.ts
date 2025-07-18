import { spawn } from 'child_process';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import type { TeamStats, H2HRecord } from '../scrapers/football-data-scraper';

export interface PythonAnalysisResult {
  prediction: '1' | 'X' | '2';
  confidence: number;
  reasoning: string;
  keyFactors: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export class PythonAnalyzer {
  
  async analyzeMatch(
    homeTeam: string,
    awayTeam: string,
    homeStats: TeamStats,
    awayStats: TeamStats,
    h2h: H2HRecord,
    sources?: string[]
  ): Promise<PythonAnalysisResult> {
    // Use comprehensive JavaScript analysis instead of Python
    return this.getComprehensiveAnalysis(homeTeam, awayTeam, homeStats, awayStats, h2h, sources || []);
  }

  private async runPythonScript(dataFile: string): Promise<PythonAnalysisResult> {
    return new Promise((resolve, reject) => {
      // Python script for football match analysis
      const pythonScript = `
import json
import sys
import math
import random

def analyze_match(data):
    home_team = data['homeTeam']
    away_team = data['awayTeam']
    home_stats = data['homeStats']
    away_stats = data['awayStats']
    h2h = data['h2h']
    
    # Calculate home advantage
    home_score = 55  # Base home advantage
    
    # Form analysis
    home_form_score = calculate_form_score(home_stats['form'])
    away_form_score = calculate_form_score(away_stats['form'])
    home_score += (home_form_score - away_form_score) * 5
    
    # League position factor
    position_diff = away_stats['position'] - home_stats['position']
    home_score += position_diff * 2
    
    # Goals scored/conceded ratio
    if home_stats['goalsAgainst'] > 0:
        home_attack = home_stats['goalsFor'] / max(1, home_stats['goalsAgainst'])
    else:
        home_attack = home_stats['goalsFor']
        
    if away_stats['goalsAgainst'] > 0:
        away_attack = away_stats['goalsFor'] / max(1, away_stats['goalsAgainst'])
    else:
        away_attack = away_stats['goalsFor']
    
    attack_diff = home_attack - away_attack
    home_score += attack_diff * 10
    
    # H2H factor
    if h2h['totalMeetings'] > 0:
        home_h2h_rate = h2h['homeWins'] / h2h['totalMeetings']
        home_score += (home_h2h_rate - 0.33) * 20  # 0.33 is baseline
    
    # Determine prediction
    if home_score > 65:
        prediction = '1'
        confidence = min(90, max(55, home_score))
        reasoning = f"{home_team} favored due to strong form and home advantage"
        risk_level = 'low' if confidence > 75 else 'medium'
    elif home_score < 35:
        prediction = '2'
        confidence = min(90, max(55, 100 - home_score))
        reasoning = f"{away_team} shows superior statistics and recent form"
        risk_level = 'low' if confidence > 75 else 'medium'
    else:
        prediction = 'X'
        confidence = 65 + random.randint(-10, 10)
        reasoning = "Teams are evenly matched, draw is most likely outcome"
        risk_level = 'medium'
    
    key_factors = []
    if abs(home_form_score - away_form_score) > 1:
        key_factors.append("Recent form difference")
    if abs(position_diff) > 5:
        key_factors.append("League position gap")
    if h2h['totalMeetings'] > 3:
        key_factors.append("Historical head-to-head")
    
    key_factors.append("Home advantage factor")
    
    return {
        'prediction': prediction,
        'confidence': int(confidence),
        'reasoning': reasoning,
        'keyFactors': key_factors,
        'riskLevel': risk_level
    }

def calculate_form_score(form_string):
    if not form_string:
        return 2  # Neutral
    
    score = 0
    for result in form_string:
        if result == 'W':
            score += 3
        elif result == 'D':
            score += 1
        # L = 0 points
    
    return score / len(form_string) if form_string else 2

# Read data and analyze
try:
    with open('${dataFile}', 'r') as f:
        data = json.load(f)
    
    result = analyze_match(data)
    print(json.dumps(result))
    
except Exception as e:
    # Fallback result
    fallback = {
        'prediction': '1',
        'confidence': 60,
        'reasoning': 'Analysis completed with basic algorithm',
        'keyFactors': ['Home advantage', 'Statistical analysis'],
        'riskLevel': 'medium'
    }
    print(json.dumps(fallback))
`;

      // Write Python script to temporary file
      const scriptFile = join(process.cwd(), `analyzer_${Date.now()}.py`);
      writeFile(scriptFile, pythonScript).then(() => {
        
        const python = spawn('python3', [scriptFile], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let error = '';

        python.stdout.on('data', (data) => {
          output += data.toString();
        });

        python.stderr.on('data', (data) => {
          error += data.toString();
        });

        python.on('close', async (code) => {
          // Clean up script file
          try {
            await unlink(scriptFile);
          } catch (e) {
            // Ignore cleanup errors
          }

          if (code === 0 && output.trim()) {
            try {
              const result = JSON.parse(output.trim());
              resolve(result);
            } catch (parseError) {
              reject(new Error('Failed to parse Python output'));
            }
          } else {
            reject(new Error(`Python script failed: ${error}`));
          }
        });

        python.on('error', (err) => {
          reject(new Error(`Failed to spawn Python process: ${err.message}`));
        });
      }).catch(reject);
    });
  }

  private getComprehensiveAnalysis(
    homeTeam: string,
    awayTeam: string,
    homeStats: TeamStats,
    awayStats: TeamStats,
    h2h: H2HRecord,
    sources: string[]
  ): PythonAnalysisResult {
    // Comprehensive football match analysis
    let homeScore = 55; // Base home advantage
    let analysisFactors: string[] = [];
    let dataSource = "Team statistics analysis";
    
    // 1. Form analysis (recent performance)
    const homeWins = homeStats.form.split('').filter(r => r === 'W').length;
    const awayWins = awayStats.form.split('').filter(r => r === 'W').length;
    const homeDraw = homeStats.form.split('').filter(r => r === 'D').length;
    const awayDraw = awayStats.form.split('').filter(r => r === 'D').length;
    
    const formDiff = homeWins - awayWins;
    homeScore += formDiff * 8;
    analysisFactors.push(`Form: ${homeTeam} (${homeWins}W-${homeDraw}D) vs ${awayTeam} (${awayWins}W-${awayDraw}D)`);
    
    // 2. League position analysis
    const positionDiff = awayStats.position - homeStats.position;
    homeScore += positionDiff * 3;
    analysisFactors.push(`Position: ${homeTeam} (${homeStats.position}) vs ${awayTeam} (${awayStats.position})`);
    
    // 3. Goals scored/conceded ratio
    const homeAttackStrength = homeStats.goalsFor / (homeStats.goalsAgainst + 1);
    const awayAttackStrength = awayStats.goalsFor / (awayStats.goalsAgainst + 1);
    const attackDiff = (homeAttackStrength - awayAttackStrength) * 10;
    homeScore += attackDiff;
    analysisFactors.push(`Attack: ${homeTeam} ratio ${homeAttackStrength.toFixed(2)} vs ${awayTeam} ratio ${awayAttackStrength.toFixed(2)}`);
    
    // 4. Home/Away record analysis
    const homeHomeRecord = homeStats.homeRecord;
    const awayAwayRecord = awayStats.awayRecord;
    const homeHomeStrength = (homeHomeRecord.wins * 3 + homeHomeRecord.draws) / ((homeHomeRecord.wins + homeHomeRecord.draws + homeHomeRecord.losses) * 3);
    const awayAwayStrength = (awayAwayRecord.wins * 3 + awayAwayRecord.draws) / ((awayAwayRecord.wins + awayAwayRecord.draws + awayAwayRecord.losses) * 3);
    
    const recordDiff = (homeHomeStrength - awayAwayStrength) * 15;
    homeScore += recordDiff;
    analysisFactors.push(`Home/Away: ${homeTeam} home ${(homeHomeStrength * 100).toFixed(0)}% vs ${awayTeam} away ${(awayAwayStrength * 100).toFixed(0)}%`);
    
    // 5. Head-to-Head analysis
    if (h2h.totalMeetings > 0) {
      const h2hHomeAdvantage = (h2h.homeWins - h2h.awayWins) / h2h.totalMeetings * 20;
      homeScore += h2hHomeAdvantage;
      analysisFactors.push(`H2H: ${h2h.homeWins}W-${h2h.draws}D-${h2h.awayWins}L in ${h2h.totalMeetings} meetings`);
    }
    
    let prediction: '1' | 'X' | '2';
    let confidence: number;
    
    // Determine prediction and confidence
    if (homeScore >= 70) {
      prediction = '1';
      confidence = Math.min(95, 60 + (homeScore - 70) * 0.5);
    } else if (homeScore <= 40) {
      prediction = '2'; 
      confidence = Math.min(95, 60 + (40 - homeScore) * 0.5);
    } else {
      prediction = 'X';
      confidence = Math.min(85, 55 + Math.abs(55 - homeScore) * 0.3);
    }

    // Create detailed reasoning
    const reasoning = this.buildDetailedReasoning(
      homeTeam, 
      awayTeam, 
      prediction, 
      homeScore, 
      analysisFactors, 
      homeStats, 
      awayStats, 
      h2h
    );

    return {
      prediction,
      confidence: Math.round(confidence),
      reasoning,
      keyFactors: analysisFactors,
      riskLevel: confidence > 80 ? 'low' : confidence > 65 ? 'medium' : 'high'
    };
  }

  private buildDetailedReasoning(
    homeTeam: string,
    awayTeam: string,
    prediction: '1' | 'X' | '2',
    homeScore: number,
    factors: string[],
    homeStats: TeamStats,
    awayStats: TeamStats,
    h2h: H2HRecord
  ): string {
    const predictionText = prediction === '1' ? `${homeTeam} victory` : 
                          prediction === 'X' ? 'Draw' : `${awayTeam} victory`;
    
    let reasoning = `**${predictionText} predicted** - `;
    
    // Main reasoning based on score
    if (homeScore >= 70) {
      reasoning += `Strong home advantage (Score: ${homeScore.toFixed(1)}/100). `;
    } else if (homeScore <= 40) {
      reasoning += `Away team shows superior form (Score: ${homeScore.toFixed(1)}/100). `;
    } else {
      reasoning += `Evenly matched teams likely to draw (Score: ${homeScore.toFixed(1)}/100). `;
    }

    // Add key statistical insights
    reasoning += `\n\n**Key Analysis:**\n`;
    factors.forEach((factor, index) => {
      reasoning += `${index + 1}. ${factor}\n`;
    });

    // Add contextual information
    reasoning += `\n**Team Performance:**\n`;
    reasoning += `• ${homeTeam}: ${homeStats.points}pts, Position ${homeStats.position}, Form: ${homeStats.form}\n`;
    reasoning += `• ${awayTeam}: ${awayStats.points}pts, Position ${awayStats.position}, Form: ${awayStats.form}\n`;

    if (h2h.totalMeetings > 0) {
      reasoning += `\n**Historical Record:** ${homeTeam} ${h2h.homeWins}W-${h2h.draws}D-${h2h.awayWins}L vs ${awayTeam}\n`;
    }

    // Add data source note
    reasoning += `\n*Analysis based on league statistics, team form, and historical data*`;

    return reasoning;
  }
}

export const pythonAnalyzer = new PythonAnalyzer();