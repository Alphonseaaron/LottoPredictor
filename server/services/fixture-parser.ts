import type { SportPesaFixture } from '../scrapers/sportpesa-scraper';

export class FixtureParser {
  
  /**
   * Parse fixture list from user input
   */
  parseFixtureList(fixtureText: string): SportPesaFixture[] {
    const fixtures: SportPesaFixture[] = [];
    const lines = fixtureText.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const parsed = this.parseFixtureLine(line);
      if (parsed) {
        fixtures.push(parsed);
      }
    }
    
    return fixtures;
  }
  
  private parseFixtureLine(line: string): SportPesaFixture | null {
    // Remove leading numbers and whitespace
    const cleaned = line.replace(/^\d+\s*/, '').trim();
    
    // Split by common delimiters
    const delimiters = [' – ', ' - ', ' vs ', ' v ', ' VS ', ' V '];
    
    for (const delimiter of delimiters) {
      if (cleaned.includes(delimiter)) {
        const parts = cleaned.split(delimiter);
        if (parts.length >= 2) {
          const homeTeam = parts[0].trim();
          const awayTeam = parts[1].trim();
          
          if (homeTeam && awayTeam) {
            return {
              homeTeam,
              awayTeam,
              matchDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random time in next 7 days
              league: this.detectLeague(homeTeam, awayTeam),
              gameNumber: 0 // Will be set later
            };
          }
        }
      }
    }
    
    return null;
  }
  
  private detectLeague(homeTeam: string, awayTeam: string): string {
    const teamText = `${homeTeam} ${awayTeam}`.toLowerCase();
    
    // Czech teams
    if (teamText.includes('boleslav') || teamText.includes('liberec')) {
      return 'Czech First League';
    }
    
    // Romanian teams
    if (teamText.includes('constanta') || teamText.includes('galati') || teamText.includes('bucuresti') || teamText.includes('cluj')) {
      return 'Romanian Liga I';
    }
    
    // Estonian teams
    if (teamText.includes('kuressaare') || teamText.includes('parnu') || teamText.includes('vaprus')) {
      return 'Estonian Premium League';
    }
    
    // Belgian teams
    if (teamText.includes('saint-gilloise') || teamText.includes('brugge')) {
      return 'Belgian Pro League';
    }
    
    // Norwegian teams
    if (teamText.includes('hamkam') || teamText.includes('fredrikstad')) {
      return 'Norwegian Eliteserien';
    }
    
    // Mexican teams
    if (teamText.includes('pumas') || teamText.includes('pachuca') || teamText.includes('unam')) {
      return 'Liga MX';
    }
    
    // Ecuadorian teams
    if (teamText.includes('tecnico') || teamText.includes('universitario') || teamText.includes('macara')) {
      return 'Serie A Ecuador';
    }
    
    // Polish teams
    if (teamText.includes('radomiak') || teamText.includes('pogon') || teamText.includes('szczecin')) {
      return 'Polish Ekstraklasa';
    }
    
    // Peruvian teams
    if (teamText.includes('ayacucho') || teamText.includes('atletico') || teamText.includes('grau')) {
      return 'Peruvian Primera Division';
    }
    
    // Slovenian teams
    if (teamText.includes('maribor') || teamText.includes('celje')) {
      return 'Slovenian PrvaLiga';
    }
    
    // Argentine teams
    if (teamText.includes('almirante') || teamText.includes('mitre') || teamText.includes('guemes') || teamText.includes('gimnasia') || teamText.includes('defensores') || teamText.includes('belgrano')) {
      return 'Argentine Primera B';
    }
    
    // Brazilian teams
    if (teamText.includes('amazonas') || teamText.includes('botafogo') || teamText.includes('vitoria') || teamText.includes('bragantino')) {
      return 'Brazilian Serie A';
    }
    
    // Icelandic teams
    if (teamText.includes('vikingur') || teamText.includes('valur') || teamText.includes('reykjavik')) {
      return 'Icelandic Urvalsdeild';
    }
    
    return 'International League';
  }
}

export const fixtureParser = new FixtureParser();