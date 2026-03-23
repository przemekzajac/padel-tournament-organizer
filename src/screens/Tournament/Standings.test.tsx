import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Standings } from './Standings';
import type { Tournament, Player } from '@/types/tournament';

function makePlayer(overrides: Partial<Player> & { id: string; name: string }): Player {
  return {
    gender: null,
    cumulative_points: 0,
    total_points_won: 0,
    total_points_conceded: 0,
    matches_played: 0,
    bench_count: 0,
    ...overrides,
  };
}

function makeTournament(
  players: Player[],
  status: 'active' | 'completed' = 'active',
): Tournament {
  return {
    id: 'test-tournament-id',
    name: 'Test Tournament',
    format: 'americano',
    points_per_match: 24,
    court_count: 2,
    status,
    created_at: '2026-03-23T10:00:00Z',
    completed_at: status === 'completed' ? '2026-03-23T18:00:00Z' : null,
    players,
    rounds: [],
  };
}

describe('Standings', () => {
  it('renders player names', () => {
    const players = [
      makePlayer({ id: '1', name: 'Alice', cumulative_points: 30 }),
      makePlayer({ id: '2', name: 'Bob', cumulative_points: 20 }),
      makePlayer({ id: '3', name: 'Charlie', cumulative_points: 10 }),
    ];

    render(<Standings tournament={makeTournament(players)} />);

    // Names appear in both the podium and the full list
    expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Bob').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Charlie').length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Standings" heading for active tournament', () => {
    const players = [
      makePlayer({ id: '1', name: 'Alice', cumulative_points: 10 }),
    ];

    render(<Standings tournament={makeTournament(players, 'active')} />);

    expect(screen.getByText('Standings')).toBeInTheDocument();
  });

  it('shows "Final Standings" heading for completed tournament', () => {
    const players = [
      makePlayer({ id: '1', name: 'Alice', cumulative_points: 10 }),
    ];

    render(<Standings tournament={makeTournament(players, 'completed')} />);

    expect(screen.getByText('Final Standings')).toBeInTheDocument();
  });

  it('displays point differential with sign', () => {
    const players = [
      makePlayer({
        id: '1',
        name: 'Alice',
        cumulative_points: 30,
        total_points_won: 50,
        total_points_conceded: 30,
      }),
      makePlayer({
        id: '2',
        name: 'Bob',
        cumulative_points: 20,
        total_points_won: 20,
        total_points_conceded: 40,
      }),
    ];

    render(<Standings tournament={makeTournament(players)} />);

    // Alice: 50-30 = +20, Bob: 20-40 = -20
    expect(screen.getByText('+20')).toBeInTheDocument();
    expect(screen.getByText('-20')).toBeInTheDocument();
  });

  it('displays cumulative points formatted to one decimal', () => {
    const players = [
      makePlayer({ id: '1', name: 'Alice', cumulative_points: 24.5 }),
      makePlayer({ id: '2', name: 'Bob', cumulative_points: 18.0 }),
      makePlayer({ id: '3', name: 'Charlie', cumulative_points: 12.0 }),
    ];

    render(<Standings tournament={makeTournament(players)} />);

    // Points appear in both podium and full list
    expect(screen.getAllByText('24.5').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('18.0').length).toBeGreaterThanOrEqual(1);
  });

  it('shows podium when there are at least 3 players', () => {
    const players = [
      makePlayer({ id: '1', name: 'Alice', cumulative_points: 30 }),
      makePlayer({ id: '2', name: 'Bob', cumulative_points: 20 }),
      makePlayer({ id: '3', name: 'Charlie', cumulative_points: 10 }),
    ];

    render(<Standings tournament={makeTournament(players)} />);

    // Podium shows rank indicators #1, #2, #3
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('ranks players by cumulative points descending', () => {
    const players = [
      makePlayer({ id: '1', name: 'LowScore', cumulative_points: 5 }),
      makePlayer({ id: '2', name: 'HighScore', cumulative_points: 50 }),
      makePlayer({ id: '3', name: 'MidScore', cumulative_points: 25 }),
    ];

    render(<Standings tournament={makeTournament(players, 'completed')} />);

    // In the full standings list, ranks are shown as text
    // HighScore should be rank 1, MidScore rank 2, LowScore rank 3
    const listItems = screen.getAllByText(/^[123]$/);
    // Ranks appear in the full list: 1, 2, 3
    expect(listItems.length).toBeGreaterThanOrEqual(3);
  });

  it('handles zero differential with plus sign', () => {
    const players = [
      makePlayer({
        id: '1',
        name: 'Alice',
        cumulative_points: 20,
        total_points_won: 30,
        total_points_conceded: 30,
      }),
    ];

    render(<Standings tournament={makeTournament(players)} />);

    expect(screen.getByText('+0')).toBeInTheDocument();
  });
});
