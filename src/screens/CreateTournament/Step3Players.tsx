import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { TournamentFormat, Gender } from '@/types/tournament';

interface PlayerInput {
  name: string;
  gender: Gender | null;
}

interface Props {
  format: TournamentFormat;
  value: PlayerInput[];
  onNext: (players: PlayerInput[]) => void;
}

function getErrors(format: TournamentFormat, players: PlayerInput[]): string[] {
  const errors: string[] = [];
  const count = players.length;

  if (format === 'americano' && count < 4) {
    errors.push(`Need at least 4 players for Americano`);
  }
  if (format === 'mexicano' && count < 8) {
    errors.push(`Need at least 8 players for Mexicano`);
  }
  if (format === 'mixicano') {
    const males = players.filter((p) => p.gender === 'male').length;
    const females = players.filter((p) => p.gender === 'female').length;
    if (count < 4 || males < 2 || females < 2) {
      errors.push('Need at least 4 players (2M + 2F) for Mixicano');
    }
    if (males !== females && count >= 4) {
      errors.push('Mixicano requires equal men and women');
    }
  }

  // Check duplicates
  const names = players.map((p) => p.name.toLowerCase());
  const seen = new Set<string>();
  for (const name of names) {
    if (seen.has(name)) {
      errors.push(`Duplicate name: "${name}"`);
      break;
    }
    seen.add(name);
  }

  return errors;
}

export function Step3Players({ format, value, onNext }: Props) {
  const [players, setPlayers] = useState<PlayerInput[]>(
    value.length > 0 ? value : [],
  );
  const [inputName, setInputName] = useState('');
  const isMixicano = format === 'mixicano';

  const addPlayer = () => {
    const trimmed = inputName.trim();
    if (!trimmed) return;
    if (players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase()))
      return;
    setPlayers([
      ...players,
      { name: trimmed, gender: isMixicano ? 'male' : null },
    ]);
    setInputName('');
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const toggleGender = (index: number) => {
    setPlayers(
      players.map((p, i) =>
        i === index
          ? { ...p, gender: p.gender === 'male' ? 'female' : 'male' }
          : p,
      ),
    );
  };

  const errors = getErrors(format, players);
  const isValid = errors.length === 0 && players.length >= 4;

  const males = players.filter((p) => p.gender === 'male').length;
  const females = players.filter((p) => p.gender === 'female').length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add players</h2>
        <p className="text-sm text-gray-500 mb-4">
          {players.length} player{players.length !== 1 ? 's' : ''} added
          {isMixicano && ` · ${males}M / ${females}F`}
        </p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addPlayer();
              }
            }}
            placeholder="Player name"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            onClick={addPlayer}
            disabled={!inputName.trim()}
            className="px-4 py-3 bg-primary text-white rounded-xl disabled:opacity-40 hover:bg-primary-dark transition-colors"
            aria-label="Add player"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {players.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {players.map((player, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                {isMixicano && (
                  <button
                    onClick={() => toggleGender(i)}
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      player.gender === 'male'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-pink-100 text-pink-700'
                    }`}
                    aria-label={`Toggle gender for ${player.name}`}
                  >
                    {player.gender === 'male' ? 'M' : 'F'}
                  </button>
                )}
                <span className="text-gray-800">{player.name}</span>
                <button
                  onClick={() => removePlayer(i)}
                  className="text-gray-400 hover:text-red-500 ml-1"
                  aria-label={`Remove ${player.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {errors.length > 0 && players.length > 0 && (
          <div className="space-y-1 mb-4">
            {errors.map((err, i) => (
              <p key={i} className="text-sm text-red-500">
                {err}
              </p>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => onNext(players)}
        disabled={!isValid}
        className="w-full py-4 bg-primary text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors"
      >
        Next
      </button>
    </div>
  );
}
