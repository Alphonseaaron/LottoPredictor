import axios from 'axios';
import * as cheerio from 'cheerio';

export interface TeamStats {
  position: number;
  points: number;
  form: string;
  goalsFor: number;
  goalsAgainst: number;
  homeRecord: { wins: number; draws: number; losses: number };
  awayRecord: { wins: number; draws: number; losses: number };
}

export interface H2HRecord {
  totalMeetings: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  recentForm: string[]; // Last 5 meetings
}

export class TeamStatsScaper {
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getTeamStats(teamName: string): Promise<TeamStats> {
    try {
      // For now, generate realistic mock data based on team name
      // This can be replaced with actual scraping logic later
      const mockData = this.generateMockTeamStats(teamName);
      
      // Add small delay to simulate network request
      await this.delay(100);
      
      return mockData;
    } catch (error) {
      console.error(`Error fetching stats for ${teamName}:`, error);
      return this.generateMockTeamStats(teamName);
    }
  }

  async getH2HRecord(homeTeam: string, awayTeam: string): Promise<H2HRecord> {
    try {
      // Generate mock H2H data
      const mockH2H = this.generateMockH2H(homeTeam, awayTeam);
      
      await this.delay(150);
      
      return mockH2H;
    } catch (error) {
      console.error(`Error fetching H2H for ${homeTeam} vs ${awayTeam}:`, error);
      return this.generateMockH2H(homeTeam, awayTeam);
    }
  }

  private generateMockTeamStats(teamName: string): TeamStats {
    // Create consistent mock data based on team name hash
    const hash = this.simpleHash(teamName);
    
    return {
      position: (hash % 20) + 1,
      points: ((hash % 40) + 20),
      form: this.generateForm(hash),
      goalsFor: ((hash % 30) + 15),
      goalsAgainst: ((hash % 25) + 10),
      homeRecord: {
        wins: ((hash % 8) + 2),
        draws: ((hash % 5) + 1),
        losses: ((hash % 6) + 1)
      },
      awayRecord: {
        wins: ((hash % 6) + 1),
        draws: ((hash % 6) + 2),
        losses: ((hash % 7) + 2)
      }
    };
  }

  private generateMockH2H(homeTeam: string, awayTeam: string): H2HRecord {
    const combinedHash = this.simpleHash(homeTeam + awayTeam);
    
    const totalMeetings = (combinedHash % 15) + 5;
    const homeWins = Math.floor(totalMeetings * 0.4);
    const awayWins = Math.floor(totalMeetings * 0.3);
    const draws = totalMeetings - homeWins - awayWins;
    
    return {
      totalMeetings,
      homeWins,
      draws,
      awayWins,
      recentForm: this.generateRecentForm(combinedHash)
    };
  }

  private generateForm(hash: number): string {
    const outcomes = ['W', 'D', 'L'];
    let form = '';
    
    for (let i = 0; i < 5; i++) {
      const outcomeIndex = (hash + i) % 3;
      form += outcomes[outcomeIndex];
    }
    
    return form;
  }

  private generateRecentForm(hash: number): string[] {
    const outcomes = ['1', 'X', '2'];
    const form = [];
    
    for (let i = 0; i < 5; i++) {
      const outcomeIndex = (hash + i) % 3;
      form.push(outcomes[outcomeIndex]);
    }
    
    return form;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Future method to implement actual scraping
  async scrapeFlashscore(teamName: string): Promise<TeamStats | null> {
    // TODO: Implement Flashscore scraping
    // This would require handling anti-bot measures and rate limiting
    return null;
  }

  async scrapeSofascore(teamName: string): Promise<TeamStats | null> {
    // TODO: Implement Sofascore scraping
    // This would require handling their API endpoints
    return null;
  }

  async scrapeWhoScored(teamName: string): Promise<TeamStats | null> {
    // TODO: Implement WhoScored scraping
    // This would require handling their complex JavaScript loading
    return null;
  }
}

export const teamStatsScaper = new TeamStatsScaper();