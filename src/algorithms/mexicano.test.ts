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

  it('ranking affects grouping: top 4 on court 1, bottom 4 on court 2', () => {
    const players: Player[] = Array.from({ length: 8 }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Player ${i + 1}`,
      gender: null,
      cumulative_points: (8 - i) * 10, // p1=80, p2=70, ..., p8=10
      total_points_won: (8 - i) * 10,
      total_points_conceded: 0,
      matches_played: 2,
      bench_count: 0,
    }));

    const round = generateMexicanoRound(players, 2, 1);

    const court1Ids = [
      ...round.matches[0].team_a_player_ids,
      ...round.matches[0].team_b_player_ids,
    ].sort();
    const court2Ids = [
      ...round.matches[1].team_a_player_ids,
      ...round.matches[1].team_b_player_ids,
    ].sort();

    expect(court1Ids).toEqual(['p1', 'p2', 'p3', 'p4']);
    expect(court2Ids).toEqual(['p5', 'p6', 'p7', 'p8']);
  });

  it('benches the player with the lowest bench_count', () => {
    // 8 players with bench_count=1, 1 player (p9) with bench_count=0
    const players: Player[] = Array.from({ length: 9 }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Player ${i + 1}`,
      gender: null,
      cumulative_points: (9 - i) * 10,
      total_points_won: (9 - i) * 10,
      total_points_conceded: 0,
      matches_played: 2,
      bench_count: i < 8 ? 1 : 0, // p9 has bench_count=0
    }));

    const round = generateMexicanoRound(players, 2, 1);

    expect(round.benched_player_ids).toHaveLength(1);
    expect(round.benched_player_ids[0]).toBe('p9');
  });

  it('produces valid round when all players are tied at 0 points', () => {
    const players: Player[] = Array.from({ length: 8 }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Player ${i + 1}`,
      gender: null,
      cumulative_points: 0,
      total_points_won: 0,
      total_points_conceded: 0,
      matches_played: 0,
      bench_count: 0,
    }));

    const round = generateMexicanoRound(players, 2, 1);

    expect(round.matches).toHaveLength(2);
    expect(round.benched_player_ids).toHaveLength(0);

    const allIds = round.matches.flatMap(m => [
      ...m.team_a_player_ids,
      ...m.team_b_player_ids,
    ]);
    expect(new Set(allIds).size).toBe(8);
  });

  it('handles minimum players: 4 players, 1 court', () => {
    const players = makeRankedPlayers(4);
    const round = generateMexicanoRound(players, 1, 1);

    expect(round.matches).toHaveLength(1);
    expect(round.benched_player_ids).toHaveLength(0);

    const match = round.matches[0];
    expect(match.team_a_player_ids).toHaveLength(2);
    expect(match.team_b_player_ids).toHaveLength(2);

    // #1+#3 vs #2+#4
    expect(match.team_a_player_ids).toEqual(['p1', 'p3']);
    expect(match.team_b_player_ids).toEqual(['p2', 'p4']);
  });

  it('handles large tournament: 32 players, 8 courts', () => {
    const players = makeRankedPlayers(32);
    const round = generateMexicanoRound(players, 8, 1);

    expect(round.matches).toHaveLength(8);
    expect(round.benched_player_ids).toHaveLength(0);

    const allIds = round.matches.flatMap(m => [
      ...m.team_a_player_ids,
      ...m.team_b_player_ids,
    ]);
    expect(new Set(allIds).size).toBe(32);
  });

  it('uses differential as tiebreak for players with same cumulative_points', () => {
    // 8 players in 4 pairs with same points but different differentials
    const players: Player[] = [
      { id: 'p1', name: 'P1', gender: null, cumulative_points: 50, total_points_won: 60, total_points_conceded: 10, matches_played: 2, bench_count: 0 }, // diff=50
      { id: 'p2', name: 'P2', gender: null, cumulative_points: 50, total_points_won: 55, total_points_conceded: 10, matches_played: 2, bench_count: 0 }, // diff=45
      { id: 'p3', name: 'P3', gender: null, cumulative_points: 40, total_points_won: 50, total_points_conceded: 10, matches_played: 2, bench_count: 0 }, // diff=40
      { id: 'p4', name: 'P4', gender: null, cumulative_points: 40, total_points_won: 45, total_points_conceded: 10, matches_played: 2, bench_count: 0 }, // diff=35
      { id: 'p5', name: 'P5', gender: null, cumulative_points: 30, total_points_won: 40, total_points_conceded: 10, matches_played: 2, bench_count: 0 }, // diff=30
      { id: 'p6', name: 'P6', gender: null, cumulative_points: 30, total_points_won: 35, total_points_conceded: 10, matches_played: 2, bench_count: 0 }, // diff=25
      { id: 'p7', name: 'P7', gender: null, cumulative_points: 20, total_points_won: 30, total_points_conceded: 10, matches_played: 2, bench_count: 0 }, // diff=20
      { id: 'p8', name: 'P8', gender: null, cumulative_points: 20, total_points_won: 25, total_points_conceded: 10, matches_played: 2, bench_count: 0 }, // diff=15
    ];

    const round = generateMexicanoRound(players, 2, 1);

    // Court 1 should get the top 4 by ranking: p1 (50pts/diff50), p2 (50pts/diff45), p3 (40pts/diff40), p4 (40pts/diff35)
    const court1Ids = [
      ...round.matches[0].team_a_player_ids,
      ...round.matches[0].team_b_player_ids,
    ].sort();
    expect(court1Ids).toEqual(['p1', 'p2', 'p3', 'p4']);

    // Within court 1: #1+#3 vs #2+#4 → p1+p3 vs p2+p4
    expect(round.matches[0].team_a_player_ids).toEqual(['p1', 'p3']);
    expect(round.matches[0].team_b_player_ids).toEqual(['p2', 'p4']);
  });

  it('multi-round scoring simulation: round 2 pairings reflect round 1 results', () => {
    // Simulate after round 1: players have varying points
    const players: Player[] = [
      { id: 'p1', name: 'P1', gender: null, cumulative_points: 24, total_points_won: 24, total_points_conceded: 16, matches_played: 1, bench_count: 0 },
      { id: 'p2', name: 'P2', gender: null, cumulative_points: 24, total_points_won: 24, total_points_conceded: 16, matches_played: 1, bench_count: 0 },
      { id: 'p3', name: 'P3', gender: null, cumulative_points: 20, total_points_won: 20, total_points_conceded: 20, matches_played: 1, bench_count: 0 },
      { id: 'p4', name: 'P4', gender: null, cumulative_points: 20, total_points_won: 20, total_points_conceded: 20, matches_played: 1, bench_count: 0 },
      { id: 'p5', name: 'P5', gender: null, cumulative_points: 16, total_points_won: 16, total_points_conceded: 24, matches_played: 1, bench_count: 0 },
      { id: 'p6', name: 'P6', gender: null, cumulative_points: 16, total_points_won: 16, total_points_conceded: 24, matches_played: 1, bench_count: 0 },
      { id: 'p7', name: 'P7', gender: null, cumulative_points: 12, total_points_won: 12, total_points_conceded: 28, matches_played: 1, bench_count: 0 },
      { id: 'p8', name: 'P8', gender: null, cumulative_points: 12, total_points_won: 12, total_points_conceded: 28, matches_played: 1, bench_count: 0 },
    ];

    const round = generateMexicanoRound(players, 2, 2);

    expect(round.round_number).toBe(2);

    // Top 4 (p1, p2, p3, p4) on court 1
    const court1Ids = [
      ...round.matches[0].team_a_player_ids,
      ...round.matches[0].team_b_player_ids,
    ].sort();
    expect(court1Ids).toEqual(['p1', 'p2', 'p3', 'p4']);

    // Bottom 4 (p5, p6, p7, p8) on court 2
    const court2Ids = [
      ...round.matches[1].team_a_player_ids,
      ...round.matches[1].team_b_player_ids,
    ].sort();
    expect(court2Ids).toEqual(['p5', 'p6', 'p7', 'p8']);
  });

  it('all scores are null in generated round', () => {
    const players = makeRankedPlayers(8);
    const round = generateMexicanoRound(players, 2, 1);

    for (const match of round.matches) {
      expect(match.team_a_score).toBeNull();
      expect(match.team_b_score).toBeNull();
    }
  });

  it('bench rotation fairness: does not bench player with highest bench_count', () => {
    // 5 players, 1 court → 1 benched
    // p1-p4 have bench_count=0, p5 has bench_count=2
    const players: Player[] = [
      { id: 'p1', name: 'P1', gender: null, cumulative_points: 50, total_points_won: 50, total_points_conceded: 10, matches_played: 3, bench_count: 0 },
      { id: 'p2', name: 'P2', gender: null, cumulative_points: 40, total_points_won: 40, total_points_conceded: 20, matches_played: 3, bench_count: 0 },
      { id: 'p3', name: 'P3', gender: null, cumulative_points: 30, total_points_won: 30, total_points_conceded: 30, matches_played: 3, bench_count: 0 },
      { id: 'p4', name: 'P4', gender: null, cumulative_points: 20, total_points_won: 20, total_points_conceded: 40, matches_played: 3, bench_count: 0 },
      { id: 'p5', name: 'P5', gender: null, cumulative_points: 10, total_points_won: 10, total_points_conceded: 50, matches_played: 3, bench_count: 2 },
    ];

    const round = generateMexicanoRound(players, 1, 1);

    expect(round.benched_player_ids).toHaveLength(1);
    // The benched player should have the lowest bench_count (0), not p5 (bench_count=2)
    const benchedId = round.benched_player_ids[0];
    const benchedPlayer = players.find(p => p.id === benchedId)!;
    expect(benchedPlayer.bench_count).toBe(0);
    expect(benchedId).not.toBe('p5');
  });
});
