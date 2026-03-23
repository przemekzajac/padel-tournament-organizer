import type { Tournament } from '@/types/tournament';
import { calculateStandings } from '@/algorithms/standings';

interface Props {
  tournament: Tournament;
}

const medalColors: Record<number, string> = {
  1: 'bg-gold/20 text-yellow-300 border-gold',
  2: 'bg-silver/20 text-zinc-300 border-silver',
  3: 'bg-bronze/20 text-orange-300 border-bronze',
};

export function Standings({ tournament }: Props) {
  const standings = calculateStandings(
    tournament.players,
    tournament.status,
  );

  const isCompleted = tournament.status === 'completed';

  return (
    <div className="h-full overflow-y-auto">
      <h2 className="text-lg font-bold tracking-tight text-zinc-50 mb-4">
        {isCompleted ? 'Final Standings' : 'Standings'}
      </h2>

      {/* Podium for top 3 */}
      {standings.length >= 3 && (
        <div className="flex justify-center items-end gap-2 mb-6">
          {[1, 0, 2].map((idx) => {
            const s = standings[idx];
            if (!s) return null;
            const heights = ['h-24', 'h-28', 'h-20'];
            const order = [1, 0, 2];
            return (
              <div
                key={s.player.id}
                className={`flex flex-col items-center ${isCompleted ? 'animate-fade-in' : ''}`}
              >
                <span className="text-xs font-bold text-zinc-500 mb-1">
                  #{s.rank}
                </span>
                <p className="text-sm font-semibold text-zinc-50 truncate max-w-[80px] text-center">
                  {s.player.name}
                </p>
                <p className="text-xs text-zinc-400 mb-1">
                  {s.player.cumulative_points.toFixed(1)}
                </p>
                <div
                  className={`${heights[order[idx]]} w-20 rounded-t-lg ${
                    idx === 0
                      ? 'bg-silver/30'
                      : idx === 1
                        ? 'bg-gold/30'
                        : 'bg-bronze/30'
                  }`}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="space-y-1">
        {standings.map((s) => {
          const medal = medalColors[s.rank];
          return (
            <div
              key={s.player.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                medal ? 'border ' + medal : 'bg-zinc-900'
              }`}
            >
              <span className="w-8 text-center text-sm font-bold text-zinc-500">
                {s.rank}
              </span>
              <span className="flex-1 text-sm font-medium text-zinc-200 truncate">
                {s.player.name}
              </span>
              <span className="text-sm font-semibold text-zinc-50 tabular-nums">
                {s.player.cumulative_points.toFixed(1)}
              </span>
              <span className="text-xs text-zinc-500 w-12 text-right tabular-nums">
                {s.point_differential >= 0 ? '+' : ''}
                {s.point_differential}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
