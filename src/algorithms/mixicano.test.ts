import { describe, it, expect } from 'vitest';
import { generateMixicanoRound } from './mixicano';
import type { Player } from '@/types/tournament';

function makeMixedPlayers(
  maleCount: number,
  femaleCount: number,
  pointsFn?: (i: number, gender: string) => number,
): Player[] {
  return [
    ...Array.from({ length: maleCount }, (_, i) => ({
      id: `m${i + 1}`,
      name: `Male ${i + 1}`,
      gender: 'male' as const,
      cumulative_points: pointsFn ? pointsFn(i, 'male') : 0,
      total_points_won: pointsFn ? pointsFn(i, 'male') : 0,
      total_points_conceded: 0,
      matches_played: pointsFn ? 1 : 0,
      bench_count: 0,
    })),
    ...Array.from({ length: femaleCount }, (_, i) => ({
      id: `f${i + 1}`,
      name: `Female ${i + 1}`,
      gender: 'female' as const,
      cumulative_points: pointsFn ? pointsFn(i, 'female') : 0,
      total_points_won: pointsFn ? pointsFn(i, 'female') : 0,
      total_points_conceded: 0,
      matches_played: pointsFn ? 1 : 0,
      bench_count: 0,
    })),
  ];
}

describe('generateMixicanoRound', () => {
  it('generates 2 matches with mixed teams for 4M+4F, 2 courts', () => {
    const players = makeMixedPlayers(4, 4);
    const round = generateMixicanoRound(players, 2, 1);

    expect(round.matches).toHaveLength(2);

    for (const match of round.matches) {
      const teamAGenders = match.team_a_player_ids.map((id) =>
        id.startsWith('m') ? 'male' : 'female',
      );
      const teamBGenders = match.team_b_player_ids.map((id) =>
        id.startsWith('m') ? 'male' : 'female',
      );

      // Each team should have 1 male and 1 female
      expect(teamAGenders.sort()).toEqual(['female', 'male']);
      expect(teamBGenders.sort()).toEqual(['female', 'male']);
    }
  });

  it('cross-pairs: M1+W2 vs M2+W1 within each court group', () => {
    // Give distinct points so ranking is deterministic
    const players = makeMixedPlayers(4, 4, (i) => (4 - i) * 10);
    const round = generateMixicanoRound(players, 2, 1);

    // Court 1 gets top 2 men (m1=40, m2=30) and top 2 women (f1=40, f2=30)
    // Cross-pair: M#1 + W#2 vs M#2 + W#1
    const court1 = round.matches.find((m) => m.court_number === 1)!;
    expect(court1).toBeDefined();

    // Team A = [M#1, W#2], Team B = [M#2, W#1]
    expect(court1.team_a_player_ids).toContain('m1');
    expect(court1.team_a_player_ids).toContain('f2');
    expect(court1.team_b_player_ids).toContain('m2');
    expect(court1.team_b_player_ids).toContain('f1');
  });

  it('places higher-ranked players on court 1', () => {
    const players = makeMixedPlayers(4, 4, (i) => (4 - i) * 10);
    const round = generateMixicanoRound(players, 2, 1);

    const court1 = round.matches.find((m) => m.court_number === 1)!;
    const court2 = round.matches.find((m) => m.court_number === 2)!;

    const court1Ids = [
      ...court1.team_a_player_ids,
      ...court1.team_b_player_ids,
    ];
    const court2Ids = [
      ...court2.team_a_player_ids,
      ...court2.team_b_player_ids,
    ];

    // Top ranked men (m1, m2) should be on court 1
    expect(court1Ids).toContain('m1');
    expect(court1Ids).toContain('m2');
    // Lower ranked men (m3, m4) should be on court 2
    expect(court2Ids).toContain('m3');
    expect(court2Ids).toContain('m4');
  });

  it('does not bench when exact fit: 4M+4F, 2 courts', () => {
    const players = makeMixedPlayers(4, 4);
    const round = generateMixicanoRound(players, 2, 1);
    expect(round.benched_player_ids).toEqual([]);
  });

  it('benches 4 players (2M+2F) with 6M+6F, 2 courts', () => {
    const players = makeMixedPlayers(6, 6);
    const round = generateMixicanoRound(players, 2, 1);

    expect(round.benched_player_ids).toHaveLength(4);
    expect(round.matches).toHaveLength(2);

    const benchedMales = round.benched_player_ids.filter((id) =>
      id.startsWith('m'),
    );
    const benchedFemales = round.benched_player_ids.filter((id) =>
      id.startsWith('f'),
    );
    expect(benchedMales).toHaveLength(2);
    expect(benchedFemales).toHaveLength(2);
  });

  it('generates 1 match with 0 benched for minimum 2M+2F, 1 court', () => {
    const players = makeMixedPlayers(2, 2);
    const round = generateMixicanoRound(players, 1, 1);
    expect(round.matches).toHaveLength(1);
    expect(round.benched_player_ids).toEqual([]);
  });

  it('produces valid mixed teams when all players are tied at 0 points', () => {
    const players = makeMixedPlayers(4, 4);
    const round = generateMixicanoRound(players, 2, 1);

    expect(round.matches).toHaveLength(2);
    for (const match of round.matches) {
      const allIds = [...match.team_a_player_ids, ...match.team_b_player_ids];
      const males = allIds.filter((id) => id.startsWith('m'));
      const females = allIds.filter((id) => id.startsWith('f'));
      expect(males).toHaveLength(2);
      expect(females).toHaveLength(2);
    }
  });

  it('handles large tournament: 8M+8F, 4 courts → 4 matches, 0 benched, all mixed', () => {
    const players = makeMixedPlayers(8, 8);
    const round = generateMixicanoRound(players, 4, 1);

    expect(round.matches).toHaveLength(4);
    expect(round.benched_player_ids).toEqual([]);

    for (const match of round.matches) {
      const teamAGenders = match.team_a_player_ids.map((id) =>
        id.startsWith('m') ? 'male' : 'female',
      );
      const teamBGenders = match.team_b_player_ids.map((id) =>
        id.startsWith('m') ? 'male' : 'female',
      );
      expect(teamAGenders.sort()).toEqual(['female', 'male']);
      expect(teamBGenders.sort()).toEqual(['female', 'male']);
    }
  });

  it('passes through round number correctly', () => {
    const players = makeMixedPlayers(4, 4);
    const round = generateMixicanoRound(players, 2, 5);
    expect(round.round_number).toBe(5);
  });

  it('initializes all scores to null', () => {
    const players = makeMixedPlayers(4, 4);
    const round = generateMixicanoRound(players, 2, 1);

    expect(round.bench_points).toBeNull();
    for (const match of round.matches) {
      expect(match.team_a_score).toBeNull();
      expect(match.team_b_score).toBeNull();
    }
  });
});
