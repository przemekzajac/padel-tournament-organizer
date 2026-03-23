import { describe, it, expect } from 'vitest';
import { generateAmericanoSchedule } from './americano';
import type { Player } from '@/types/tournament';

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

describe('generateAmericanoSchedule', () => {
  it('generates the requested number of rounds', () => {
    const players = makePlayers(8);
    const rounds = generateAmericanoSchedule(players, 2, 10);
    expect(rounds).toHaveLength(10);
  });

  it('caps at 50 rounds by default', () => {
    const players = makePlayers(4);
    const rounds = generateAmericanoSchedule(players, 1);
    expect(rounds).toHaveLength(50);
  });

  it('assigns correct number of matches per round', () => {
    const players = makePlayers(8);
    const rounds = generateAmericanoSchedule(players, 2, 5);

    for (const round of rounds) {
      expect(round.matches).toHaveLength(2);
    }
  });

  it('has no duplicate players within a round', () => {
    const players = makePlayers(12);
    const rounds = generateAmericanoSchedule(players, 3, 10);

    for (const round of rounds) {
      const activeIds = round.matches.flatMap((m) => [
        ...m.team_a_player_ids,
        ...m.team_b_player_ids,
      ]);
      expect(new Set(activeIds).size).toBe(activeIds.length);
    }
  });

  it('benches correct number of players when needed', () => {
    const players = makePlayers(5);
    const rounds = generateAmericanoSchedule(players, 1, 10);

    for (const round of rounds) {
      expect(round.benched_player_ids).toHaveLength(1);
      expect(round.matches).toHaveLength(1);
    }
  });

  it('distributes bench fairly (each player benches ±1 of others)', () => {
    const players = makePlayers(5);
    const rounds = generateAmericanoSchedule(players, 1, 10);

    // Count benches per player
    const benchMap = new Map<string, number>();
    for (const p of players) benchMap.set(p.id, 0);
    for (const round of rounds) {
      for (const id of round.benched_player_ids) {
        benchMap.set(id, (benchMap.get(id) || 0) + 1);
      }
    }

    const counts = Array.from(benchMap.values());
    const maxBench = Math.max(...counts);
    const minBench = Math.min(...counts);
    expect(maxBench - minBench).toBeLessThanOrEqual(1);
  });

  it('balances match count per player ±1', () => {
    const players = makePlayers(6);
    const rounds = generateAmericanoSchedule(players, 1, 12);

    // Count matches per player
    const matchMap = new Map<string, number>();
    for (const p of players) matchMap.set(p.id, 0);
    for (const round of rounds) {
      for (const match of round.matches) {
        for (const id of [...match.team_a_player_ids, ...match.team_b_player_ids]) {
          matchMap.set(id, (matchMap.get(id) || 0) + 1);
        }
      }
    }

    const counts = Array.from(matchMap.values());
    const maxMatch = Math.max(...counts);
    const minMatch = Math.min(...counts);
    expect(maxMatch - minMatch).toBeLessThanOrEqual(1);
  });

  it('works with exactly 4 players (no benching)', () => {
    const players = makePlayers(4);
    const rounds = generateAmericanoSchedule(players, 1, 5);

    for (const round of rounds) {
      expect(round.benched_player_ids).toHaveLength(0);
      expect(round.matches).toHaveLength(1);
    }
  });

  it('distributes partnerships (each pair should partner at least once over enough rounds)', () => {
    const players = makePlayers(8);
    const rounds = generateAmericanoSchedule(players, 2, 20);

    // Count partnerships
    const partnerMap = new Map<string, number>();
    for (const round of rounds) {
      for (const match of round.matches) {
        const teamA = match.team_a_player_ids;
        const teamB = match.team_b_player_ids;
        const keyA = [teamA[0], teamA[1]].sort().join('-');
        const keyB = [teamB[0], teamB[1]].sort().join('-');
        partnerMap.set(keyA, (partnerMap.get(keyA) || 0) + 1);
        partnerMap.set(keyB, (partnerMap.get(keyB) || 0) + 1);
      }
    }

    // With 8 players and 20 rounds, most pairs should have partnered
    // There are C(8,2) = 28 possible pairs
    // We can't guarantee all, but most should have partnered at least once
    const pairedCount = partnerMap.size;
    expect(pairedCount).toBeGreaterThan(20); // At least 20 of 28 pairs
  });

  it('no player appears on both teams in the same match', () => {
    const players = makePlayers(8);
    const rounds = generateAmericanoSchedule(players, 2, 10);

    for (const round of rounds) {
      for (const match of round.matches) {
        const overlap = match.team_a_player_ids.filter((id) =>
          match.team_b_player_ids.includes(id),
        );
        expect(overlap).toHaveLength(0);
      }
    }
  });

  it('partnership minimization: max partnership count is reasonable over many rounds', () => {
    const players = makePlayers(8);
    const rounds = generateAmericanoSchedule(players, 2, 30);

    const partnerMap = new Map<string, number>();
    for (const round of rounds) {
      for (const match of round.matches) {
        for (const team of [match.team_a_player_ids, match.team_b_player_ids]) {
          const key = [team[0], team[1]].sort().join('-');
          partnerMap.set(key, (partnerMap.get(key) || 0) + 1);
        }
      }
    }

    const maxCount = Math.max(...partnerMap.values());
    // With C(8,2)=28 pairs and 30 rounds (60 partnerships total), max should be < 15
    expect(maxCount).toBeLessThan(15);
  });

  it('large group no bench: 16 players, 4 courts', () => {
    const players = makePlayers(16);
    const rounds = generateAmericanoSchedule(players, 4, 5);

    expect(rounds).toHaveLength(5);
    for (const round of rounds) {
      expect(round.benched_player_ids).toHaveLength(0);
      expect(round.matches).toHaveLength(4);
    }
  });

  it('large group with bench: 17 players, 4 courts', () => {
    const players = makePlayers(17);
    const rounds = generateAmericanoSchedule(players, 4, 10);

    expect(rounds).toHaveLength(10);
    for (const round of rounds) {
      expect(round.benched_player_ids).toHaveLength(1);
      expect(round.matches).toHaveLength(4);
    }
  });

  it('single round: maxRounds=1 produces exactly 1 round', () => {
    const players = makePlayers(8);
    const rounds = generateAmericanoSchedule(players, 2, 1);

    expect(rounds).toHaveLength(1);
  });

  it('round numbering is sequential starting from 1', () => {
    const players = makePlayers(8);
    const rounds = generateAmericanoSchedule(players, 2, 10);

    for (let i = 0; i < rounds.length; i++) {
      expect(rounds[i].round_number).toBe(i + 1);
    }
  });

  it('court numbering is 1 through courtCount in each round', () => {
    const players = makePlayers(12);
    const courtCount = 3;
    const rounds = generateAmericanoSchedule(players, courtCount, 5);

    for (const round of rounds) {
      const courtNumbers = round.matches.map((m) => m.court_number).sort((a, b) => a - b);
      expect(courtNumbers).toEqual([1, 2, 3]);
    }
  });

  it('all scores are null in every generated match', () => {
    const players = makePlayers(8);
    const rounds = generateAmericanoSchedule(players, 2, 5);

    for (const round of rounds) {
      for (const match of round.matches) {
        expect(match.team_a_score).toBeNull();
        expect(match.team_b_score).toBeNull();
      }
    }
  });

  it('all possible pairs eventually partner over enough rounds', () => {
    const players = makePlayers(8);
    const rounds = generateAmericanoSchedule(players, 2, 50);

    const partnerSet = new Set<string>();
    for (const round of rounds) {
      for (const match of round.matches) {
        for (const team of [match.team_a_player_ids, match.team_b_player_ids]) {
          const key = [team[0], team[1]].sort().join('-');
          partnerSet.add(key);
        }
      }
    }

    // All C(8,2) = 28 pairs should have partnered at least once
    expect(partnerSet.size).toBe(28);
  });
});
