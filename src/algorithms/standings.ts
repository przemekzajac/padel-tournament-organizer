import type { Player, PlayerStanding, TournamentStatus } from '@/types/tournament';

/**
 * Calculate standings from players.
 * Sort by: cumulative_points DESC, then point_differential DESC.
 * For active tournaments: tied players get random order (for pairing purposes)
 *   but display the same rank.
 * For completed tournaments: tied players share rank (next rank is skipped).
 */
export function calculateStandings(
  players: Player[],
  status: TournamentStatus,
): PlayerStanding[] {
  const withDiff = players.map((p) => ({
    player: p,
    point_differential: p.total_points_won - p.total_points_conceded,
  }));

  // Sort: points DESC, then differential DESC, then random for ties
  withDiff.sort((a, b) => {
    if (b.player.cumulative_points !== a.player.cumulative_points) {
      return b.player.cumulative_points - a.player.cumulative_points;
    }
    if (b.point_differential !== a.point_differential) {
      return b.point_differential - a.point_differential;
    }
    // Random tiebreak for mid-tournament pairing
    if (status === 'active') {
      return Math.random() - 0.5;
    }
    return 0;
  });

  // Assign ranks with shared rank logic
  const standings: PlayerStanding[] = [];
  let currentRank = 1;

  for (let i = 0; i < withDiff.length; i++) {
    const entry = withDiff[i];

    if (i > 0) {
      const prev = withDiff[i - 1];
      const samePoints =
        entry.player.cumulative_points === prev.player.cumulative_points;
      const sameDiff = entry.point_differential === prev.point_differential;

      if (status === 'completed' && samePoints && sameDiff) {
        // Share rank with previous player
      } else {
        currentRank = i + 1;
      }
    }

    standings.push({
      player: entry.player,
      rank: currentRank,
      point_differential: entry.point_differential,
    });
  }

  return standings;
}

/**
 * Get a deterministic ranking for pairing purposes (no shared ranks).
 * Ties broken by differential, then randomly.
 */
export function getRankedPlayersForPairing(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    if (b.cumulative_points !== a.cumulative_points) {
      return b.cumulative_points - a.cumulative_points;
    }
    const diffA = a.total_points_won - a.total_points_conceded;
    const diffB = b.total_points_won - b.total_points_conceded;
    if (diffB !== diffA) return diffB - diffA;
    return Math.random() - 0.5;
  });
}
