import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTournamentStore } from '@/store/tournamentStore';
import { generateInitialRound } from '@/algorithms/initialRound';
import { Step1Name } from './Step1Name';
import { Step2Format } from './Step2Format';
import { Step3Players } from './Step3Players';
import { Step4Courts } from './Step4Courts';
import { Step5Points } from './Step5Points';
import type {
  TournamentFormat,
  PointsPerMatch,
  Gender,
} from '@/types/tournament';

interface PlayerInput {
  name: string;
  gender: Gender | null;
}

const TOTAL_STEPS = 5;

export function CreateTournament() {
  const navigate = useNavigate();
  const createTournament = useTournamentStore((s) => s.createTournament);

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [format, setFormat] = useState<TournamentFormat | null>(null);
  const [players, setPlayers] = useState<PlayerInput[]>([]);
  const [courts, setCourts] = useState(1);
  const [points, setPoints] = useState<PointsPerMatch | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const goBack = () => {
    if (step === 1) {
      navigate('/');
    } else {
      setStep(step - 1);
    }
  };

  const handleCreate = async (selectedPoints: PointsPerMatch) => {
    if (!format || isCreating) return;
    setIsCreating(true);

    try {
      const tournament = await createTournament(
        {
          name,
          format,
          points_per_match: selectedPoints,
          court_count: courts,
          players: players.map((p) => ({
            name: p.name,
            gender: p.gender,
          })),
        },
        [],
      );

      // Generate initial round after tournament is created (need player IDs)
      const initialRound = generateInitialRound(
        tournament.players,
        tournament.court_count,
        tournament.format,
      );

      const updated = { ...tournament, rounds: [initialRound] };
      await useTournamentStore.getState().updateTournament(updated);

      navigate(`/tournament/${tournament.id}`);
    } catch (err) {
      console.error('Failed to create tournament:', err);
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 h-screen flex flex-col">
      <header className="flex items-center gap-3 pt-6 pb-4 shrink-0">
        <button
          onClick={goBack}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          aria-label={step === 1 ? 'Back to home' : 'Previous step'}
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <p className="text-xs text-gray-400 font-medium">
            Step {step} of {TOTAL_STEPS}
          </p>
        </div>
      </header>

      {/* Step indicator dots */}
      <div className="flex gap-1.5 mb-6 shrink-0">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full flex-1 transition-colors ${
              i < step ? 'bg-primary' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 pb-6 overflow-hidden">
        {step === 1 && (
          <Step1Name
            value={name}
            onNext={(v) => {
              setName(v);
              setStep(2);
            }}
          />
        )}
        {step === 2 && (
          <Step2Format
            value={format}
            onNext={(f) => {
              setFormat(f);
              setStep(3);
            }}
          />
        )}
        {step === 3 && format && (
          <Step3Players
            format={format}
            value={players}
            onNext={(p) => {
              setPlayers(p);
              setStep(4);
            }}
          />
        )}
        {step === 4 && (
          <Step4Courts
            value={courts}
            playerCount={players.length}
            onNext={(c) => {
              setCourts(c);
              setStep(5);
            }}
          />
        )}
        {step === 5 && (
          <Step5Points
            value={points}
            onSelect={(p) => {
              setPoints(p);
              handleCreate(p);
            }}
          />
        )}
      </div>
    </div>
  );
}
