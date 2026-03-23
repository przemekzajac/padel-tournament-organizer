import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournamentStore } from '@/store/tournamentStore';
import { Plus, Trophy, Users, LayoutGrid, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Tournament } from '@/types/tournament';

function TournamentCard({
  tournament,
  onDelete,
}: {
  tournament: Tournament;
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();
  const isActive = tournament.status === 'active';
  const completedRounds = tournament.rounds.filter(
    (r) => r.matches.every((m) => m.team_a_score !== null),
  ).length;

  return (
    <div className="flex gap-2 items-stretch">
      <button
        onClick={() => navigate(`/tournament/${tournament.id}`)}
        className="flex-1 text-left bg-zinc-900 rounded-xl p-4 border border-zinc-800 active:bg-zinc-800 transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-zinc-50 truncate pr-2">
            {tournament.name}
          </h3>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
              isActive
                ? 'bg-green-500/15 text-green-400'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {isActive && (
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
            )}
            {isActive ? 'Live' : 'Completed'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <span className="inline-flex items-center gap-1 capitalize">
            <Trophy className="w-3.5 h-3.5" />
            {tournament.format}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {tournament.players.length}
          </span>
          <span className="inline-flex items-center gap-1">
            <LayoutGrid className="w-3.5 h-3.5" />
            {tournament.court_count} {tournament.court_count === 1 ? 'court' : 'courts'}
          </span>
          {completedRounds > 0 && (
            <span className="text-zinc-500">R{completedRounds}</span>
          )}
        </div>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(tournament.id);
        }}
        className="flex items-center justify-center px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
        aria-label={`Delete ${tournament.name}`}
      >
        <Trash2 className="w-4 h-4 text-zinc-500 hover:text-red-400" />
      </button>
    </div>
  );
}

export function Home() {
  const { tournaments, isLoading, loadTournaments, deleteTournament } =
    useTournamentStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-24">
      <header className="pt-8 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Padel Tournament</h1>
        <p className="text-sm text-zinc-500">Organize. Play. Compete.</p>
      </header>

      {tournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-50 mb-1">
            No tournaments yet
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            Create your first tournament to get started
          </p>
          <button
            onClick={() => navigate('/create')}
            className="bg-primary text-zinc-950 px-6 py-3 rounded-xl font-semibold hover:bg-primary-light transition-colors"
          >
            Create Tournament
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tournaments.map((t) => (
            <TournamentCard
              key={t.id}
              tournament={t}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      {tournaments.length > 0 && (
        <button
          onClick={() => navigate('/create')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-zinc-950 rounded-full shadow-lg shadow-primary/25 flex items-center justify-center hover:bg-primary-light transition-colors"
          aria-label="Create tournament"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete tournament?"
          message="This will permanently remove this tournament and all its data."
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteTournament(deleteId);
            setDeleteId(null);
          }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
