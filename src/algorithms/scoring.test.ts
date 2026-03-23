import { describe, it, expect } from 'vitest';
import { isValidScore, isRoundComplete, processRoundScores } from './scoring';
import type { Player, Round } from '@/types/tournament';

function makePlayer(id: string, overrides?: Partial<Player>): Player {
  return {
    id,
    name: `Player ${id}`,
    gender: null,
    cumulative_points: 0,
    total_points_won: 0,
    total_points_conceded: 0,
    matches_played: 0,
    bench_count: 0,
    ...overrides,
  };
}

describe('isValidScore', () => {
  it('accepts valid scores that sum to points per match', () => {
    expect(isValidScore(12, 12, 24)).toBe(true);
    expect(isValidScore(20, 12, 32)).toBe(true);
    expect(isValidScore(0, 16, 16)).toBe(true);
    expect(isValidScore(16, 0, 16)).toBe(true);
  });

  it('rejects scores that do not sum correctly', () => {
    expect(isValidScore(10, 10, 24)).toBe(false);
    expect(isValidScore(15, 10, 24)).toBe(false);
  });

  it('rejects null scores', () => {
    expect(isValidScore(null, 12, 24)).toBe(false);
    expect(isValidScore(12, null, 24)).toBe(false);
  });

  it('rejects negative scores', () => {
    expect(isValidScore(-1, 25, 24)).toBe(false);
  });

  it('rejects non-integer scores', () => {
    expect(isValidScore(12.5, 11.5, 24)).toBe(false);
  });

  it('rejects both null', () => {
    expect(isValidScore(null, null, 24)).toBe(false);
  });

  it('accepts valid scores for all pointsPerMatch values', () => {
    expect(isValidScore(0, 16, 16)).toBe(true);
    expect(isValidScore(0, 24, 24)).toBe(true);
    expect(isValidScore(0, 32, 32)).toBe(true);
    expect(isValidScore(16, 0, 16)).toBe(true);
    expect(isValidScore(24, 0, 24)).toBe(true);
    expect(isValidScore(32, 0, 32)).toBe(true);
  });

  it('accepts equal split for all pointsPerMatch values', () => {
    expect(isValidScore(8, 8, 16)).toBe(true);
    expect(isValidScore(12, 12, 24)).toBe(true);
    expect(isValidScore(16, 16, 32)).toBe(true);
  });

  it('rejects off by one', () => {
    expect(isValidScore(13, 12, 24)).toBe(false); // sum=25
  });

  it('rejects negative both', () => {
    expect(isValidScore(-1, -1, 24)).toBe(false);
  });
});

describe('processRoundScores', () => {
  it('distributes points correctly for a single match', () => {
    const players = [makePlayer('a'), makePlayer('b'), makePlayer('c'), makePlayer('d')];
    const round: Round = {
      round_number: 1,
      matches: [{
        court_number: 1,
        team_a_player_ids: ['a', 'b'],
        team_b_player_ids: ['c', 'd'],
        team_a_score: 18,
        team_b_score: 14,
      }],
      benched_player_ids: [],
      bench_points: null,
    };

    const { updatedPlayers, benchPoints } = processRoundScores(players, round, 32);

    // Team A gets 18 each
    const playerA = updatedPlayers.find(p => p.id === 'a')!;
    expect(playerA.cumulative_points).toBe(18);
    expect(playerA.total_points_won).toBe(18);
    expect(playerA.total_points_conceded).toBe(14);
    expect(playerA.matches_played).toBe(1);

    // Team B gets 14 each
    const playerC = updatedPlayers.find(p => p.id === 'c')!;
    expect(playerC.cumulative_points).toBe(14);
    expect(playerC.total_points_won).toBe(14);
    expect(playerC.total_points_conceded).toBe(18);

    // No bench players, but bench points still calculated
    expect(benchPoints).toBe(16); // (18+18+14+14)/4 = 16
  });

  it('awards bench points correctly', () => {
    const players = [
      makePlayer('a'), makePlayer('b'), makePlayer('c'),
      makePlayer('d'), makePlayer('e'),
    ];
    const round: Round = {
      round_number: 1,
      matches: [{
        court_number: 1,
        team_a_player_ids: ['a', 'b'],
        team_b_player_ids: ['c', 'd'],
        team_a_score: 18,
        team_b_score: 14,
      }],
      benched_player_ids: ['e'],
      bench_points: null,
    };

    const { updatedPlayers, benchPoints } = processRoundScores(players, round, 32);

    // Bench points = average of active scores = (18+18+14+14)/4 = 16
    expect(benchPoints).toBe(16);

    const playerE = updatedPlayers.find(p => p.id === 'e')!;
    expect(playerE.cumulative_points).toBe(16);
    expect(playerE.matches_played).toBe(0);
    expect(playerE.bench_count).toBe(1);
  });

  it('handles two courts correctly', () => {
    const players = Array.from({ length: 8 }, (_, i) => makePlayer(`p${i}`));
    const round: Round = {
      round_number: 1,
      matches: [
        {
          court_number: 1,
          team_a_player_ids: ['p0', 'p1'],
          team_b_player_ids: ['p2', 'p3'],
          team_a_score: 18,
          team_b_score: 14,
        },
        {
          court_number: 2,
          team_a_player_ids: ['p4', 'p5'],
          team_b_player_ids: ['p6', 'p7'],
          team_a_score: 20,
          team_b_score: 12,
        },
      ],
      benched_player_ids: [],
      bench_points: null,
    };

    const { benchPoints } = processRoundScores(players, round, 32);
    // (18+18+14+14+20+20+12+12)/8 = 128/8 = 16
    expect(benchPoints).toBe(16);
  });

  it('handles shutout (0-32) correctly', () => {
    const players = [makePlayer('a'), makePlayer('b'), makePlayer('c'), makePlayer('d')];
    const round: Round = {
      round_number: 1,
      matches: [{
        court_number: 1,
        team_a_player_ids: ['a', 'b'],
        team_b_player_ids: ['c', 'd'],
        team_a_score: 0,
        team_b_score: 32,
      }],
      benched_player_ids: [],
      bench_points: null,
    };

    const { updatedPlayers } = processRoundScores(players, round, 32);

    expect(updatedPlayers.find(p => p.id === 'a')!.cumulative_points).toBe(0);
    expect(updatedPlayers.find(p => p.id === 'c')!.cumulative_points).toBe(32);
  });

  it('throws on incomplete round', () => {
    const players = [makePlayer('a'), makePlayer('b'), makePlayer('c'), makePlayer('d')];
    const round: Round = {
      round_number: 1,
      matches: [{
        court_number: 1,
        team_a_player_ids: ['a', 'b'],
        team_b_player_ids: ['c', 'd'],
        team_a_score: null,
        team_b_score: null,
      }],
      benched_player_ids: [],
      bench_points: null,
    };

    expect(() => processRoundScores(players, round, 32)).toThrow(Error);
  });

  it('accumulates points over multiple rounds', () => {
    const players = [makePlayer('a'), makePlayer('b'), makePlayer('c'), makePlayer('d')];

    // Round 1: a+b vs c+d, score 18-14
    const round1: Round = {
      round_number: 1,
      matches: [{
        court_number: 1,
        team_a_player_ids: ['a', 'b'],
        team_b_player_ids: ['c', 'd'],
        team_a_score: 18,
        team_b_score: 14,
      }],
      benched_player_ids: [],
      bench_points: null,
    };

    const { updatedPlayers: afterRound1 } = processRoundScores(players, round1, 32);

    // Round 2: a+c vs b+d, score 20-12
    const round2: Round = {
      round_number: 2,
      matches: [{
        court_number: 1,
        team_a_player_ids: ['a', 'c'],
        team_b_player_ids: ['b', 'd'],
        team_a_score: 20,
        team_b_score: 12,
      }],
      benched_player_ids: [],
      bench_points: null,
    };

    const { updatedPlayers: afterRound2 } = processRoundScores(afterRound1, round2, 32);

    const playerA = afterRound2.find(p => p.id === 'a')!;
    expect(playerA.cumulative_points).toBe(38); // 18 + 20

    const playerB = afterRound2.find(p => p.id === 'b')!;
    expect(playerB.cumulative_points).toBe(30); // 18 + 12
  });

  it('accumulates bench points across rounds', () => {
    const players = [
      makePlayer('a'), makePlayer('b'), makePlayer('c'),
      makePlayer('d'), makePlayer('e'),
    ];

    // Round 1: e is benched
    const round1: Round = {
      round_number: 1,
      matches: [{
        court_number: 1,
        team_a_player_ids: ['a', 'b'],
        team_b_player_ids: ['c', 'd'],
        team_a_score: 16,
        team_b_score: 16,
      }],
      benched_player_ids: ['e'],
      bench_points: null,
    };

    const { updatedPlayers: afterRound1 } = processRoundScores(players, round1, 32);

    // Bench points = (16+16+16+16)/4 = 16
    const playerEAfterR1 = afterRound1.find(p => p.id === 'e')!;
    expect(playerEAfterR1.cumulative_points).toBe(16);

    // Round 2: e is active, gets 20 points
    const round2: Round = {
      round_number: 2,
      matches: [{
        court_number: 1,
        team_a_player_ids: ['a', 'e'],
        team_b_player_ids: ['c', 'd'],
        team_a_score: 20,
        team_b_score: 12,
      }],
      benched_player_ids: ['b'],
      bench_points: null,
    };

    const { updatedPlayers: afterRound2 } = processRoundScores(afterRound1, round2, 32);

    const playerEAfterR2 = afterRound2.find(p => p.id === 'e')!;
    expect(playerEAfterR2.cumulative_points).toBe(36); // 16 + 20
  });

  it('handles multiple courts with bench players', () => {
    const players = Array.from({ length: 10 }, (_, i) => makePlayer(`p${i}`));
    const round: Round = {
      round_number: 1,
      matches: [
        {
          court_number: 1,
          team_a_player_ids: ['p0', 'p1'],
          team_b_player_ids: ['p2', 'p3'],
          team_a_score: 20,
          team_b_score: 12,
        },
        {
          court_number: 2,
          team_a_player_ids: ['p4', 'p5'],
          team_b_player_ids: ['p6', 'p7'],
          team_a_score: 18,
          team_b_score: 14,
        },
      ],
      benched_player_ids: ['p8', 'p9'],
      bench_points: null,
    };

    const { updatedPlayers, benchPoints } = processRoundScores(players, round, 32);

    // Average of 8 active scores: (20+20+12+12+18+18+14+14)/8 = 128/8 = 16
    expect(benchPoints).toBe(16);

    const p8 = updatedPlayers.find(p => p.id === 'p8')!;
    expect(p8.cumulative_points).toBe(16);
    expect(p8.bench_count).toBe(1);

    const p9 = updatedPlayers.find(p => p.id === 'p9')!;
    expect(p9.cumulative_points).toBe(16);
    expect(p9.bench_count).toBe(1);
  });

  it('returns player unchanged if not in match and not benched', () => {
    const players = [
      makePlayer('a'), makePlayer('b'), makePlayer('c'),
      makePlayer('d'), makePlayer('e'),
    ];
    const round: Round = {
      round_number: 1,
      matches: [{
        court_number: 1,
        team_a_player_ids: ['a', 'b'],
        team_b_player_ids: ['c', 'd'],
        team_a_score: 18,
        team_b_score: 14,
      }],
      benched_player_ids: [],
      bench_points: null,
    };

    const { updatedPlayers } = processRoundScores(players, round, 32);

    const playerE = updatedPlayers.find(p => p.id === 'e')!;
    expect(playerE.cumulative_points).toBe(0);
    expect(playerE.matches_played).toBe(0);
    expect(playerE.bench_count).toBe(0);
    expect(playerE.total_points_won).toBe(0);
    expect(playerE.total_points_conceded).toBe(0);
  });

  it('works with all points per match values', () => {
    for (const ppm of [16, 24, 32] as const) {
      const players = [makePlayer('a'), makePlayer('b'), makePlayer('c'), makePlayer('d')];
      const half = ppm / 2;
      const round: Round = {
        round_number: 1,
        matches: [{
          court_number: 1,
          team_a_player_ids: ['a', 'b'],
          team_b_player_ids: ['c', 'd'],
          team_a_score: half + 2,
          team_b_score: half - 2,
        }],
        benched_player_ids: [],
        bench_points: null,
      };

      const { updatedPlayers } = processRoundScores(players, round, ppm);

      const playerA = updatedPlayers.find(p => p.id === 'a')!;
      expect(playerA.cumulative_points).toBe(half + 2);

      const playerC = updatedPlayers.find(p => p.id === 'c')!;
      expect(playerC.cumulative_points).toBe(half - 2);
    }
  });
});

describe('isRoundComplete', () => {
  it('returns true for a complete round', () => {
    const matches = [
      {
        court_number: 1,
        team_a_player_ids: ['a', 'b'] as [string, string],
        team_b_player_ids: ['c', 'd'] as [string, string],
        team_a_score: 14,
        team_b_score: 10,
      },
      {
        court_number: 2,
        team_a_player_ids: ['e', 'f'] as [string, string],
        team_b_player_ids: ['g', 'h'] as [string, string],
        team_a_score: 18,
        team_b_score: 6,
      },
    ];

    expect(isRoundComplete(matches, 24)).toBe(true);
  });

  it('returns false for an incomplete round', () => {
    const matches = [
      {
        court_number: 1,
        team_a_player_ids: ['a', 'b'] as [string, string],
        team_b_player_ids: ['c', 'd'] as [string, string],
        team_a_score: 14,
        team_b_score: 10,
      },
      {
        court_number: 2,
        team_a_player_ids: ['e', 'f'] as [string, string],
        team_b_player_ids: ['g', 'h'] as [string, string],
        team_a_score: null,
        team_b_score: null,
      },
    ];

    expect(isRoundComplete(matches, 24)).toBe(false);
  });

  it('returns true for empty matches array', () => {
    expect(isRoundComplete([], 24)).toBe(true);
  });
});
