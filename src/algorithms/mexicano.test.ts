import { describe, it, expect } from 'vitest';
import { generateMexicanoRound } from './mexicano';
import type { Player } from '@/types/tournament';

function makeRankedPlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    gender: null,
    cumulative_points: (count - i) * 10, // Descending points
    total_points_won: (count - i) * 10,
    total_points_conceded: i * 5,
    matches_played: 2,
    bench_count: 0,
  }));
}

describe('generateMexicanoRound', () => {
  it('creates correct pairings: #1+#3 vs #2+#4 within groups', () => {
    const players = makeRankedPlayers(8);
    const round = generateMexicanoRound(players, 2, 2);

    expect(round.matches).toHaveLength(2);
    expect(round.round_number).toBe(2);
    expect(round.benched_player_ids).toHaveLength(0);

    // Court 1: top 4 players (p1, p2, p3, p4)
    // Team A: #1 + #3 = p1, p3
    // Team B: #2 + #4 = p2, p4
    const court1 = round.matches[0];
    expect(court1.court_number).toBe(1);
    expect(court1.team_a_player_ids).toEqual(['p1', 'p3']);
    expect(court1.team_b_player_ids).toEqual(['p2', 'p4']);

    // Court 2: next 4 (p5, p6, p7, p8)
    const court2 = round.matches[1];
    expect(court2.team_a_player_ids).toEqual(['p5', 'p7']);
    expect(court2.team_b_player_ids).toEqual(['p6', 'p8']);
  });

  it('benches players correctly for 9 players on 2 courts', () => {
    const players = makeRankedPlayers(9);
    const round = generateMexicanoRound(players, 2, 3);

    expect(round.matches).toHaveLength(2);
    expect(round.benched_player_ids).toHaveLength(1);

    // All active players should be in matches
    const matchPlayerIds = round.matches.flatMap(m => [
      ...m.team_a_player_ids,
      ...m.team_b_player_ids,
    ]);
    expect(matchPlayerIds).toHaveLength(8);
    expect(new Set(matchPlayerIds).size).toBe(8);

    // Benched player should not be in matches
    expect(matchPlayerIds).not.toContain(round.benched_player_ids[0]);
  });

  it('assigns no duplicates across matches', () => {
    const players = makeRankedPlayers(12);
    const round = generateMexicanoRound(players, 3, 2);

    const allIds = round.matches.flatMap(m => [
      ...m.team_a_player_ids,
      ...m.team_b_player_ids,
    ]);
    expect(new Set(allIds).size).toBe(12);
  });
});
