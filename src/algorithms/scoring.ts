import type { Player, Round, Match, PointsPerMatch } from '@/types/tournament';
import { calculateBenchPoints } from './bench';

/**
 * Validate that a match score is valid.
 */
export function isValidScore(
  scoreA: number | null,
  scoreB: number | null,
  pointsPerMatch: PointsPerMatch,
): boolean {
  if (scoreA === null || scoreB === null) return false;
  if (scoreA < 0 || scoreB < 0) return false;
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB)) return false;
  return scoreA + scoreB === pointsPerMatch;
}

/**
 * Check if all matches in a round have valid scores.
 */
export function isRoundComplete(
  matches: Match[],
  pointsPerMatch: PointsPerMatch,
): boolean {
  return matches.every((m) =>
    isValidScore(m.team_a_score, m.team_b_score, pointsPerMatch),
  );
}

/**
 * Process a completed round: update player stats and calculate bench points.
 * Returns updated players and the bench points value.
 */
export function processRoundScores(
  players: Player[],
  round: Round,
  pointsPerMatch: PointsPerMatch,
): { updatedPlayers: Player[]; benchPoints: number } {
  // Validate all scores
  if (!isRoundComplete(round.matches, pointsPerMatch)) {
    throw new Error('Round is not complete — not all scores are valid');
  }

  // Build a map of player ID to their earned points this round
  const roundPoints = new Map<string, { won: number; conceded: number }>();

  for (const match of round.matches) {
    const scoreA = match.team_a_score!;
    const scoreB = match.team_b_score!;

    for (const id of match.team_a_player_ids) {
      roundPoints.set(id, { won: scoreA, conceded: scoreB });
    }
    for (const id of match.team_b_player_ids) {
      roundPoints.set(id, { won: scoreB, conceded: scoreA });
    }
  }

  // Calculate bench points
  const activeScores = Array.from(roundPoints.values()).map((v) => v.won);
  const benchPoints = calculateBenchPoints(activeScores);

  // Update all players
  const updatedPlayers = players.map((player) => {
    const scores = roundPoints.get(player.id);

    if (scores) {
      // Active player
      return {
        ...player,
        cumulative_points: player.cumulative_points + scores.won,
        total_points_won: player.total_points_won + scores.won,
        total_points_conceded: player.total_points_conceded + scores.conceded,
        matches_played: player.matches_played + 1,
      };
    }

    if (round.benched_player_ids.includes(player.id)) {
      // Benched player
      return {
        ...player,
        cumulative_points: player.cumulative_points + benchPoints,
        bench_count: player.bench_count + 1,
      };
    }

    // Player not in this round (shouldn't happen)
    return player;
  });

  return { updatedPlayers, benchPoints };
}
