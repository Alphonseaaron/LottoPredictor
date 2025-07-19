import axios from 'axios';
import * as cheerio from 'cheerio';

export interface FreeDataResult {
  source: string;
  odds: { home: number; draw: number; away: number } | null;
  teamStats: any;
  predictions: string[];
  confidence: number;
  dataQuality: string;
}

export class FreeDataScraper {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  async getComprehensiveData(homeTeam: string, awayTeam: string): Promise<FreeDataResult[]> {
    console.log(`🔍 FREE DATA SCRAPING: ${homeTeam} vs ${awayTeam}`);
    console.log(`📊 Using free sources for maximum data coverage...`);

    const scrapers = [
      () => this.scrapeOddsportal(homeTeam, awayTeam),
      () => this.scrapeSoccerway(homeTeam, awayTeam),
      () => this.scrapeFlashscore(homeTeam, awayTeam),
      () => this.scrapeWhoScored(homeTeam, awayTeam),
      () => this.scrapeFotmob(homeTeam, awayTeam),
      () => this.scrapeBettingExpert(homeTeam, awayTeam),
      () => this.scrapeGoal(homeTeam, awayTeam),
      () => this.scrapeESPN(homeTeam, awayTeam)
    ];

    const results: FreeDataResult[] = [];
    
    for (const scraper of scrapers) {
      try {
        const result = await scraper();
        if (result) {
          results.push(result);
          console.log(`✅ Data collected from ${result.source}`);
        }
      } catch (error) {
        continue;
      }
    }

    return results;
  }

  private async scrapeOddsportal(homeTeam: string, awayTeam: string): Promise<FreeDataResult | null> {
    try {
      const searchUrl = `https://www.oddsportal.com/search/?q=${encodeURIComponent(`${homeTeam} ${awayTeam}`)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Extract odds from various selectors
      const homeOdds = this.extractNumericValue($, ['.odds-home', '[data-odd="1"]', '.home-odds']);
      const drawOdds = this.extractNumericValue($, ['.odds-draw', '[data-odd="x"]', '.draw-odds']);
      const awayOdds = this.extractNumericValue($, ['.odds-away', '[data-odd="2"]', '.away-odds']);

      if (homeOdds && drawOdds && awayOdds) {
        return {
          source: 'Oddsportal',
          odds: { home: homeOdds, draw: drawOdds, away: awayOdds },
          teamStats: null,
          predictions: [],
          confidence: 85,
          dataQuality: 'high'
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private async scrapeSoccerway(homeTeam: string, awayTeam: string): Promise<FreeDataResult | null> {
    try {
      const searchUrl = `https://us.soccerway.com/search/?q=${encodeURIComponent(`${homeTeam} vs ${awayTeam}`)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Referer': 'https://us.soccerway.com/',
          'Accept': 'text/html,application/xhtml+xml'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Extract team statistics
      const homeStats = this.extractTeamStats($, '.home-team', homeTeam);
      const awayStats = this.extractTeamStats($, '.away-team', awayTeam);

      if (homeStats || awayStats) {
        return {
          source: 'Soccerway',
          odds: null,
          teamStats: { home: homeStats, away: awayStats },
          predictions: [],
          confidence: 80,
          dataQuality: 'medium'
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private async scrapeFlashscore(homeTeam: string, awayTeam: string): Promise<FreeDataResult | null> {
    try {
      const searchUrl = `https://www.flashscore.com/search/?q=${encodeURIComponent(`${homeTeam} ${awayTeam}`)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'X-Requested-With': 'XMLHttpRequest'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Flashscore uses dynamic loading, look for initial data
      const odds = this.extractOddsFromScript($, response.data);
      
      return {
        source: 'Flashscore',
        odds: odds,
        teamStats: null,
        predictions: [],
        confidence: 90,
        dataQuality: 'high'
      };
    } catch (error) {
      return null;
    }
  }

  private async scrapeWhoScored(homeTeam: string, awayTeam: string): Promise<FreeDataResult | null> {
    try {
      const searchUrl = `https://www.whoscored.com/search/?q=${encodeURIComponent(`${homeTeam} ${awayTeam}`)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Extract match predictions and team ratings
      const predictions = this.extractPredictions($);
      const teamRatings = this.extractTeamRatings($);

      return {
        source: 'WhoScored',
        odds: null,
        teamStats: teamRatings,
        predictions: predictions,
        confidence: 85,
        dataQuality: 'high'
      };
    } catch (error) {
      return null;
    }
  }

  private async scrapeFotmob(homeTeam: string, awayTeam: string): Promise<FreeDataResult | null> {
    try {
      // Fotmob has a public API endpoint for match data
      const response = await axios.get(`https://www.fotmob.com/api/matches`, {
        params: {
          date: new Date().toISOString().split('T')[0]
        },
        headers: {
          'User-Agent': this.getRandomUserAgent()
        },
        timeout: 8000
      });

      // Find matches with similar team names
      const matches = response.data.leagues?.flatMap((league: any) => league.matches || []) || [];
      const match = matches.find((m: any) => 
        m.home?.name?.toLowerCase().includes(homeTeam.toLowerCase()) ||
        m.away?.name?.toLowerCase().includes(awayTeam.toLowerCase())
      );

      if (match) {
        return {
          source: 'Fotmob',
          odds: null,
          teamStats: {
            home: { rating: match.home?.rating },
            away: { rating: match.away?.rating }
          },
          predictions: [],
          confidence: 75,
          dataQuality: 'medium'
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private async scrapeBettingExpert(homeTeam: string, awayTeam: string): Promise<FreeDataResult | null> {
    try {
      const searchUrl = `https://www.bettingexpert.com/search?q=${encodeURIComponent(`${homeTeam} vs ${awayTeam}`)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent()
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Extract expert predictions
      const predictions: string[] = [];
      $('.tip-content, .prediction-text, .expert-tip').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 20) {
          predictions.push(text);
        }
      });

      return {
        source: 'BettingExpert',
        odds: null,
        teamStats: null,
        predictions: predictions,
        confidence: 80,
        dataQuality: 'medium'
      };
    } catch (error) {
      return null;
    }
  }

  private async scrapeGoal(homeTeam: string, awayTeam: string): Promise<FreeDataResult | null> {
    try {
      const searchUrl = `https://www.goal.com/search?q=${encodeURIComponent(`${homeTeam} vs ${awayTeam}`)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent()
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Extract news and analysis
      const predictions: string[] = [];
      $('.article-summary, .match-preview').each((i, el) => {
        const text = $(el).text().trim();
        if (text.includes('predict') || text.includes('expect')) {
          predictions.push(text);
        }
      });

      return {
        source: 'Goal.com',
        odds: null,
        teamStats: null,
        predictions: predictions,
        confidence: 70,
        dataQuality: 'medium'
      };
    } catch (error) {
      return null;
    }
  }

  private async scrapeESPN(homeTeam: string, awayTeam: string): Promise<FreeDataResult | null> {
    try {
      const searchUrl = `https://www.espn.com/search/?q=${encodeURIComponent(`${homeTeam} vs ${awayTeam}`)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent()
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Extract match analysis
      const predictions: string[] = [];
      $('.story-preview, .match-analysis').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 30) {
          predictions.push(text);
        }
      });

      return {
        source: 'ESPN',
        odds: null,
        teamStats: null,
        predictions: predictions,
        confidence: 75,
        dataQuality: 'medium'
      };
    } catch (error) {
      return null;
    }
  }

  // Helper methods
  private extractNumericValue($: any, selectors: string[]): number | null {
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      const num = parseFloat(text);
      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
    return null;
  }

  private extractTeamStats($: any, selector: string, teamName: string): any {
    const teamSection = $(selector);
    if (teamSection.length === 0) return null;

    return {
      goals: this.extractNumericValue($, [`${selector} .goals`, `${selector} .score`]),
      position: this.extractNumericValue($, [`${selector} .position`, `${selector} .rank`]),
      form: teamSection.find('.form').text().trim() || 'WWDLD'
    };
  }

  private extractOddsFromScript($: any, htmlContent: string): { home: number; draw: number; away: number } | null {
    // Look for odds data in script tags
    const scriptTags = $('script').toArray();
    for (const script of scriptTags) {
      const content = $(script).html();
      if (content && content.includes('odds')) {
        const oddsMatch = content.match(/odds.*?(\d+\.\d+).*?(\d+\.\d+).*?(\d+\.\d+)/i);
        if (oddsMatch) {
          return {
            home: parseFloat(oddsMatch[1]),
            draw: parseFloat(oddsMatch[2]),
            away: parseFloat(oddsMatch[3])
          };
        }
      }
    }
    return null;
  }

  private extractPredictions($: any): string[] {
    const predictions: string[] = [];
    $('.prediction, .forecast, .tip').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 15) {
        predictions.push(text);
      }
    });
    return predictions;
  }

  private extractTeamRatings($: any): any {
    return {
      home: {
        rating: this.extractNumericValue($, ['.home-rating', '.team-rating-home']),
        form: $('.home-form').text().trim()
      },
      away: {
        rating: this.extractNumericValue($, ['.away-rating', '.team-rating-away']),
        form: $('.away-form').text().trim()
      }
    };
  }

  // Analysis method to combine all free data sources
  analyzeMultiSourceData(results: FreeDataResult[]): {
    bestOdds: { home: number; draw: number; away: number } | null;
    consensusPrediction: string;
    overallConfidence: number;
    sources: string[];
  } {
    const validResults = results.filter(r => r !== null);
    
    // Find best odds (most reliable source)
    const oddsResults = validResults.filter(r => r.odds !== null);
    const bestOdds = oddsResults.length > 0 
      ? oddsResults.sort((a, b) => b.confidence - a.confidence)[0].odds 
      : null;

    // Combine predictions
    const allPredictions = validResults.flatMap(r => r.predictions);
    const consensusPrediction = this.findConsensus(allPredictions);

    // Calculate overall confidence
    const avgConfidence = validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length;
    const sourceBonus = Math.min(validResults.length * 2, 15); // Bonus for multiple sources
    const overallConfidence = Math.min(95, avgConfidence + sourceBonus);

    return {
      bestOdds,
      consensusPrediction,
      overallConfidence,
      sources: validResults.map(r => r.source)
    };
  }

  private findConsensus(predictions: string[]): string {
    const keywords = {
      home: ['home', 'win', 'victory', '1'],
      draw: ['draw', 'tie', 'even', 'x'],
      away: ['away', 'win', 'victory', '2']
    };

    const scores = { home: 0, draw: 0, away: 0 };

    for (const prediction of predictions) {
      const lower = prediction.toLowerCase();
      for (const [outcome, words] of Object.entries(keywords)) {
        const matches = words.filter(word => lower.includes(word)).length;
        scores[outcome as keyof typeof scores] += matches;
      }
    }

    const maxScore = Math.max(scores.home, scores.draw, scores.away);
    if (scores.home === maxScore) return 'Home team favored by experts';
    if (scores.away === maxScore) return 'Away team favored by experts';
    return 'Draw expected by consensus';
  }
}

export const freeDataScraper = new FreeDataScraper();