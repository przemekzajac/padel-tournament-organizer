import { useState } from 'react';
import type {
  Tournament,
  Round,
  Match,
  PointsPerMatch,
} from '@/types/tournament';
import { isValidScore } from '@/algorithms/scoring';

interface Props {
  tournament: Tournament;
  currentRound: Round;
  onSubmitRound: (scores: Map<number, { a: number; b: number }>) => void;
}

function ScoreInput({
  match,
  pointsPerMatch,
  scores,
  onScoreChange,
  playerNames,
}: {
  match: Match;
  pointsPerMatch: PointsPerMatch;
  scores: { a: string; b: string };
  onScoreChange: (court: number, team: 'a' | 'b', value: string) => void;
  playerNames: Map<string, string>;
}) {
  const scoreA = scores.a === '' ? null : parseInt(scores.a, 10);
  const scoreB = scores.b === '' ? null : parseInt(scores.b, 10);
  const hasValues = scores.a !== '' && scores.b !== '';
  const valid = hasValues && isValidScore(scoreA, scoreB, pointsPerMatch);
  const showError = hasValues && !valid;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-400 mb-3">
        Court {match.court_number}
      </p>
      <div className="flex items-center gap-3">
        {/* Team A */}
        <div className="flex-1 text-right">
          <p className="text-sm font-medium text-gray-800 truncate">
            {match.team_a_player_ids.map((id) => playerNames.get(id)).join(' & ')}
          </p>
        </div>

        {/* Score inputs */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            max={pointsPerMatch}
            value={scores.a}
            onChange={(e) =>
              onScoreChange(match.court_number, 'a', e.target.value)
            }
            className={`w-14 h-14 text-center text-xl font-bold rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-primary ${
              showError ? 'border-red-300' : 'border-gray-200'
            }`}
            aria-label={`Team A score, Court ${match.court_number}`}
          />
          <span className="text-gray-400 font-bold">:</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            max={pointsPerMatch}
            value={scores.b}
            onChange={(e) =>
              onScoreChange(match.court_number, 'b', e.target.value)
            }
            className={`w-14 h-14 text-center text-xl font-bold rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-primary ${
              showError ? 'border-red-300' : 'border-gray-200'
            }`}
            aria-label={`Team B score, Court ${match.court_number}`}
          />
        </div>

        {/* Team B */}
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-gray-800 truncate">
            {match.team_b_player_ids.map((id) => playerNames.get(id)).join(' & ')}
          </p>
        </div>
      </div>
      {showError && (
        <p className="text-xs text-red-500 mt-2 text-center">
          Scores must add up to {pointsPerMatch}
        </p>
      )}
    </div>
  );
}

export function ActiveRound({ tournament, currentRound, onSubmitRound }: Props) {
  const [scores, setScores] = useState<
    Map<number, { a: string; b: string }>
  >(() => {
    const map = new Map<number, { a: string; b: string }>();
    for (const match of currentRound.matches) {
      map.set(match.court_number, {
        a: match.team_a_score !== null ? String(match.team_a_score) : '',
        b: match.team_b_score !== null ? String(match.team_b_score) : '',
      });
    }
    return map;
  });

  // Player name lookup
  const playerNames = new Map(
    tournament.players.map((p) => [p.id, p.name]),
  );

  const handleScoreChange = (
    court: number,
    team: 'a' | 'b',
    value: string,
  ) => {
    setScores((prev) => {
      const next = new Map(prev);
      const current = next.get(court) || { a: '', b: '' };
      next.set(court, { ...current, [team]: value });
      return next;
    });
  };

  // Check if all scores are valid
  const allValid = currentRound.matches.every((match) => {
    const s = scores.get(match.court_number);
    if (!s || s.a === '' || s.b === '') return false;
    return isValidScore(
      parseInt(s.a, 10),
      parseInt(s.b, 10),
      tournament.points_per_match,
    );
  });

  const handleSubmit = () => {
    if (!allValid) return;
    const parsed = new Map<number, { a: number; b: number }>();
    for (const [court, s] of scores) {
      parsed.set(court, { a: parseInt(s.a, 10), b: parseInt(s.b, 10) });
    }
    onSubmitRound(parsed);
  };

  const benchedNames = currentRound.benched_player_ids.map(
    (id) => playerNames.get(id) || id,
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        <h2 className="text-lg font-bold text-gray-900">
          Round {currentRound.round_number}
        </h2>

        {currentRound.matches.map((match) => (
          <ScoreInput
            key={match.court_number}
            match={match}
            pointsPerMatch={tournament.points_per_match}
            scores={scores.get(match.court_number) || { a: '', b: '' }}
            onScoreChange={handleScoreChange}
            playerNames={playerNames}
          />
        ))}

        {benchedNames.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-medium text-gray-400 mb-1">
              Resting this round
            </p>
            <p className="text-sm text-gray-600">
              {benchedNames.join(', ')}
            </p>
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allValid}
        className="w-full py-4 bg-primary text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors shrink-0"
      >
        Next Round
      </button>
    </div>
  );
}
