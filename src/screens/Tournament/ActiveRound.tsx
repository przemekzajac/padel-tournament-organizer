import { useState } from 'react';
import type {
  Tournament,
  Round,
  Match,
} from '@/types/tournament';
import { isValidScore } from '@/algorithms/scoring';
import { ScorePickerSheet } from '@/components/ScorePickerSheet';

interface Props {
  tournament: Tournament;
  currentRound: Round;
  onSubmitRound: (scores: Map<number, { a: number; b: number }>) => void;
}

function ScoreInput({
  match,
  scores,
  onOpenPicker,
  playerNames,
}: {
  match: Match;
  scores: { a: string; b: string };
  onOpenPicker: (court: number, team: 'a' | 'b', teamLabel: string) => void;
  playerNames: Map<string, string>;
}) {
  const teamALabel = match.team_a_player_ids
    .map((id) => playerNames.get(id))
    .join(' & ');
  const teamBLabel = match.team_b_player_ids
    .map((id) => playerNames.get(id))
    .join(' & ');

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
      <p className="text-xs font-medium text-zinc-500 mb-3">
        Court {match.court_number}
      </p>
      <div className="flex items-center gap-3">
        {/* Team A */}
        <div className="flex-1 text-right">
          <p className="text-sm font-medium text-zinc-200 truncate">
            {teamALabel}
          </p>
        </div>

        {/* Score buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onOpenPicker(match.court_number, 'a', teamALabel)
            }
            className={`w-14 h-14 flex items-center justify-center text-xl font-bold rounded-lg border-2 transition-colors ${
              scores.a
                ? 'border-primary bg-primary/10 text-zinc-50'
                : 'border-zinc-700 text-zinc-600'
            }`}
            aria-label={`Team A score, Court ${match.court_number}`}
          >
            {scores.a || '–'}
          </button>
          <span className="text-zinc-600 font-bold">:</span>
          <button
            type="button"
            onClick={() =>
              onOpenPicker(match.court_number, 'b', teamBLabel)
            }
            className={`w-14 h-14 flex items-center justify-center text-xl font-bold rounded-lg border-2 transition-colors ${
              scores.b
                ? 'border-primary bg-primary/10 text-zinc-50'
                : 'border-zinc-700 text-zinc-600'
            }`}
            aria-label={`Team B score, Court ${match.court_number}`}
          >
            {scores.b || '–'}
          </button>
        </div>

        {/* Team B */}
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-zinc-200 truncate">
            {teamBLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ActiveRound({ tournament, currentRound, onSubmitRound }: Props) {
  const pointsPerMatch = tournament.points_per_match;

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

  const [pickerTarget, setPickerTarget] = useState<{
    court: number;
    team: 'a' | 'b';
    teamLabel: string;
  } | null>(null);

  // Player name lookup
  const playerNames = new Map(
    tournament.players.map((p) => [p.id, p.name]),
  );

  const handleOpenPicker = (
    court: number,
    team: 'a' | 'b',
    teamLabel: string,
  ) => {
    setPickerTarget({ court, team, teamLabel });
  };

  const handleScoreSelect = (value: number) => {
    if (!pickerTarget) return;
    const { court, team } = pickerTarget;
    const other = pointsPerMatch - value;
    setScores((prev) => {
      const next = new Map(prev);
      next.set(court, {
        a: team === 'a' ? String(value) : String(other),
        b: team === 'b' ? String(value) : String(other),
      });
      return next;
    });
    setPickerTarget(null);
  };

  // Check if all scores are valid
  const allValid = currentRound.matches.every((match) => {
    const s = scores.get(match.court_number);
    if (!s || s.a === '' || s.b === '') return false;
    return isValidScore(
      parseInt(s.a, 10),
      parseInt(s.b, 10),
      pointsPerMatch,
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

  // Get current value for the picker
  const pickerCurrentValue =
    pickerTarget
      ? (() => {
          const s = scores.get(pickerTarget.court);
          if (!s) return null;
          const raw = pickerTarget.team === 'a' ? s.a : s.b;
          return raw === '' ? null : parseInt(raw, 10);
        })()
      : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        <h2 className="text-lg font-bold tracking-tight text-zinc-50">
          Round {currentRound.round_number}
        </h2>

        {currentRound.matches.map((match) => (
          <ScoreInput
            key={match.court_number}
            match={match}
            scores={scores.get(match.court_number) || { a: '', b: '' }}
            onOpenPicker={handleOpenPicker}
            playerNames={playerNames}
          />
        ))}

        {benchedNames.length > 0 && (
          <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 mb-1">
              Resting this round
            </p>
            <p className="text-sm text-zinc-400">
              {benchedNames.join(', ')}
            </p>
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allValid}
        className="w-full py-4 bg-primary text-zinc-950 font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-light transition-colors shrink-0"
      >
        Next Round
      </button>

      {pickerTarget && (
        <ScorePickerSheet
          pointsPerMatch={pointsPerMatch}
          teamLabel={pickerTarget.teamLabel}
          currentValue={pickerCurrentValue}
          onSelect={handleScoreSelect}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  );
}
