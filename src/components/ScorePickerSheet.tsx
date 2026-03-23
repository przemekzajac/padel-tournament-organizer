import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PointsPerMatch } from '@/types/tournament';

interface Props {
  pointsPerMatch: PointsPerMatch;
  teamLabel: string;
  currentValue: number | null;
  onSelect: (value: number) => void;
  onClose: () => void;
}

export function ScorePickerSheet({
  pointsPerMatch,
  teamLabel,
  currentValue,
  onSelect,
  onClose,
}: Props) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  useEffect(() => {
    document.body.classList.add('overflow-hidden');
    return () => document.body.classList.remove('overflow-hidden');
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const numbers = Array.from({ length: pointsPerMatch + 1 }, (_, i) => i);

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 transition-transform duration-300 ease-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-zinc-900 border-t border-zinc-800 rounded-t-2xl max-w-lg mx-auto shadow-xl">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-zinc-700" />
          </div>

          {/* Header */}
          <p className="text-sm font-semibold text-zinc-300 text-center px-4 pb-3">
            Score for {teamLabel}
          </p>

          {/* Number grid */}
          <div className="px-4 pb-8 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-5 gap-2">
              {numbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onSelect(n)}
                  className={`h-12 rounded-xl text-lg font-semibold transition-colors ${
                    n === currentValue
                      ? 'bg-primary text-zinc-950'
                      : 'bg-zinc-800 text-zinc-200 active:bg-primary active:text-zinc-950'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
