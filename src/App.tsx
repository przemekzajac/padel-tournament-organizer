import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/AuthGuard';
import { Home } from '@/screens/Home';
import { CreateTournament } from '@/screens/CreateTournament';
import { Tournament } from '@/screens/Tournament';
import { SignIn } from '@/screens/SignIn';
import { SignUp } from '@/screens/SignUp';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-full bg-gray-50">
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route
              path="/"
              element={
                <AuthGuard>
                  <Home />
                </AuthGuard>
              }
            />
            <Route
              path="/create"
              element={
                <AuthGuard>
                  <CreateTournament />
                </AuthGuard>
              }
            />
            <Route
              path="/tournament/:id"
              element={
                <AuthGuard>
                  <Tournament />
                </AuthGuard>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
