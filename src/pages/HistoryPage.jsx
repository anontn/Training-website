import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Dumbbell, Trash2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import BottomNav from "../components/BottomNav";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { API } from "../utils/api";

export default function HistoryPage({ user }) {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    loadWorkouts();
  }, [user.id]);

  const loadWorkouts = async () => {
    try {
      const response = await axios.get(`${API}/workouts/${user.id}?limit=50`);
      setWorkouts(response.data || []);
    } catch (error) {
      console.error("Error loading workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkout = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API}/workouts/${deleteId}`);
      setWorkouts(workouts.filter((w) => w.id !== deleteId));
      toast.success("Тренировка удалена");
    } catch (error) {
      toast.error("Ошибка удаления");
    } finally {
      setDeleteId(null);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" });
  };

  const getTotalStats = (workout) => {
    if (!workout?.exercises) return { exercises: 0, sets: 0, totalWeight: 0 };
    let totalWeight = 0;
    let sets = 0;
    workout.exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        totalWeight += set.weight * set.reps;
        sets++;
      });
    });
    return { exercises: workout.exercises.length, sets, totalWeight: Math.round(totalWeight) };
  };

  const groupWorkoutsByMonth = () => {
    const grouped = {};
    workouts.forEach((workout) => {
      const date = new Date(workout.date);
      const key = date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(workout);
    });
    return grouped;
  };

  const groupedWorkouts = groupWorkoutsByMonth();

  return (
    <div className="app-container px-4 pt-6">
      <div className="fade-in flex flex-col h-full">
        {/* Зафиксированный заголовок */}
        <div className="flex items-center gap-4 mb-6 flex-shrink-0">
          <button
            data-testid="back-button"
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors touch-manipulation"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">История тренировок</h1>
        </div>

        {/* Скроллируемый контент */}
        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', minHeight: 0 }}>
          {loading ? (
            <div className="text-white/30 text-center py-20">Загрузка...</div>
          ) : workouts.length === 0 ? (
            <div className="text-center py-20">
              <Dumbbell className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">История пуста</p>
              <p className="text-white/30 text-sm">Начните первую тренировку</p>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
            {Object.entries(groupedWorkouts).map(([month, monthWorkouts]) => (
              <div key={month}>
                <h2 className="text-white/50 text-sm font-medium mb-3 capitalize">{month}</h2>
                <div className="space-y-2">
                  {monthWorkouts.map((workout) => {
                    const stats = getTotalStats(workout);
                    return (
                      <div key={workout.id} className="glass-card p-4 flex items-center gap-3" data-testid={`workout-card-${workout.id}`}>
                        <button onClick={() => navigate(`/workout/${workout.date}`)} className="flex-1 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 flex items-center justify-center">
                            <Dumbbell className="w-6 h-6 text-blue-400" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-white font-medium">{formatDate(workout.date)}</p>
                            <p className="text-white/40 text-sm">
                              {stats.exercises} упр. · {stats.sets} подх.
                              {stats.totalWeight > 0 && <> · {stats.totalWeight} кг</>}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-white/30" />
                        </button>
                        <button
                          data-testid={`delete-workout-${workout.id}`}
                          onClick={() => setDeleteId(workout.id)}
                          className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-white/40" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Удалить тренировку?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Это действие нельзя отменить. Все данные этой тренировки будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction onClick={deleteWorkout} className="bg-red-600 hover:bg-red-700 text-white">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav active="history" />
    </div>
  );
}
