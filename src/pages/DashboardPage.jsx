import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, History, BarChart3, Dumbbell, LogOut, ChevronRight } from "lucide-react";
import axios from "axios";
import BottomNav from "../components/BottomNav";

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function DashboardPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      const [todayRes, historyRes] = await Promise.all([
        axios.get(`${API}/workouts/${user.id}/date/${today}`),
        axios.get(`${API}/workouts/${user.id}?limit=5`),
      ]);
      setTodayWorkout(todayRes.data);
      setRecentWorkouts(historyRes.data.filter((w) => w.date !== today).slice(0, 3));
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  };

  const getTotalStats = (workout) => {
    if (!workout?.exercises) return { exercises: 0, sets: 0 };
    const sets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    return { exercises: workout.exercises.length, sets };
  };

  return (
    <div className="app-container px-4 pt-6">
      <div className="fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-white/50 text-sm">Привет,</p>
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
          </div>
          <button
            data-testid="logout-button"
            onClick={onLogout}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-5 h-5 text-white/50" />
          </button>
        </div>

        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Сегодня</h2>
            <span className="text-white/40 text-sm">{formatDate(today)}</span>
          </div>

          {loading ? (
            <div className="text-white/30 text-center py-8">Загрузка...</div>
          ) : todayWorkout ? (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gradient">
                    {getTotalStats(todayWorkout).exercises}
                  </p>
                  <p className="text-white/50 text-xs">упражнений</p>
                </div>
                <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gradient">
                    {getTotalStats(todayWorkout).sets}
                  </p>
                  <p className="text-white/50 text-xs">подходов</p>
                </div>
              </div>
              <button
                data-testid="continue-workout-btn"
                onClick={() => navigate("/workout")}
                className="w-full liquid-button py-3 font-semibold flex items-center justify-center gap-2"
              >
                Продолжить тренировку
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-white/40 mb-4">Тренировка не начата</p>
              <button
                data-testid="start-workout-btn"
                onClick={() => navigate("/workout")}
                className="w-full liquid-button py-3 font-semibold flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Начать тренировку
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            data-testid="templates-btn"
            onClick={() => navigate("/templates")}
            className="glass-card p-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-colors"
          >
            <Dumbbell className="w-6 h-6 text-blue-400" />
            <span className="text-white/70 text-xs">Программы</span>
          </button>
          <button
            data-testid="history-btn"
            onClick={() => navigate("/history")}
            className="glass-card p-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-colors"
          >
            <History className="w-6 h-6 text-violet-400" />
            <span className="text-white/70 text-xs">История</span>
          </button>
          <button
            data-testid="stats-btn"
            onClick={() => navigate("/stats")}
            className="glass-card p-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-colors"
          >
            <BarChart3 className="w-6 h-6 text-pink-400" />
            <span className="text-white/70 text-xs">Статистика</span>
          </button>
        </div>

        {recentWorkouts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">
              Недавние тренировки
            </h2>
            <div className="space-y-2">
              {recentWorkouts.map((workout) => (
                <button
                  key={workout.id}
                  data-testid={`recent-workout-${workout.id}`}
                  onClick={() => navigate(`/workout/${workout.date}`)}
                  className="w-full glass-card p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-white/50" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">
                        {formatDate(workout.date)}
                      </p>
                      <p className="text-white/40 text-sm">
                        {getTotalStats(workout).exercises} упр. ·{" "}
                        {getTotalStats(workout).sets} подх.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/30" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav active="home" />
    </div>
  );
}
