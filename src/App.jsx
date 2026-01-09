import { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import WorkoutPage from "./pages/WorkoutPage";
import HistoryPage from "./pages/HistoryPage";
import StatsPage from "./pages/StatsPage";
import ExercisesPage from "./pages/ExercisesPage";
import TemplatesPage from "./pages/TemplatesPage";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("workout_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("workout_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("workout_user");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/50">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="neon-glow blue" />
      <div className="neon-glow violet" />
      <BrowserRouter>
        <Routes>
          {!user ? (
            <>
              <Route path="/" element={<AuthPage onLogin={handleLogin} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<DashboardPage user={user} onLogout={handleLogout} />} />
              <Route path="/workout" element={<WorkoutPage user={user} />} />
              <Route path="/workout/:date" element={<WorkoutPage user={user} />} />
              <Route path="/history" element={<HistoryPage user={user} />} />
              <Route path="/stats" element={<StatsPage user={user} />} />
              <Route path="/exercises" element={<ExercisesPage user={user} />} />
              <Route path="/templates" element={<TemplatesPage user={user} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
