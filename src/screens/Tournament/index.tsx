import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { useTournamentStore } from '@/store/tournamentStore';
import { processRoundScores } from '@/algorithms/scoring';
import { generateMexicanoRound } from '@/algorithms/mexicano';
import { generateMixicanoRound } from '@/algorithms/mixicano';
import { ArrowLeft, Flag } from 'lucide-react';
import { Standings } from './Standings';
import { ActiveRound } from './ActiveRound';
import { RoundHistory } from './RoundHistory';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Round } from '@/types/tournament';

const TABS = ['Standings', 'Round', 'History'] as const;

export function Tournament() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTournament, isLoading, loadTournament, submitRound, endTournament } =
    useTournamentStore();

  const [activeTab, setActiveTab] = useState(1); // Default to Round tab
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  useEffect(() => {
    if (id) loadTournament(id);
  }, [id, loadTournament]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setActiveTab((t) => Math.min(t + 1, 2)),
    onSwipedRight: () => setActiveTab((t) => Math.max(t - 1, 0)),
    trackMouse: false,
    preventScrollOnSwipe: true,
  });

  if (isLoading || !currentTournament) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const tournament = currentTournament;
  const isCompleted = tournament.status === 'completed';
  const currentRound = tournament.rounds[tournament.rounds.length - 1];

  const handleSubmitRound = async (
    scores: Map<number, { a: number; b: number }>,
  ) => {
    if (!currentRound) return;

    // Update match scores on current round
    const updatedMatches = currentRound.matches.map((match) => {
      const s = scores.get(match.court_number);
      if (!s) return match;
      return { ...match, team_a_score: s.a, team_b_score: s.b };
    });

    const updatedRound: Round = { ...currentRound, matches: updatedMatches };

    // Process scores and get updated players + bench points
    const { updatedPlayers, benchPoints } = processRoundScores(
      tournament.players,
      updatedRound,
      tournament.points_per_match,
    );

    const roundWithBenchPoints: Round = {
      ...updatedRound,
      bench_points: benchPoints,
    };

    // Generate next round based on format
    let nextRound: Round | null = null;
    const nextRoundNumber = currentRound.round_number + 1;

    if (tournament.format === 'mexicano') {
      nextRound = generateMexicanoRound(
        updatedPlayers,
        tournament.court_count,
        nextRoundNumber,
      );
    } else if (tournament.format === 'mixicano') {
      nextRound = generateMixicanoRound(
        updatedPlayers,
        tournament.court_count,
        nextRoundNumber,
      );
    } else if (tournament.format === 'americano') {
      // For Americano, the next round is already pre-generated in the schedule
      const preGenerated = tournament.rounds.find(
        (r) => r.round_number === nextRoundNumber,
      );
      if (preGenerated) {
        // Don't add a new round — it's already there
        nextRound = null;
      }
    }

    await submitRound(
      tournament.id,
      roundWithBenchPoints,
      updatedPlayers,
      nextRound,
    );
  };

  const handleEndTournament = async () => {
    await endTournament(tournament.id);
    setShowEndConfirm(false);
    setActiveTab(0); // Switch to standings
  };

  return (
    <div className="max-w-lg mx-auto px-4 h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 pt-6 pb-2 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 truncate">
            {tournament.name}
          </h1>
          <p className="text-xs text-gray-500 capitalize">
            {tournament.format}
            {!isCompleted && currentRound && ` · Round ${currentRound.round_number}`}
            {isCompleted && ' · Completed'}
          </p>
        </div>
        {!isCompleted && (
          <button
            onClick={() => setShowEndConfirm(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="End tournament"
          >
            <Flag className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </header>

      {/* Tab indicators */}
      <div className="flex gap-1 mb-4 shrink-0">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTab === i
                ? 'bg-primary text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Swipeable content */}
      <div className="flex-1 overflow-hidden" {...swipeHandlers}>
        <div
          className="flex h-full transition-transform duration-200 ease-out"
          style={{ transform: `translateX(-${activeTab * 100}%)` }}
        >
          {/* Panel 0: Standings */}
          <div className="w-full h-full shrink-0 px-1">
            <Standings tournament={tournament} />
          </div>

          {/* Panel 1: Active Round */}
          <div className="w-full h-full shrink-0 px-1">
            {isCompleted ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">Tournament completed</p>
              </div>
            ) : currentRound ? (
              <ActiveRound
                tournament={tournament}
                currentRound={currentRound}
                onSubmitRound={handleSubmitRound}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">No rounds yet</p>
              </div>
            )}
          </div>

          {/* Panel 2: Round History */}
          <div className="w-full h-full shrink-0 px-1">
            <RoundHistory tournament={tournament} />
          </div>
        </div>
      </div>

      {/* End tournament confirmation */}
      {showEndConfirm && (
        <ConfirmDialog
          title="End tournament?"
          message="This cannot be undone. Final standings will be locked."
          confirmLabel="End"
          onConfirm={handleEndTournament}
          onCancel={() => setShowEndConfirm(false)}
        />
      )}
    </div>
  );
}
