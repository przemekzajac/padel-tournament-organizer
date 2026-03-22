import type { Player, Round } from '@/types/tournament';

/**
 * Generate a full Americano schedule (up to maxRounds).
 *
 * Greedy algorithm:
 * 1. Track a partnership matrix (how many times each pair has partnered)
 * 2. Each round: select bench players (lowest bench count), then form
 *    teams that minimize partnership repetition
 * 3. Each player should play ±1 matches across the schedule
 */
export function generateAmericanoSchedule(
  players: Player[],
  courtCount: number,
  maxRounds: number = 50,
): Round[] {
  const n = players.length;
  const activeSlots = courtCount * 4;
  const benchPerRound = n - activeSlots;

  // Partnership count matrix (indexed by player index)
  const partnerCount: number[][] = Array.from({ length: n }, () =>
    Array(n).fill(0),
  );

  // Bench count per player
  const benchCounts: number[] = Array(n).fill(0);

  // Match count per player
  const matchCounts: number[] = Array(n).fill(0);

  const rounds: Round[] = [];

  for (let r = 0; r < maxRounds; r++) {
    // Select bench players: those with lowest bench count
    const benchIndices = selectBenchIndices(benchCounts, benchPerRound);

    // Active player indices
    const activeIndices = Array.from({ length: n }, (_, i) => i).filter(
      (i) => !benchIndices.includes(i),
    );

    // Form teams greedily, minimizing partner repetition
    const matches = formMatches(activeIndices, partnerCount, players, courtCount);

    // Update partnership matrix
    for (const match of matches) {
      const [a1Idx, a2Idx] = match.teamAIndices;
      const [b1Idx, b2Idx] = match.teamBIndices;
      partnerCount[a1Idx][a2Idx]++;
      partnerCount[a2Idx][a1Idx]++;
      partnerCount[b1Idx][b2Idx]++;
      partnerCount[b2Idx][b1Idx]++;
    }

    // Update bench and match counts
    for (const i of benchIndices) benchCounts[i]++;
    for (const i of activeIndices) matchCounts[i]++;

    rounds.push({
      round_number: r + 1,
      matches: matches.map((m, courtIdx) => ({
        court_number: courtIdx + 1,
        team_a_player_ids: [
          players[m.teamAIndices[0]].id,
          players[m.teamAIndices[1]].id,
        ] as [string, string],
        team_b_player_ids: [
          players[m.teamBIndices[0]].id,
          players[m.teamBIndices[1]].id,
        ] as [string, string],
        team_a_score: null,
        team_b_score: null,
      })),
      benched_player_ids: benchIndices.map((i) => players[i].id),
      bench_points: null,
    });
  }

  return rounds;
}

function selectBenchIndices(
  benchCounts: number[],
  count: number,
): number[] {
  if (count <= 0) return [];

  // Create index-count pairs and sort by bench count, random tiebreak
  const indexed = benchCounts.map((c, i) => ({ index: i, count: c }));
  indexed.sort((a, b) => {
    if (a.count !== b.count) return a.count - b.count;
    return Math.random() - 0.5;
  });

  return indexed.slice(0, count).map((e) => e.index);
}

interface MatchAssignment {
  teamAIndices: [number, number];
  teamBIndices: [number, number];
}

function formMatches(
  activeIndices: number[],
  partnerCount: number[][],
  _players: Player[],
  courtCount: number,
): MatchAssignment[] {
  // Generate all possible pairs from active players
  const pairs: [number, number][] = [];
  for (let i = 0; i < activeIndices.length; i++) {
    for (let j = i + 1; j < activeIndices.length; j++) {
      pairs.push([activeIndices[i], activeIndices[j]]);
    }
  }

  // Sort pairs by partnership count (ascending) — prefer new partnerships
  pairs.sort((a, b) => {
    const countA = partnerCount[a[0]][a[1]];
    const countB = partnerCount[b[0]][b[1]];
    if (countA !== countB) return countA - countB;
    return Math.random() - 0.5;
  });

  // Greedily assign pairs to teams
  const used = new Set<number>();
  const teams: [number, number][] = [];

  for (const pair of pairs) {
    if (teams.length >= courtCount * 2) break;
    if (used.has(pair[0]) || used.has(pair[1])) continue;
    teams.push(pair);
    used.add(pair[0]);
    used.add(pair[1]);
  }

  // Pair teams into matches (first team vs second team, etc.)
  const matches: MatchAssignment[] = [];
  for (let i = 0; i < teams.length; i += 2) {
    matches.push({
      teamAIndices: teams[i],
      teamBIndices: teams[i + 1],
    });
  }

  return matches;
}
