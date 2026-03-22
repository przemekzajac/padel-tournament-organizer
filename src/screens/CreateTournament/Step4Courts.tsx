import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

interface Props {
  value: number;
  playerCount: number;
  onNext: (courts: number) => void;
}

export function Step4Courts({ value, playerCount, onNext }: Props) {
  const maxCourts = Math.min(8, Math.floor(playerCount / 4));
  const [courts, setCourts] = useState(Math.min(value || 1, maxCourts));

  const benchPerRound = playerCount - courts * 4;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Set courts
        </h2>
        <p className="text-sm text-gray-500 mb-8">
          How many courts are available?
        </p>

        <div className="flex items-center justify-center gap-6 mb-6">
          <button
            onClick={() => setCourts(Math.max(1, courts - 1))}
            disabled={courts <= 1}
            className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-30 hover:border-gray-400 transition-colors"
            aria-label="Decrease courts"
          >
            <Minus className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-6xl font-bold text-gray-900 w-20 text-center tabular-nums">
            {courts}
          </span>
          <button
            onClick={() => setCourts(Math.min(maxCourts, courts + 1))}
            disabled={courts >= maxCourts}
            className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-30 hover:border-gray-400 transition-colors"
            aria-label="Increase courts"
          >
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <p className="text-sm text-gray-500 text-center">
          {courts * 4} players active per round
          {benchPerRound > 0 && (
            <span className="text-amber-600">
              {' '}
              · {benchPerRound} resting
            </span>
          )}
        </p>
        <p className="text-xs text-gray-400 text-center mt-1">
          Max {maxCourts} court{maxCourts !== 1 ? 's' : ''} for {playerCount}{' '}
          players
        </p>
      </div>

      <button
        onClick={() => onNext(courts)}
        className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
      >
        Next
      </button>
    </div>
  );
}
