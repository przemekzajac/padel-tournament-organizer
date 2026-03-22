import type { Player, Round, Match, TournamentFormat } from '@/types/tournament';

/**
 * Shuffle array in place using Fisher-Yates
 */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Select players to bench using the bench fairness algorithm.
 * For round 1, all bench counts are 0, so selection is random.
 * For Mixicano, equal M/F must bench.
 */
function selectBenchPlayers(
  players: Player[],
  benchCount: number,
  format: TournamentFormat,
): string[] {
  if (benchCount <= 0) return [];

  if (format === 'mixicano') {
    const menToBench = benchCount / 2;
    const womenToBench = benchCount / 2;
    const men = shuffle(players.filter((p) => p.gender === 'male'));
    const women = shuffle(players.filter((p) => p.gender === 'female'));
    return [
      ...men.slice(0, menToBench).map((p) => p.id),
      ...women.slice(0, womenToBench).map((p) => p.id),
    ];
  }

  const shuffled = shuffle(players);
  return shuffled.slice(0, benchCount).map((p) => p.id);
}

/**
 * Generate the first round with random pairings.
 * For Mixicano, ensures each team is 1M + 1F using cross-pairing.
 */
export function generateInitialRound(
  players: Player[],
  courtCount: number,
  format: TournamentFormat,
): Round {
  const activeSlots = courtCount * 4;
  const benchCount = players.length - activeSlots;
  const benchedIds = selectBenchPlayers(players, benchCount, format);
  const activePlayers = players.filter((p) => !benchedIds.includes(p.id));

  let matches: Match[];

  if (format === 'mixicano') {
    // Separate by gender, shuffle each
    const men = shuffle(activePlayers.filter((p) => p.gender === 'male'));
    const women = shuffle(activePlayers.filter((p) => p.gender === 'female'));

    matches = [];
    for (let court = 0; court < courtCount; court++) {
      const m1 = men[court * 2];
      const m2 = men[court * 2 + 1];
      const w1 = women[court * 2];
      const w2 = women[court * 2 + 1];

      // Cross-pair: M1+W2 vs M2+W1
      matches.push({
        court_number: court + 1,
        team_a_player_ids: [m1.id, w2.id],
        team_b_player_ids: [m2.id, w1.id],
        team_a_score: null,
        team_b_score: null,
      });
    }
  } else {
    // Americano and Mexicano: random shuffle, groups of 4
    const shuffled = shuffle(activePlayers);

    matches = [];
    for (let court = 0; court < courtCount; court++) {
      const group = shuffled.slice(court * 4, court * 4 + 4);
      // Positions 1+3 vs 2+4
      matches.push({
        court_number: court + 1,
        team_a_player_ids: [group[0].id, group[2].id],
        team_b_player_ids: [group[1].id, group[3].id],
        team_a_score: null,
        team_b_score: null,
      });
    }
  }

  return {
    round_number: 1,
    matches,
    benched_player_ids: benchedIds,
    bench_points: null,
  };
}
