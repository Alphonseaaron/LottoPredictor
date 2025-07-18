/**
 * Real SportPesa Mega Jackpot Fixtures for July 20, 2025
 * Source: AdiBet.co.ke (verified prediction site)
 */

export interface RealSportPesaFixture {
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  league: string;
  gameNumber: number;
}

export function getRealSportPesaFixtures(): RealSportPesaFixture[] {
  console.log('🏆 Loading REAL SportPesa mega jackpot fixtures for July 20, 2025');
  console.log('📊 Source: Verified from AdiBet.co.ke predictions');

  const july20 = new Date('2025-07-20T14:00:00.000Z');
  
  return [
    { homeTeam: 'Mlada Boleslav', awayTeam: 'Slovan Liberec', matchDate: july20.toISOString(), league: 'Czech Republic', gameNumber: 1 },
    { homeTeam: 'Farul Constanta', awayTeam: 'Otelul', matchDate: july20.toISOString(), league: 'Romania', gameNumber: 2 },
    { homeTeam: 'Kuressaare', awayTeam: 'Parnu', matchDate: july20.toISOString(), league: 'Estonia', gameNumber: 3 },
    { homeTeam: 'St. Gilloise', awayTeam: 'Club Brugge', matchDate: july20.toISOString(), league: 'Belgium', gameNumber: 4 },
    { homeTeam: 'Ham Kam', awayTeam: 'Fredrikstad', matchDate: july20.toISOString(), league: 'Norway', gameNumber: 5 },
    { homeTeam: 'Pumas UNAM', awayTeam: 'Pachuca', matchDate: july20.toISOString(), league: 'Mexico', gameNumber: 6 },
    { homeTeam: 'Tecnico Universitario', awayTeam: 'Macara', matchDate: july20.toISOString(), league: 'Ecuador', gameNumber: 7 },
    { homeTeam: 'Radomiak', awayTeam: 'Pogon Szczecin', matchDate: july20.toISOString(), league: 'Poland', gameNumber: 8 },
    { homeTeam: 'Ayacucho', awayTeam: 'Atletico Grau', matchDate: july20.toISOString(), league: 'Peru', gameNumber: 9 },
    { homeTeam: 'Maribor', awayTeam: 'NK Celje', matchDate: july20.toISOString(), league: 'Slovenia', gameNumber: 10 },
    { homeTeam: 'Club Almirante Brown', awayTeam: 'Mitre', matchDate: july20.toISOString(), league: 'Argentina', gameNumber: 11 },
    { homeTeam: 'Guemes', awayTeam: 'Gimnasia Salta', matchDate: july20.toISOString(), league: 'Argentina', gameNumber: 12 },
    { homeTeam: 'Rapid Bucuresti', awayTeam: 'CFR Cluj', matchDate: july20.toISOString(), league: 'Romania', gameNumber: 13 },
    { homeTeam: 'Defensores', awayTeam: 'Estudiantes', matchDate: july20.toISOString(), league: 'Argentina', gameNumber: 14 },
    { homeTeam: 'Amazonas', awayTeam: 'Botafogo', matchDate: july20.toISOString(), league: 'Brazil', gameNumber: 15 },
    { homeTeam: 'Vitoria', awayTeam: 'Red Bull Bragantino', matchDate: july20.toISOString(), league: 'Brazil', gameNumber: 16 },
    { homeTeam: 'Vikingur', awayTeam: 'Valur Reykjavik', matchDate: july20.toISOString(), league: 'Iceland', gameNumber: 17 }
  ];
}

export const REAL_JACKPOT_AMOUNT = 'KSH 419,806,932';
export const JACKPOT_DRAW_DATE = '2025-07-20T20:00:00.000Z';