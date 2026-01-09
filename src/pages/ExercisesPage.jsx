import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Dumbbell } from "lucide-react";
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

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function ExercisesPage({ user }) {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    loadExercises();
  }, [user.id]);

  const loadExercises = async () => {
    try {
      const response = await axios.get(`${API}/exercises/${user.id}`);
      setExercises(response.data || []);
    } catch (error) {
      console.error("Error loading exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  const createExercise = async () => {
    if (!newName.trim()) {
      toast.error("Введите название упражнения");
      return;
    }
    try {
      const response = await axios.post(`${API}/exercises/${user.id}`, { name: newName.trim() });
      if (exercises.find((e) => e.id === response.data.id)) {
        toast.error("Упражнение уже существует");
      } else {
        setExercises([...exercises, response.data]);
        toast.success("Упражнение добавлено");
      }
      setNewName("");
    } catch (error) {
      toast.error("Ошибка создания");
    }
  };

  const deleteExercise = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API}/exercises/${deleteId}`);
      setExercises(exercises.filter((e) => e.id !== deleteId));
      toast.success("Упражнение удалено");
    } catch (error) {
      toast.error("Ошибка удаления");
    } finally {
      setDeleteId(null);
    }
  };

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
          <h1 className="text-xl font-bold text-white">Мои упражнения</h1>
        </div>

        <div className="glass-card p-4 mb-6">
          <div className="flex gap-2">
            <input
              data-testid="new-exercise-input"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Название упражнения"
              className="flex-1 glass-input px-4 py-3"
              onKeyPress={(e) => e.key === "Enter" && createExercise()}
            />
            <button data-testid="add-exercise-btn" onClick={createExercise} className="liquid-button px-4 py-3">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-white/30 text-center py-20">Загрузка...</div>
        ) : exercises.length === 0 ? (
          <div className="text-center py-20">
            <Dumbbell className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">Нет упражнений</p>
            <p className="text-white/30 text-sm">Добавьте первое упражнение</p>
          </div>
        ) : (
          <div className="space-y-2">
            {exercises.map((exercise) => (
              <div key={exercise.id} className="glass-card p-4 flex items-center justify-between" data-testid={`exercise-item-${exercise.id}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-white font-medium">{exercise.name}</span>
                </div>
                <button
                  data-testid={`delete-exercise-${exercise.id}`}
                  onClick={() => setDeleteId(exercise.id)}
                  className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-white/40" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Удалить упражнение?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Упражнение будет удалено из списка, но сохранится в истории тренировок.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction onClick={deleteExercise} className="bg-red-600 hover:bg-red-700 text-white">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav active="exercises" />
    </div>
  );
}
