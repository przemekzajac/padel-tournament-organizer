import { describe, it, expect } from 'vitest';
import { selectBenchPlayers, calculateBenchPoints } from './bench';
import type { Player } from '@/types/tournament';

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

describe('selectBenchPlayers', () => {
  it('returns empty array when no benching needed (8 players, 2 courts)', () => {
    const players = Array.from({ length: 8 }, (_, i) => makePlayer(`p${i + 1}`));
    const result = selectBenchPlayers(players, 2, 'americano');
    expect(result).toEqual([]);
  });

  it('benches 1 player when 9 players and 2 courts', () => {
    const players = Array.from({ length: 9 }, (_, i) => makePlayer(`p${i + 1}`));
    const result = selectBenchPlayers(players, 2, 'americano');
    expect(result).toHaveLength(1);
    expect(players.map((p) => p.id)).toContain(result[0]);
  });

  it('selects players with the lowest bench_count first', () => {
    const players = [
      makePlayer('p1', { bench_count: 3 }),
      makePlayer('p2', { bench_count: 0 }),
      makePlayer('p3', { bench_count: 1 }),
      makePlayer('p4', { bench_count: 2 }),
      makePlayer('p5', { bench_count: 0 }),
      makePlayer('p6', { bench_count: 1 }),
      makePlayer('p7', { bench_count: 4 }),
      makePlayer('p8', { bench_count: 2 }),
      makePlayer('p9', { bench_count: 5 }),
    ];
    // 9 players, 2 courts = 1 benched; should be p2 or p5 (bench_count 0)
    const result = selectBenchPlayers(players, 2, 'americano');
    expect(result).toHaveLength(1);
    expect(['p2', 'p5']).toContain(result[0]);
  });

  it('returns correct count when all players have the same bench_count', () => {
    const players = Array.from({ length: 9 }, (_, i) =>
      makePlayer(`p${i + 1}`, { bench_count: 2 }),
    );
    const result = selectBenchPlayers(players, 2, 'americano');
    expect(result).toHaveLength(1);
  });

  it('benches 4 players when 12 players and 2 courts', () => {
    const players = Array.from({ length: 12 }, (_, i) => makePlayer(`p${i + 1}`));
    const result = selectBenchPlayers(players, 2, 'americano');
    expect(result).toHaveLength(4);
    // All IDs should be unique
    expect(new Set(result).size).toBe(4);
  });

  it('benches equal men and women in mixicano (6M+6F, 2 courts → 2M+2F)', () => {
    const men = Array.from({ length: 6 }, (_, i) =>
      makePlayer(`m${i + 1}`, { gender: 'male' }),
    );
    const women = Array.from({ length: 6 }, (_, i) =>
      makePlayer(`f${i + 1}`, { gender: 'female' }),
    );
    const players = [...men, ...women];
    const result = selectBenchPlayers(players, 2, 'mixicano');
    expect(result).toHaveLength(4);

    const benchedMen = result.filter((id) => id.startsWith('m'));
    const benchedWomen = result.filter((id) => id.startsWith('f'));
    expect(benchedMen).toHaveLength(2);
    expect(benchedWomen).toHaveLength(2);
  });

  it('mixicano benched genders are correct male/female players', () => {
    const men = Array.from({ length: 6 }, (_, i) =>
      makePlayer(`m${i + 1}`, { gender: 'male' }),
    );
    const women = Array.from({ length: 6 }, (_, i) =>
      makePlayer(`f${i + 1}`, { gender: 'female' }),
    );
    const players = [...men, ...women];
    const result = selectBenchPlayers(players, 2, 'mixicano');

    const maleIds = men.map((p) => p.id);
    const femaleIds = women.map((p) => p.id);

    for (const id of result) {
      expect(maleIds.includes(id) || femaleIds.includes(id)).toBe(true);
    }
  });

  it('all benched player IDs are valid player IDs', () => {
    const players = Array.from({ length: 10 }, (_, i) => makePlayer(`p${i + 1}`));
    const result = selectBenchPlayers(players, 2, 'americano');
    const validIds = new Set(players.map((p) => p.id));
    for (const id of result) {
      expect(validIds.has(id)).toBe(true);
    }
  });

  it('large tournament: 20 players, 4 courts → 4 benched', () => {
    const players = Array.from({ length: 20 }, (_, i) => makePlayer(`p${i + 1}`));
    const result = selectBenchPlayers(players, 4, 'americano');
    expect(result).toHaveLength(4);
    expect(new Set(result).size).toBe(4);
  });
});

describe('calculateBenchPoints', () => {
  it('calculates average: [18, 18, 14, 14] → 16', () => {
    expect(calculateBenchPoints([18, 18, 14, 14])).toBe(16);
  });

  it('returns 0 for empty array', () => {
    expect(calculateBenchPoints([])).toBe(0);
  });

  it('returns the single score: [24] → 24', () => {
    expect(calculateBenchPoints([24])).toBe(24);
  });

  it('returns 0 for all zeros: [0, 0, 0, 0] → 0', () => {
    expect(calculateBenchPoints([0, 0, 0, 0])).toBe(0);
  });

  it('calculates average for uneven scores: [24, 24, 0, 0] → 12', () => {
    expect(calculateBenchPoints([24, 24, 0, 0])).toBe(12);
  });

  it('handles non-integer result: [7, 8, 9] → 8', () => {
    expect(calculateBenchPoints([7, 8, 9])).toBe(8);
  });
});
