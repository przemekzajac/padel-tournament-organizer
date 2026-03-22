import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from '@/screens/Home';
import { CreateTournament } from '@/screens/CreateTournament';
import { Tournament } from '@/screens/Tournament';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-full bg-gray-50">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateTournament />} />
          <Route path="/tournament/:id" element={<Tournament />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
