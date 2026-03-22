import type { PointsPerMatch } from '@/types/tournament';

interface Props {
  value: PointsPerMatch | null;
  onSelect: (points: PointsPerMatch) => void;
}

const options: { value: PointsPerMatch; label: string; hint: string }[] = [
  { value: 16, label: '16', hint: '~8 min per match' },
  { value: 24, label: '24', hint: '~12 min · Standard' },
  { value: 32, label: '32', hint: '~16 min per match' },
];

export function Step5Points({ value, onSelect }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Points per match
        </h2>
        <p className="text-sm text-gray-500 mb-8">
          Both teams' scores always add up to this total.
        </p>
        <div className="flex flex-col gap-3">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className={`w-full p-5 rounded-xl border-2 text-left transition-all active:scale-[0.98] ${
                value === opt.value
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className="text-3xl font-bold text-gray-900">
                {opt.label}
              </span>
              <span className="ml-3 text-sm text-gray-500">{opt.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
