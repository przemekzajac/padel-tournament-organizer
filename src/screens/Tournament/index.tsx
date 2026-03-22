import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournamentStore } from '@/store/tournamentStore';
import { ArrowLeft } from 'lucide-react';

export function Tournament() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTournament, isLoading, loadTournament } =
    useTournamentStore();

  useEffect(() => {
    if (id) loadTournament(id);
  }, [id, loadTournament]);

  if (isLoading || !currentTournament) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4">
      <header className="flex items-center gap-3 pt-6 pb-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {currentTournament.name}
          </h1>
          <p className="text-sm text-gray-500 capitalize">
            {currentTournament.format} · Round{' '}
            {currentTournament.rounds.length}
          </p>
        </div>
      </header>
      <p className="text-gray-500">
        Tournament screen with swipeable triptych coming in Phase 4...
      </p>
    </div>
  );
}
