import type { Player, Round, Match } from '@/types/tournament';
import { selectBenchPlayers } from './bench';
import { getRankedPlayersForPairing } from './standings';

/**
 * Generate the next round for a Mixicano tournament.
 *
 * Algorithm:
 * 1. Maintain separate M/F leaderboards ranked by cumulative points
 * 2. Select bench players (equal M/F, lowest bench count)
 * 3. Form groups: top 2 men + top 2 women → Court 1, next 2+2 → Court 2, etc.
 * 4. Within each group: Man#1 + Woman#2 vs Man#2 + Woman#1 (cross-pairing)
 */
export function generateMixicanoRound(
  players: Player[],
  courtCount: number,
  roundNumber: number,
): Round {
  // Select bench players (gender-balanced)
  const benchedIds = selectBenchPlayers(players, courtCount, 'mixicano');

  // Separate active players by gender and rank each
  const activePlayers = players.filter((p) => !benchedIds.includes(p.id));
  const rankedMen = getRankedPlayersForPairing(
    activePlayers.filter((p) => p.gender === 'male'),
  );
  const rankedWomen = getRankedPlayersForPairing(
    activePlayers.filter((p) => p.gender === 'female'),
  );

  // Create matches with cross-pairing
  const matches: Match[] = [];
  for (let court = 0; court < courtCount; court++) {
    const m1 = rankedMen[court * 2];
    const m2 = rankedMen[court * 2 + 1];
    const w1 = rankedWomen[court * 2];
    const w2 = rankedWomen[court * 2 + 1];

    if (!m1 || !m2 || !w1 || !w2) break;

    // Cross-pair: M#1 + W#2 vs M#2 + W#1
    matches.push({
      court_number: court + 1,
      team_a_player_ids: [m1.id, w2.id],
      team_b_player_ids: [m2.id, w1.id],
      team_a_score: null,
      team_b_score: null,
    });
  }

  return {
    round_number: roundNumber,
    matches,
    benched_player_ids: benchedIds,
    bench_points: null,
  };
}
