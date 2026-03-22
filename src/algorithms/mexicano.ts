import type { Player, Round, Match } from '@/types/tournament';
import { selectBenchPlayers } from './bench';
import { getRankedPlayersForPairing } from './standings';

/**
 * Generate the next round for a Mexicano tournament.
 *
 * Algorithm:
 * 1. Rank all players by cumulative points (ties broken by differential, then random)
 * 2. Select bench players (lowest bench count)
 * 3. Remove benched players from ranked list
 * 4. Divide into groups of 4: {A1, A2, A3, A4}, {A5, A6, A7, A8}, ...
 * 5. Within each group: A1+A3 vs A2+A4
 * 6. Top group → Court 1, next → Court 2, etc.
 */
export function generateMexicanoRound(
  players: Player[],
  courtCount: number,
  roundNumber: number,
): Round {
  // Select bench players
  const benchedIds = selectBenchPlayers(players, courtCount, 'mexicano');

  // Rank active players
  const activePlayers = players.filter((p) => !benchedIds.includes(p.id));
  const ranked = getRankedPlayersForPairing(activePlayers);

  // Group into fours and create matches
  const matches: Match[] = [];
  for (let court = 0; court < courtCount; court++) {
    const group = ranked.slice(court * 4, court * 4 + 4);
    if (group.length < 4) break;

    // #1+#3 vs #2+#4
    matches.push({
      court_number: court + 1,
      team_a_player_ids: [group[0].id, group[2].id],
      team_b_player_ids: [group[1].id, group[3].id],
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
