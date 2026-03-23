import { useState } from 'react';

interface Props {
  value: string;
  onNext: (name: string) => void;
}

export function Step1Name({ value, onNext }: Props) {
  const [name, setName] = useState(value);
  const trimmed = name.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= 50;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-50 mb-2">
          Name your tournament
        </h2>
        <p className="text-sm text-zinc-400 mb-8">
          Give it a name players will remember.
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isValid) onNext(trimmed);
          }}
          placeholder="e.g. Friday Night Padel"
          maxLength={50}
          autoFocus
          className="w-full px-4 py-3 text-lg bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <p className="text-xs text-zinc-500 mt-2 text-right">
          {trimmed.length}/50
        </p>
      </div>
      <button
        onClick={() => onNext(trimmed)}
        disabled={!isValid}
        className="w-full py-4 bg-primary text-zinc-950 font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-light transition-colors"
      >
        Next
      </button>
    </div>
  );
}
