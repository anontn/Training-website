import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import BottomNav from "../components/BottomNav";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function StatsPage({ user }) {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    loadExercises();
  }, [user.id]);

  useEffect(() => {
    if (selectedExercise) {
      loadStats(selectedExercise);
    }
  }, [selectedExercise]);

  const loadExercises = async () => {
    try {
      const response = await axios.get(`${API}/exercises/${user.id}`);
      setExercises(response.data || []);
      if (response.data?.length > 0) {
        setSelectedExercise(response.data[0].id);
      }
    } catch (error) {
      console.error("Error loading exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (exerciseId) => {
    setStatsLoading(true);
    try {
      const response = await axios.get(`${API}/stats/${user.id}/${exerciseId}?limit=30`);
      setStats(response.data || []);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  const getProgress = () => {
    if (stats.length < 2) return null;
    const first = stats[0];
    const last = stats[stats.length - 1];
    const weightChange = last.max_weight - first.max_weight;
    const repsChange = last.total_reps - first.total_reps;
    return {
      weightChange,
      weightPercent: first.max_weight > 0 ? Math.round((weightChange / first.max_weight) * 100) : 0,
      repsChange,
      repsPercent: first.total_reps > 0 ? Math.round((repsChange / first.total_reps) * 100) : 0,
    };
  };

  const progress = getProgress();
  const selectedExerciseName = exercises.find((e) => e.id === selectedExercise)?.name;

  return (
    <div className="app-container px-4 pt-6">
      <div className="fade-in">
        <div className="flex items-center gap-4 mb-6">
          <button
            data-testid="back-button"
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Статистика</h1>
        </div>

        {loading ? (
          <div className="text-white/30 text-center py-20">Загрузка...</div>
        ) : exercises.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/40">Нет упражнений</p>
            <p className="text-white/30 text-sm">Добавьте упражнения и запишите тренировки</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="text-white/50 text-sm mb-2 block">Выберите упражнение</label>
              <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                <SelectTrigger className="glass-input border-white/10 text-white" data-testid="exercise-selector">
                  <SelectValue placeholder="Выберите упражнение" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  {exercises.map((exercise) => (
                    <SelectItem
                      key={exercise.id}
                      value={exercise.id}
                      className="text-white focus:bg-white/10 focus:text-white"
                      data-testid={`stat-exercise-${exercise.id}`}
                    >
                      {exercise.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {statsLoading ? (
              <div className="text-white/30 text-center py-10">Загрузка...</div>
            ) : stats.length === 0 ? (
              <div className="glass-card p-6 text-center">
                <p className="text-white/40">Нет данных</p>
                <p className="text-white/30 text-sm">Запишите тренировку с этим упражнением</p>
              </div>
            ) : (
              <>
                {progress && (
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="glass-card p-4">
                      <p className="text-white/50 text-sm mb-1">Изменение веса</p>
                      <p className={`text-2xl font-bold ${progress.weightChange > 0 ? "text-green-400" : progress.weightChange < 0 ? "text-red-400" : "text-white/40"}`}>
                        {progress.weightChange > 0 ? "+" : ""}{progress.weightChange} кг
                      </p>
                      <p className="text-white/30 text-xs">
                        {progress.weightPercent > 0 ? "+" : ""}{progress.weightPercent}% за период
                      </p>
                    </div>
                    <div className="glass-card p-4">
                      <p className="text-white/50 text-sm mb-1">Изменение повторов</p>
                      <p className={`text-2xl font-bold ${progress.repsChange > 0 ? "text-green-400" : progress.repsChange < 0 ? "text-red-400" : "text-white/40"}`}>
                        {progress.repsChange > 0 ? "+" : ""}{progress.repsChange}
                      </p>
                      <p className="text-white/30 text-xs">
                        {progress.repsPercent > 0 ? "+" : ""}{progress.repsPercent}% за период
                      </p>
                    </div>
                  </div>
                )}

                <div className="glass-card p-4 mb-6">
                  <h3 className="text-white font-semibold mb-4">Детали - {selectedExerciseName}</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {[...stats].reverse().map((stat, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <span className="text-white/60 text-sm">{formatDate(stat.date)}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-blue-400">{stat.max_weight} кг</span>
                          <span className="text-violet-400">{stat.total_reps} повт.</span>
                          <span className="text-white/40">{stat.total_sets} подх.</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <BottomNav active="stats" />
    </div>
  );
}
