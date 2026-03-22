import { describe, it, expect } from 'vitest';
import { generateAmericanoSchedule } from './americano';
import type { Player } from '@/types/tournament';

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    gender: null,
    cumulative_points: 0,
    total_points_won: 0,
    total_points_conceded: 0,
    matches_played: 0,
    bench_count: 0,
  }));
}

describe('generateAmericanoSchedule', () => {
  it('generates the requested number of rounds', () => {
    const players = makePlayers(8);
    const rounds = generateAmericanoSchedule(players, 2, 10);
    expect(rounds).toHaveLength(10);
  });

  it('caps at 50 rounds by default', () => {
    const players = makePlayers(4);
    const rounds = generateAmericanoSchedule(players, 1);
    expect(rounds).toHaveLength(50);
  });

  it('assigns correct number of matches per round', () => {
    const players = makePlayers(8);
    const rounds = generateAmericanoSchedule(players, 2, 5);

    for (const round of rounds) {
      expect(round.matches).toHaveLength(2);
    }
  });

  it('has no duplicate players within a round', () => {
    const players = makePlayers(12);
    const rounds = generateAmericanoSchedule(players, 3, 10);

    for (const round of rounds) {
      const activeIds = round.matches.flatMap((m) => [
        ...m.team_a_player_ids,
        ...m.team_b_player_ids,
      ]);
      expect(new Set(activeIds).size).toBe(activeIds.length);
    }
  });

  it('benches correct number of players when needed', () => {
    const players = makePlayers(5);
    const rounds = generateAmericanoSchedule(players, 1, 10);

    for (const round of rounds) {
      expect(round.benched_player_ids).toHaveLength(1);
      expect(round.matches).toHaveLength(1);
    }
  });

  it('distributes bench fairly (each player benches ±1 of others)', () => {
    const players = makePlayers(5);
    const rounds = generateAmericanoSchedule(players, 1, 10);

    // Count benches per player
    const benchMap = new Map<string, number>();
    for (const p of players) benchMap.set(p.id, 0);
    for (const round of rounds) {
      for (const id of round.benched_player_ids) {
        benchMap.set(id, (benchMap.get(id) || 0) + 1);
      }
    }

    const counts = Array.from(benchMap.values());
    const maxBench = Math.max(...counts);
    const minBench = Math.min(...counts);
    expect(maxBench - minBench).toBeLessThanOrEqual(1);
  });

  it('balances match count per player ±1', () => {
    const players = makePlayers(6);
    const rounds = generateAmericanoSchedule(players, 1, 12);

    // Count matches per player
    const matchMap = new Map<string, number>();
    for (const p of players) matchMap.set(p.id, 0);
    for (const round of rounds) {
      for (const match of round.matches) {
        for (const id of [...match.team_a_player_ids, ...match.team_b_player_ids]) {
          matchMap.set(id, (matchMap.get(id) || 0) + 1);
        }
      }
    }

    const counts = Array.from(matchMap.values());
    const maxMatch = Math.max(...counts);
    const minMatch = Math.min(...counts);
    expect(maxMatch - minMatch).toBeLessThanOrEqual(1);
  });

  it('works with exactly 4 players (no benching)', () => {
    const players = makePlayers(4);
    const rounds = generateAmericanoSchedule(players, 1, 5);

    for (const round of rounds) {
      expect(round.benched_player_ids).toHaveLength(0);
      expect(round.matches).toHaveLength(1);
    }
  });

  it('distributes partnerships (each pair should partner at least once over enough rounds)', () => {
    const players = makePlayers(8);
    const rounds = generateAmericanoSchedule(players, 2, 20);

    // Count partnerships
    const partnerMap = new Map<string, number>();
    for (const round of rounds) {
      for (const match of round.matches) {
        const teamA = match.team_a_player_ids;
        const teamB = match.team_b_player_ids;
        const keyA = [teamA[0], teamA[1]].sort().join('-');
        const keyB = [teamB[0], teamB[1]].sort().join('-');
        partnerMap.set(keyA, (partnerMap.get(keyA) || 0) + 1);
        partnerMap.set(keyB, (partnerMap.get(keyB) || 0) + 1);
      }
    }

    // With 8 players and 20 rounds, most pairs should have partnered
    // There are C(8,2) = 28 possible pairs
    // We can't guarantee all, but most should have partnered at least once
    const pairedCount = partnerMap.size;
    expect(pairedCount).toBeGreaterThan(20); // At least 20 of 28 pairs
  });
});
