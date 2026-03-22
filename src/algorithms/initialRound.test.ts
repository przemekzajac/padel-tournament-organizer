import { describe, it, expect } from 'vitest';
import { generateInitialRound } from './initialRound';
import type { Player } from '@/types/tournament';

function makePlayers(
  count: number,
  gender: 'male' | 'female' | null = null,
): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    gender,
    cumulative_points: 0,
    total_points_won: 0,
    total_points_conceded: 0,
    matches_played: 0,
    bench_count: 0,
  }));
}

function makeMixedPlayers(maleCount: number, femaleCount: number): Player[] {
  return [
    ...Array.from({ length: maleCount }, (_, i) => ({
      id: `m${i + 1}`,
      name: `Male ${i + 1}`,
      gender: 'male' as const,
      cumulative_points: 0,
      total_points_won: 0,
      total_points_conceded: 0,
      matches_played: 0,
      bench_count: 0,
    })),
    ...Array.from({ length: femaleCount }, (_, i) => ({
      id: `f${i + 1}`,
      name: `Female ${i + 1}`,
      gender: 'female' as const,
      cumulative_points: 0,
      total_points_won: 0,
      total_points_conceded: 0,
      matches_played: 0,
      bench_count: 0,
    })),
  ];
}

describe('generateInitialRound', () => {
  it('creates correct number of matches for 8 players, 2 courts', () => {
    const players = makePlayers(8);
    const round = generateInitialRound(players, 2, 'americano');

    expect(round.round_number).toBe(1);
    expect(round.matches).toHaveLength(2);
    expect(round.benched_player_ids).toHaveLength(0);
    expect(round.bench_points).toBeNull();
  });

  it('benches correct number of players for 5 players, 1 court', () => {
    const players = makePlayers(5);
    const round = generateInitialRound(players, 1, 'americano');

    expect(round.matches).toHaveLength(1);
    expect(round.benched_player_ids).toHaveLength(1);

    // All active players should be in the match
    const allMatchPlayerIds = [
      ...round.matches[0].team_a_player_ids,
      ...round.matches[0].team_b_player_ids,
    ];
    expect(allMatchPlayerIds).toHaveLength(4);

    // Benched player should not be in the match
    const benchedId = round.benched_player_ids[0];
    expect(allMatchPlayerIds).not.toContain(benchedId);
  });

  it('assigns each player to exactly one match (no duplicates)', () => {
    const players = makePlayers(12);
    const round = generateInitialRound(players, 3, 'mexicano');

    const allIds = round.matches.flatMap((m) => [
      ...m.team_a_player_ids,
      ...m.team_b_player_ids,
    ]);
    expect(allIds).toHaveLength(12);
    expect(new Set(allIds).size).toBe(12);
  });

  it('creates mixed-gender teams for Mixicano', () => {
    const players = makeMixedPlayers(4, 4);
    const round = generateInitialRound(players, 2, 'mixicano');

    expect(round.matches).toHaveLength(2);

    for (const match of round.matches) {
      const teamAGenders = match.team_a_player_ids.map((id) => {
        const player = players.find((p) => p.id === id)!;
        return player.gender;
      });
      const teamBGenders = match.team_b_player_ids.map((id) => {
        const player = players.find((p) => p.id === id)!;
        return player.gender;
      });

      // Each team must have 1 male and 1 female
      expect(teamAGenders.sort()).toEqual(['female', 'male']);
      expect(teamBGenders.sort()).toEqual(['female', 'male']);
    }
  });

  it('benches equal M/F for Mixicano with 6 players (3M + 3F) on 1 court', () => {
    const players = makeMixedPlayers(3, 3);
    const round = generateInitialRound(players, 1, 'mixicano');

    expect(round.benched_player_ids).toHaveLength(2);

    const benchedGenders = round.benched_player_ids.map((id) => {
      const player = players.find((p) => p.id === id)!;
      return player.gender;
    });
    expect(benchedGenders.filter((g) => g === 'male')).toHaveLength(1);
    expect(benchedGenders.filter((g) => g === 'female')).toHaveLength(1);
  });

  it('handles exactly 4 players on 1 court (no benching)', () => {
    const players = makePlayers(4);
    const round = generateInitialRound(players, 1, 'americano');

    expect(round.matches).toHaveLength(1);
    expect(round.benched_player_ids).toHaveLength(0);
  });
});
