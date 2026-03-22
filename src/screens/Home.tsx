import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournamentStore } from '@/store/tournamentStore';
import { Plus, Trophy, Users, LayoutGrid } from 'lucide-react';
import type { Tournament } from '@/types/tournament';

function TournamentCard({ tournament }: { tournament: Tournament }) {
  const navigate = useNavigate();
  const isActive = tournament.status === 'active';
  const currentRound = tournament.rounds.length;

  return (
    <button
      onClick={() => navigate(`/tournament/${tournament.id}`)}
      className="w-full text-left bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:bg-gray-50 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900 truncate pr-2">
          {tournament.name}
        </h3>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
            isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isActive && (
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
          )}
          {isActive ? 'Live' : 'Completed'}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500">
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
        {currentRound > 0 && (
          <span className="text-gray-400">Round {currentRound}</span>
        )}
      </div>
    </button>
  );
}

export function Home() {
  const { tournaments, isLoading, loadTournaments } = useTournamentStore();
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
        <h1 className="text-2xl font-bold text-gray-900">Padel Tournament</h1>
        <p className="text-sm text-gray-500">Organize. Play. Compete.</p>
      </header>

      {tournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            No tournaments yet
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Create your first tournament to get started
          </p>
          <button
            onClick={() => navigate('/create')}
            className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-dark transition-colors"
          >
            Create Tournament
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}

      {tournaments.length > 0 && (
        <button
          onClick={() => navigate('/create')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-dark transition-colors"
          aria-label="Create tournament"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
