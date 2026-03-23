import { describe, it, expect } from 'vitest';
import { generateInitialRound } from '@/algorithms/initialRound';
import { generateMexicanoRound } from '@/algorithms/mexicano';
import { generateMixicanoRound } from '@/algorithms/mixicano';
import { generateAmericanoSchedule } from '@/algorithms/americano';
import { processRoundScores } from '@/algorithms/scoring';
import { calculateStandings } from '@/algorithms/standings';
import type { Player, Round } from '@/types/tournament';

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    gender: null,
    cumulative_points: 0,
    total_points_won: 0,
    total_points_conceded: 0,
    matches_played: 0,
    bench_count: 0,
  }));
}

function makeMixedPlayers(maleCount: number, femaleCount: number): Player[] {
  return [
    ...Array.from({ length: maleCount }, (_, i) => ({
      id: `m${i + 1}`,
      name: `Male ${i + 1}`,
      gender: 'male' as const,
      cumulative_points: 0,
      total_points_won: 0,
      total_points_conceded: 0,
      matches_played: 0,
      bench_count: 0,
    })),
    ...Array.from({ length: femaleCount }, (_, i) => ({
      id: `f${i + 1}`,
      name: `Female ${i + 1}`,
      gender: 'female' as const,
      cumulative_points: 0,
      total_points_won: 0,
      total_points_conceded: 0,
      matches_played: 0,
      bench_count: 0,
    })),
  ];
}

/** Assign deterministic scores to a round's matches */
function assignScores(round: Round, pointsPerMatch: number): Round {
  const matches = round.matches.map((match, i) => {
    const scoreA = pointsPerMatch / 2 + (i % 3) * 2; // vary scores slightly
    const scoreB = pointsPerMatch - scoreA;
    return { ...match, team_a_score: scoreA, team_b_score: scoreB };
  });
  return { ...round, matches };
}

describe('Mexicano full tournament lifecycle', () => {
  it('plays 5 rounds with 8 players, 2 courts', () => {
    let players = makePlayers(8);
    const courtCount = 2;
    const pointsPerMatch = 24;

    // Round 1: initial random
    let currentRound = generateInitialRound(players, courtCount, 'mexicano');

    for (let r = 0; r < 5; r++) {
      // Assign scores
      const scoredRound = assignScores(currentRound, pointsPerMatch);

      // Process
      const { updatedPlayers, benchPoints } = processRoundScores(players, scoredRound, pointsPerMatch);
      players = updatedPlayers;

      // Verify all active players have updated stats
      const activeIds = scoredRound.matches.flatMap(m => [
        ...m.team_a_player_ids,
        ...m.team_b_player_ids,
      ]);
      for (const id of activeIds) {
        const p = players.find(p => p.id === id)!;
        expect(p.matches_played).toBeGreaterThan(0);
      }

      // Generate next round (except after last)
      if (r < 4) {
        currentRound = generateMexicanoRound(players, courtCount, r + 2);
        expect(currentRound.round_number).toBe(r + 2);
      }
    }

    // Final standings
    const standings = calculateStandings(players, 'completed');
    expect(standings).toHaveLength(8);
    expect(standings[0].rank).toBe(1);

    // All players should have played 5 matches (no benching with 8 players, 2 courts)
    for (const p of players) {
      expect(p.matches_played).toBe(5);
      expect(p.bench_count).toBe(0);
    }
  });

  it('plays 5 rounds with 9 players (1 benched per round), bench stays fair', () => {
    let players = makePlayers(9);
    const courtCount = 2;
    const pointsPerMatch = 24;

    let currentRound = generateInitialRound(players, courtCount, 'mexicano');

    for (let r = 0; r < 5; r++) {
      expect(currentRound.benched_player_ids).toHaveLength(1);

      const scoredRound = assignScores(currentRound, pointsPerMatch);
      const { updatedPlayers } = processRoundScores(players, scoredRound, pointsPerMatch);
      players = updatedPlayers;

      if (r < 4) {
        currentRound = generateMexicanoRound(players, courtCount, r + 2);
      }
    }

    // Bench fairness: each player benched 0 or 1 times over 5 rounds (5 bench slots total for 9 players)
    const benchCounts = players.map(p => p.bench_count);
    const maxBench = Math.max(...benchCounts);
    const minBench = Math.min(...benchCounts);
    expect(maxBench - minBench).toBeLessThanOrEqual(1);
  });
});

describe('Americano full tournament lifecycle', () => {
  it('pre-generates schedule and plays 5 rounds', () => {
    let players = makePlayers(8);
    const courtCount = 2;
    const pointsPerMatch = 32;

    const rounds = generateAmericanoSchedule(players, courtCount, 50);
    expect(rounds).toHaveLength(50);

    // Play first 5 rounds
    for (let r = 0; r < 5; r++) {
      const scoredRound = assignScores(rounds[r], pointsPerMatch);
      const { updatedPlayers } = processRoundScores(players, scoredRound, pointsPerMatch);
      players = updatedPlayers;
    }

    // Verify points accumulated
    const totalPoints = players.reduce((sum, p) => sum + p.cumulative_points, 0);
    expect(totalPoints).toBeGreaterThan(0);

    // All played 5 matches (no benching with 8 players, 2 courts)
    for (const p of players) {
      expect(p.matches_played).toBe(5);
    }
  });

  it('handles benching correctly over multiple rounds', () => {
    let players = makePlayers(5);
    const courtCount = 1;
    const pointsPerMatch = 16;

    const rounds = generateAmericanoSchedule(players, courtCount, 10);

    for (let r = 0; r < 10; r++) {
      expect(rounds[r].benched_player_ids).toHaveLength(1);
      const scoredRound = assignScores(rounds[r], pointsPerMatch);
      const { updatedPlayers } = processRoundScores(players, scoredRound, pointsPerMatch);
      players = updatedPlayers;
    }

    // Each player benched 2 times (10 rounds, 1 benched per round, 5 players)
    const benchCounts = players.map(p => p.bench_count);
    expect(benchCounts.every(c => c === 2)).toBe(true);

    // Each player played 8 matches (10 rounds - 2 benched)
    for (const p of players) {
      expect(p.matches_played).toBe(8);
    }
  });
});

describe('Mixicano full tournament lifecycle', () => {
  it('plays 3 rounds with 4M+4F, 2 courts, maintaining gender balance', () => {
    let players = makeMixedPlayers(4, 4);
    const courtCount = 2;
    const pointsPerMatch = 24;

    let currentRound = generateInitialRound(players, courtCount, 'mixicano');

    for (let r = 0; r < 3; r++) {
      // Verify every team is 1M + 1F
      for (const match of currentRound.matches) {
        for (const team of [match.team_a_player_ids, match.team_b_player_ids]) {
          const genders = team.map(id => players.find(p => p.id === id)!.gender);
          expect(genders.sort()).toEqual(['female', 'male']);
        }
      }

      const scoredRound = assignScores(currentRound, pointsPerMatch);
      const { updatedPlayers } = processRoundScores(players, scoredRound, pointsPerMatch);
      players = updatedPlayers;

      if (r < 2) {
        currentRound = generateMixicanoRound(players, courtCount, r + 2);
      }
    }

    // All 8 players played 3 matches
    for (const p of players) {
      expect(p.matches_played).toBe(3);
    }
  });

  it('handles benching with gender balance over multiple rounds', () => {
    let players = makeMixedPlayers(3, 3); // 6 players, 1 court → 2 benched (1M+1F)
    const courtCount = 1;
    const pointsPerMatch = 24;

    let currentRound = generateInitialRound(players, courtCount, 'mixicano');

    for (let r = 0; r < 4; r++) {
      expect(currentRound.benched_player_ids).toHaveLength(2);

      // Verify bench gender balance
      const benchedGenders = currentRound.benched_player_ids.map(
        id => players.find(p => p.id === id)!.gender
      );
      expect(benchedGenders.filter(g => g === 'male')).toHaveLength(1);
      expect(benchedGenders.filter(g => g === 'female')).toHaveLength(1);

      const scoredRound = assignScores(currentRound, pointsPerMatch);
      const { updatedPlayers } = processRoundScores(players, scoredRound, pointsPerMatch);
      players = updatedPlayers;

      if (r < 3) {
        currentRound = generateMixicanoRound(players, courtCount, r + 2);
      }
    }

    // Bench fairness per gender
    const maleBenchCounts = players.filter(p => p.gender === 'male').map(p => p.bench_count);
    const femaleBenchCounts = players.filter(p => p.gender === 'female').map(p => p.bench_count);

    expect(Math.max(...maleBenchCounts) - Math.min(...maleBenchCounts)).toBeLessThanOrEqual(1);
    expect(Math.max(...femaleBenchCounts) - Math.min(...femaleBenchCounts)).toBeLessThanOrEqual(1);
  });
});

describe('Cross-format scoring consistency', () => {
  it('bench points equal average of active player scores regardless of format', () => {
    const players = makePlayers(5);
    const round: Round = {
      round_number: 1,
      matches: [{
        court_number: 1,
        team_a_player_ids: ['p1', 'p2'],
        team_b_player_ids: ['p3', 'p4'],
        team_a_score: 20,
        team_b_score: 12,
      }],
      benched_player_ids: ['p5'],
      bench_points: null,
    };

    const { benchPoints } = processRoundScores(players, round, 32);
    // Average: (20+20+12+12)/4 = 16
    expect(benchPoints).toBe(16);
  });

  it('standings are deterministic for completed tournaments', () => {
    const players: Player[] = [
      { id: 'p1', name: 'P1', gender: null, cumulative_points: 50, total_points_won: 50, total_points_conceded: 30, matches_played: 3, bench_count: 0 },
      { id: 'p2', name: 'P2', gender: null, cumulative_points: 40, total_points_won: 40, total_points_conceded: 20, matches_played: 3, bench_count: 0 },
      { id: 'p3', name: 'P3', gender: null, cumulative_points: 30, total_points_won: 30, total_points_conceded: 40, matches_played: 3, bench_count: 0 },
    ];

    // Run multiple times to verify determinism for completed
    for (let i = 0; i < 10; i++) {
      const standings = calculateStandings(players, 'completed');
      expect(standings[0].player.id).toBe('p1');
      expect(standings[1].player.id).toBe('p2');
      expect(standings[2].player.id).toBe('p3');
    }
  });
});
