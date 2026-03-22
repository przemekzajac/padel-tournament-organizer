import { describe, it, expect } from 'vitest';
import { calculateStandings } from './standings';
import type { Player } from '@/types/tournament';

function makePlayer(id: string, points: number, won: number, conceded: number): Player {
  return {
    id,
    name: `Player ${id}`,
    gender: null,
    cumulative_points: points,
    total_points_won: won,
    total_points_conceded: conceded,
    matches_played: 1,
    bench_count: 0,
  };
}

describe('calculateStandings', () => {
  it('ranks players by cumulative points descending', () => {
    const players = [
      makePlayer('a', 10, 10, 14),
      makePlayer('b', 30, 30, 18),
      makePlayer('c', 20, 20, 12),
    ];

    const standings = calculateStandings(players, 'active');

    expect(standings[0].player.id).toBe('b');
    expect(standings[0].rank).toBe(1);
    expect(standings[1].player.id).toBe('c');
    expect(standings[1].rank).toBe(2);
    expect(standings[2].player.id).toBe('a');
    expect(standings[2].rank).toBe(3);
  });

  it('breaks ties by point differential', () => {
    const players = [
      makePlayer('a', 20, 20, 12), // diff = +8
      makePlayer('b', 20, 20, 16), // diff = +4
    ];

    const standings = calculateStandings(players, 'completed');

    expect(standings[0].player.id).toBe('a');
    expect(standings[1].player.id).toBe('b');
    expect(standings[0].rank).toBe(1);
    expect(standings[1].rank).toBe(2);
  });

  it('assigns shared ranks for tied players in completed tournaments', () => {
    const players = [
      makePlayer('a', 20, 20, 12), // diff = +8
      makePlayer('b', 20, 20, 12), // diff = +8 (same)
      makePlayer('c', 10, 10, 14),
    ];

    const standings = calculateStandings(players, 'completed');

    expect(standings[0].rank).toBe(1);
    expect(standings[1].rank).toBe(1); // Shared 1st
    expect(standings[2].rank).toBe(3); // Skip 2nd
  });

  it('calculates point differential correctly', () => {
    const player = makePlayer('a', 40, 36, 28);
    const standings = calculateStandings([player], 'active');

    expect(standings[0].point_differential).toBe(8); // 36 - 28
  });
});
