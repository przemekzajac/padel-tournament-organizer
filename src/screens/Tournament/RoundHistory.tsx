import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Tournament, Round } from '@/types/tournament';

interface Props {
  tournament: Tournament;
}

function RoundCard({
  round,
  tournament,
}: {
  round: Round;
  tournament: Tournament;
}) {
  const [expanded, setExpanded] = useState(false);
  const playerNames = new Map(tournament.players.map((p) => [p.id, p.name]));

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-800 transition-colors"
      >
        <span className="font-semibold text-zinc-50">
          Round {round.round_number}
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-zinc-800 pt-3">
          {round.matches.map((match) => (
            <div key={match.court_number} className="text-sm">
              <p className="text-xs text-zinc-500 mb-1">
                Court {match.court_number}
              </p>
              <div className="flex items-center gap-2">
                <span className="flex-1 text-right text-zinc-300 truncate">
                  {match.team_a_player_ids
                    .map((id) => playerNames.get(id))
                    .join(' & ')}
                </span>
                <span className="font-bold text-zinc-50 tabular-nums">
                  {match.team_a_score} : {match.team_b_score}
                </span>
                <span className="flex-1 text-left text-zinc-300 truncate">
                  {match.team_b_player_ids
                    .map((id) => playerNames.get(id))
                    .join(' & ')}
                </span>
              </div>
            </div>
          ))}

          {round.benched_player_ids.length > 0 && (
            <div className="text-xs text-zinc-500 pt-1 border-t border-zinc-800">
              Rested:{' '}
              {round.benched_player_ids
                .map((id) => playerNames.get(id))
                .join(', ')}
              {round.bench_points !== null && (
                <span> · {round.bench_points.toFixed(1)} pts</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RoundHistory({ tournament }: Props) {
  const completedRounds = tournament.rounds.filter(
    (r) => r.matches.some((m) => m.team_a_score !== null),
  );

  if (completedRounds.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-zinc-500 text-sm">No completed rounds yet</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <h2 className="text-lg font-bold tracking-tight text-zinc-50 mb-4">Round History</h2>
      <div className="space-y-2">
        {[...completedRounds].reverse().map((round) => (
          <RoundCard
            key={round.round_number}
            round={round}
            tournament={tournament}
          />
        ))}
      </div>
    </div>
  );
}
