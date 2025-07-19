import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PythonScrapingResult {
  source: string;
  data: any;
  confidence: number;
  timestamp: string;
}

export class PythonWebScraper {
  private pythonScriptsPath = path.join(process.cwd(), 'python_scrapers');

  async initializePythonEnvironment() {
    try {
      // Create python scrapers directory
      await fs.mkdir(this.pythonScriptsPath, { recursive: true });
      
      // Create requirements.txt for Python dependencies
      const requirements = `requests
beautifulsoup4
lxml
selenium
pandas
numpy
fake-useragent
cloudscraper
undetected-chromedriver
playwright
scrapy
feedparser
tweepy
praw
`;
      
      await fs.writeFile(path.join(this.pythonScriptsPath, 'requirements.txt'), requirements);
      
      console.log('🐍 Python scraping environment initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Python environment:', error);
      return false;
    }
  }

  async createAdvancedScraper() {
    const scraperScript = `#!/usr/bin/env python3
"""
Advanced Football Data Scraper
Uses multiple techniques to bypass anti-bot measures
"""

import requests
import json
import time
import random
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
import cloudscraper
import sys
import os

class AdvancedFootballScraper:
    def __init__(self):
        self.ua = UserAgent()
        self.session = requests.Session()
        self.scraper = cloudscraper.create_scraper()
        
    def get_random_headers(self):
        return {
            'User-Agent': self.ua.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'DNT': '1',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
        }
    
    def delay(self, min_delay=1, max_delay=3):
        time.sleep(random.uniform(min_delay, max_delay))
    
    def scrape_flashscore_odds(self, home_team, away_team):
        """Scrape betting odds from Flashscore"""
        try:
            search_url = f"https://www.flashscore.com/search/?q={home_team}+{away_team}"
            headers = self.get_random_headers()
            
            response = self.scraper.get(search_url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for odds data
            odds_data = {}
            
            # Multiple selectors for odds
            selectors = [
                '.odds_1', '.odds_x', '.odds_2',
                '[data-odd="1"]', '[data-odd="x"]', '[data-odd="2"]',
                '.home-odds', '.draw-odds', '.away-odds'
            ]
            
            for i, selector in enumerate(['1', 'x', '2']):
                odd_element = soup.select_one(f'[data-odd="{selector}"]')
                if odd_element:
                    odds_data[selector] = float(odd_element.get_text().strip())
            
            if odds_data:
                return {
                    'source': 'Flashscore',
                    'odds': odds_data,
                    'confidence': 90
                }
                
        except Exception as e:
            print(f"Flashscore error: {e}", file=sys.stderr)
            
        return None
    
    def scrape_soccerway_stats(self, home_team, away_team):
        """Scrape team statistics from Soccerway"""
        try:
            search_url = f"https://us.soccerway.com/search/?q={home_team}"
            headers = self.get_random_headers()
            
            response = self.session.get(search_url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract team statistics
            stats = {
                'home_team': self.extract_team_stats(soup, home_team),
                'away_team': None
            }
            
            # Search for away team
            self.delay()
            away_url = f"https://us.soccerway.com/search/?q={away_team}"
            response = self.session.get(away_url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            stats['away_team'] = self.extract_team_stats(soup, away_team)
            
            return {
                'source': 'Soccerway',
                'stats': stats,
                'confidence': 85
            }
            
        except Exception as e:
            print(f"Soccerway error: {e}", file=sys.stderr)
            
        return None
    
    def extract_team_stats(self, soup, team_name):
        """Extract team statistics from soup"""
        stats = {
            'position': None,
            'points': None,
            'goals_for': None,
            'goals_against': None,
            'form': 'WWDLD'  # Default form
        }
        
        # Look for league table data
        table_rows = soup.select('table tr')
        for row in table_rows:
            if team_name.lower() in row.get_text().lower():
                cells = row.select('td')
                if len(cells) >= 6:
                    stats['position'] = self.safe_int(cells[0].get_text())
                    stats['points'] = self.safe_int(cells[2].get_text())
                    stats['goals_for'] = self.safe_int(cells[4].get_text())
                    stats['goals_against'] = self.safe_int(cells[5].get_text())
                break
        
        return stats
    
    def safe_int(self, text):
        """Safely convert text to integer"""
        try:
            return int(''.join(filter(str.isdigit, text)))
        except:
            return None
    
    def scrape_betting_tips(self, home_team, away_team):
        """Scrape betting tips and predictions"""
        tips = []
        
        try:
            # Betting Expert
            url = f"https://www.bettingexpert.com/search?q={home_team}+vs+{away_team}"
            response = self.scraper.get(url, headers=self.get_random_headers(), timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            tip_elements = soup.select('.tip-content, .prediction-text, .expert-tip')
            for element in tip_elements:
                tip_text = element.get_text().strip()
                if len(tip_text) > 20:
                    tips.append({
                        'source': 'BettingExpert',
                        'tip': tip_text[:200],
                        'confidence': 75
                    })
            
            self.delay()
            
            # Tips180
            url2 = f"https://www.tips180.com/search/?q={home_team}+{away_team}"
            response2 = self.scraper.get(url2, headers=self.get_random_headers(), timeout=10)
            soup2 = BeautifulSoup(response2.content, 'html.parser')
            
            tip_elements2 = soup2.select('.prediction-tip, .match-tip')
            for element in tip_elements2:
                tip_text = element.get_text().strip()
                if len(tip_text) > 15:
                    tips.append({
                        'source': 'Tips180',
                        'tip': tip_text[:200],
                        'confidence': 70
                    })
                    
        except Exception as e:
            print(f"Betting tips error: {e}", file=sys.stderr)
        
        return tips
    
    def scrape_comprehensive_data(self, home_team, away_team):
        """Main method to scrape all available data"""
        results = {
            'match': f"{home_team} vs {away_team}",
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'data': {}
        }
        
        print(f"🔍 Scraping comprehensive data for {home_team} vs {away_team}")
        
        # Scrape odds
        odds_data = self.scrape_flashscore_odds(home_team, away_team)
        if odds_data:
            results['data']['odds'] = odds_data
            print(f"✅ Odds data collected")
        
        self.delay()
        
        # Scrape team stats
        stats_data = self.scrape_soccerway_stats(home_team, away_team)
        if stats_data:
            results['data']['stats'] = stats_data
            print(f"✅ Team stats collected")
        
        self.delay()
        
        # Scrape betting tips
        tips_data = self.scrape_betting_tips(home_team, away_team)
        if tips_data:
            results['data']['tips'] = tips_data
            print(f"✅ Betting tips collected ({len(tips_data)} tips)")
        
        # Calculate overall confidence
        confidences = []
        for key, data in results['data'].items():
            if isinstance(data, dict) and 'confidence' in data:
                confidences.append(data['confidence'])
            elif isinstance(data, list):
                confidences.extend([item.get('confidence', 50) for item in data])
        
        results['overall_confidence'] = sum(confidences) / len(confidences) if confidences else 50
        results['sources_count'] = len(results['data'])
        
        return results

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python scraper.py <home_team> <away_team>")
        sys.exit(1)
    
    home_team = sys.argv[1]
    away_team = sys.argv[2]
    
    scraper = AdvancedFootballScraper()
    
    try:
        data = scraper.scrape_comprehensive_data(home_team, away_team)
        print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
`;
    
    await fs.writeFile(path.join(this.pythonScriptsPath, 'advanced_scraper.py'), scraperScript);
    console.log('🐍 Advanced Python scraper created');
  }

  async runPythonScraper(homeTeam: string, awayTeam: string): Promise<PythonScrapingResult[]> {
    try {
      // Ensure Python environment is set up
      await this.initializePythonEnvironment();
      await this.createAdvancedScraper();
      
      const scriptPath = path.join(this.pythonScriptsPath, 'advanced_scraper.py');
      
      return new Promise((resolve, reject) => {
        console.log(`🐍 Running Python scraper for ${homeTeam} vs ${awayTeam}`);
        
        const python = spawn('python3', [scriptPath, homeTeam, awayTeam], {
          cwd: this.pythonScriptsPath
        });
        
        let stdout = '';
        let stderr = '';
        
        python.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        python.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        python.on('close', (code) => {
          if (code === 0) {
            try {
              const result = JSON.parse(stdout);
              console.log(`✅ Python scraper completed with ${result.sources_count} sources`);
              console.log(`🎯 Overall confidence: ${result.overall_confidence}%`);
              
              resolve([{
                source: 'Python Advanced Scraper',
                data: result,
                confidence: result.overall_confidence,
                timestamp: result.timestamp
              }]);
            } catch (error) {
              console.log('⚠️ Python scraper completed but output parsing failed');
              resolve([]);
            }
          } else {
            console.log('⚠️ Python scraper failed, continuing with JS scrapers');
            resolve([]);
          }
        });
        
        python.on('error', (err) => {
          console.log('⚠️ Python not available, using JavaScript scrapers only');
          resolve([]);
        });
      });
    } catch (error) {
      console.log('⚠️ Python scraper setup failed, using fallback');
      return [];
    }
  }
}

export const pythonWebScraper = new PythonWebScraper();