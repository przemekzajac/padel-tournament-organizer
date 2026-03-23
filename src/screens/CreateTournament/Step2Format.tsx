import type { TournamentFormat } from '@/types/tournament';

interface Props {
  value: TournamentFormat | null;
  onNext: (format: TournamentFormat) => void;
}

const formats: {
  id: TournamentFormat;
  name: string;
  description: string;
  icon: string;
}[] = [
  {
    id: 'americano',
    name: 'Americano',
    description: 'Round-robin. Play with everyone.',
    icon: '🔄',
  },
  {
    id: 'mexicano',
    name: 'Mexicano',
    description: 'Dynamic. Opponents based on standings.',
    icon: '📊',
  },
  {
    id: 'mixicano',
    name: 'Mixicano',
    description: 'Mixed gender. Dynamic pairings.',
    icon: '⚥',
  },
];

export function Step2Format({ value, onNext }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-50 mb-2">
          Pick a format
        </h2>
        <p className="text-sm text-zinc-400 mb-8">
          Choose how pairings are determined.
        </p>
        <div className="flex flex-col gap-3">
          {formats.map((f) => (
            <button
              key={f.id}
              onClick={() => onNext(f.id)}
              className={`w-full text-left p-5 rounded-xl border-2 transition-all active:scale-[0.98] ${
                value === f.id
                  ? 'border-primary bg-primary/10'
                  : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <h3 className="font-semibold text-zinc-50">{f.name}</h3>
                  <p className="text-sm text-zinc-400">{f.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
