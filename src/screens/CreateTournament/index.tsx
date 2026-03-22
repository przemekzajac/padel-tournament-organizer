import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function CreateTournament() {
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto px-4">
      <header className="flex items-center gap-3 pt-6 pb-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">New Tournament</h1>
      </header>
      <p className="text-gray-500">Wizard coming in Phase 2...</p>
    </div>
  );
}
