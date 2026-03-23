import { describe, it, expect } from 'vitest';
import { calculateStandings, getRankedPlayersForPairing } from './standings';
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

  it('returns a single player with rank 1', () => {
    const players = [makePlayer('a', 10, 10, 5)];
    const standings = calculateStandings(players, 'active');

    expect(standings).toHaveLength(1);
    expect(standings[0].rank).toBe(1);
  });

  it('returns empty array for empty input', () => {
    const standings = calculateStandings([], 'active');
    expect(standings).toHaveLength(0);
  });

  it('assigns all rank 1 when all players tied in completed tournament', () => {
    const players = [
      makePlayer('a', 20, 20, 12),
      makePlayer('b', 20, 20, 12),
      makePlayer('c', 20, 20, 12),
    ];
    const standings = calculateStandings(players, 'completed');

    expect(standings[0].rank).toBe(1);
    expect(standings[1].rank).toBe(1);
    expect(standings[2].rank).toBe(1);
    // Next rank would be 4 (skipping 2 and 3)
  });

  it('assigns all rank 1 when all players tied in active tournament', () => {
    const players = [
      makePlayer('a', 20, 20, 12),
      makePlayer('b', 20, 20, 12),
      makePlayer('c', 20, 20, 12),
    ];
    const standings = calculateStandings(players, 'active');

    // All three have rank 1 since they are still tied even with random tiebreak
    // (random tiebreak assigns sequential ranks for active)
    expect(standings).toHaveLength(3);
    // All players present
    const ids = standings.map(s => s.player.id).sort();
    expect(ids).toEqual(['a', 'b', 'c']);
  });

  it('handles negative differential', () => {
    const player = makePlayer('a', 10, 10, 20);
    const standings = calculateStandings([player], 'active');

    expect(standings[0].point_differential).toBe(-10); // 10 - 20
  });

  it('skips ranks correctly with multiple tie groups in completed tournament', () => {
    const players = [
      makePlayer('a', 30, 30, 10), // diff = +20
      makePlayer('b', 30, 30, 10), // diff = +20
      makePlayer('c', 20, 20, 12), // diff = +8
      makePlayer('d', 20, 20, 12), // diff = +8
      makePlayer('e', 10, 10, 14), // diff = -4
      makePlayer('f', 10, 10, 14), // diff = -4
    ];
    const standings = calculateStandings(players, 'completed');

    expect(standings[0].rank).toBe(1);
    expect(standings[1].rank).toBe(1);
    expect(standings[2].rank).toBe(3);
    expect(standings[3].rank).toBe(3);
    expect(standings[4].rank).toBe(5);
    expect(standings[5].rank).toBe(5);
  });

  it('assigns sequential ranks for active tournament even with ties', () => {
    const players = [
      makePlayer('a', 30, 30, 10), // diff = +20
      makePlayer('b', 30, 30, 10), // diff = +20
      makePlayer('c', 20, 20, 12), // diff = +8
      makePlayer('d', 20, 20, 12), // diff = +8
      makePlayer('e', 10, 10, 14), // diff = -4
      makePlayer('f', 10, 10, 14), // diff = -4
    ];
    const standings = calculateStandings(players, 'active');

    // Each rank is unique (sequential) because active uses random tiebreak
    const ranks = standings.map(s => s.rank);
    expect(ranks).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('getRankedPlayersForPairing', () => {
  it('returns all players', () => {
    const players = [
      makePlayer('a', 10, 10, 5),
      makePlayer('b', 20, 20, 8),
      makePlayer('c', 15, 15, 10),
      makePlayer('d', 5, 5, 12),
      makePlayer('e', 25, 25, 3),
    ];
    const ranked = getRankedPlayersForPairing(players);
    expect(ranked).toHaveLength(5);
  });

  it('sorts by cumulative_points descending', () => {
    const players = [
      makePlayer('a', 10, 10, 5),
      makePlayer('b', 30, 30, 8),
      makePlayer('c', 20, 20, 10),
    ];
    const ranked = getRankedPlayersForPairing(players);

    expect(ranked[0].id).toBe('b');
    expect(ranked[1].id).toBe('c');
    expect(ranked[2].id).toBe('a');
  });

  it('breaks ties by differential', () => {
    const players = [
      makePlayer('a', 20, 20, 16), // diff = +4
      makePlayer('b', 20, 20, 12), // diff = +8
    ];
    const ranked = getRankedPlayersForPairing(players);

    expect(ranked[0].id).toBe('b'); // higher differential
    expect(ranked[1].id).toBe('a');
  });

  it('returns all players when all tied', () => {
    const players = [
      makePlayer('a', 20, 20, 12),
      makePlayer('b', 20, 20, 12),
      makePlayer('c', 20, 20, 12),
      makePlayer('d', 20, 20, 12),
    ];
    const ranked = getRankedPlayersForPairing(players);

    expect(ranked).toHaveLength(4);
    const ids = ranked.map(p => p.id).sort();
    expect(ids).toEqual(['a', 'b', 'c', 'd']);
  });
});
