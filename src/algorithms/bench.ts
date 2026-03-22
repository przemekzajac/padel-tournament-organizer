import type { Player, TournamentFormat } from '@/types/tournament';

/**
 * Select players to bench for the next round.
 * Rule: Players with the lowest bench_count are selected first.
 * Ties broken randomly.
 * For Mixicano: equal M/F must bench.
 */
export function selectBenchPlayers(
  players: Player[],
  courtCount: number,
  format: TournamentFormat,
): string[] {
  const activeSlots = courtCount * 4;
  const benchCount = players.length - activeSlots;

  if (benchCount <= 0) return [];

  if (format === 'mixicano') {
    return selectMixicanoBench(players, benchCount);
  }

  return selectFromPool(players, benchCount);
}

function selectFromPool(pool: Player[], count: number): string[] {
  if (count <= 0) return [];

  // Sort by bench_count ascending, then randomize ties
  const sorted = [...pool].sort((a, b) => {
    if (a.bench_count !== b.bench_count) return a.bench_count - b.bench_count;
    return Math.random() - 0.5;
  });

  return sorted.slice(0, count).map((p) => p.id);
}

function selectMixicanoBench(players: Player[], benchCount: number): string[] {
  const menToBench = benchCount / 2;
  const womenToBench = benchCount / 2;

  const men = players.filter((p) => p.gender === 'male');
  const women = players.filter((p) => p.gender === 'female');

  return [
    ...selectFromPool(men, menToBench),
    ...selectFromPool(women, womenToBench),
  ];
}

/**
 * Calculate bench points for a round.
 * bench_points = sum(all active player points this round) / count(active players)
 */
export function calculateBenchPoints(
  activePlayerScores: number[],
): number {
  if (activePlayerScores.length === 0) return 0;
  const sum = activePlayerScores.reduce((a, b) => a + b, 0);
  return sum / activePlayerScores.length;
}
