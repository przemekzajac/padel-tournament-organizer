import { supabase } from '@/lib/supabase';
import type { Tournament } from '@/types/tournament';

interface TournamentRow {
  id: string;
  user_id: string;
  name: string;
  format: string;
  points_per_match: number;
  court_count: number;
  status: string;
  created_at: string;
  completed_at: string | null;
  players: Tournament['players'];
  rounds: Tournament['rounds'];
}

function rowToTournament(row: TournamentRow): Tournament {
  return {
    id: row.id,
    name: row.name,
    format: row.format as Tournament['format'],
    points_per_match: row.points_per_match as Tournament['points_per_match'],
    court_count: row.court_count,
    status: row.status as Tournament['status'],
    created_at: row.created_at,
    completed_at: row.completed_at,
    players: row.players,
    rounds: row.rounds,
  };
}

export async function fetchTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as TournamentRow[]).map(rowToTournament);
}

export async function fetchTournament(id: string): Promise<Tournament | null> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return rowToTournament(data as TournamentRow);
}

export async function insertTournament(tournament: Tournament): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('tournaments').insert({
    id: tournament.id,
    user_id: user.id,
    name: tournament.name,
    format: tournament.format,
    points_per_match: tournament.points_per_match,
    court_count: tournament.court_count,
    status: tournament.status,
    created_at: tournament.created_at,
    completed_at: tournament.completed_at,
    players: tournament.players,
    rounds: tournament.rounds,
  });

  if (error) throw error;
}

export async function upsertTournament(tournament: Tournament): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('tournaments').upsert({
    id: tournament.id,
    user_id: user.id,
    name: tournament.name,
    format: tournament.format,
    points_per_match: tournament.points_per_match,
    court_count: tournament.court_count,
    status: tournament.status,
    created_at: tournament.created_at,
    completed_at: tournament.completed_at,
    players: tournament.players,
    rounds: tournament.rounds,
  });

  if (error) throw error;
}

export async function removeTournament(id: string): Promise<void> {
  const { error } = await supabase.from('tournaments').delete().eq('id', id);
  if (error) throw error;
}
