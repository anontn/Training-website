import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Play, Edit2, Dumbbell } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import BottomNav from "../components/BottomNav";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
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

export default function TemplatesPage({ user }) {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [userExercises, setUserExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  
  // Форма создания шаблона
  const [templateName, setTemplateName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [newExerciseName, setNewExerciseName] = useState("");

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      const [templatesRes, exercisesRes] = await Promise.all([
        axios.get(`${API}/templates/${user.id}`),
        axios.get(`${API}/exercises/${user.id}`),
      ]);
      setTemplates(templatesRes.data || []);
      setUserExercises(exercisesRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const startWorkoutFromTemplate = async (template) => {
    const today = new Date().toISOString().split("T")[0];
    try {
      // Создаем тренировку из шаблона - только список упражнений без подходов
      const exercises = template.exercises.map(ex => ({
        exercise_id: ex.exercise_id,
        exercise_name: ex.exercise_name,
        sets: [] // Пустые подходы, будут добавляться во время тренировки
      }));

      await axios.post(`${API}/workouts/${user.id}`, {
        date: today,
        exercises: exercises
      });
      
      toast.success(`Тренировка "${template.name}" начата!`);
      navigate("/workout");
    } catch (error) {
      console.error("Error starting workout:", error);
      toast.error("Ошибка создания тренировки");
    }
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Введите название шаблона");
      return;
    }
    if (selectedExercises.length === 0) {
      toast.error("Добавьте хотя бы одно упражнение");
      return;
    }

    try {
      const templateData = {
        name: templateName.trim(),
        exercises: selectedExercises
      };

      if (editingTemplate) {
        await axios.put(`${API}/templates/${editingTemplate.id}`, templateData);
        toast.success("Шаблон обновлен");
      } else {
        await axios.post(`${API}/templates/${user.id}`, templateData);
        toast.success("Шаблон создан");
      }

      loadData();
      closeModal();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Ошибка сохранения");
    }
  };

  const deleteTemplate = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API}/templates/${deleteId}`);
      setTemplates(templates.filter(t => t.id !== deleteId));
      toast.success("Шаблон удален");
    } catch (error) {
      toast.error("Ошибка удаления");
    } finally {
      setDeleteId(null);
    }
  };

  const openCreateModal = () => {
    setEditingTemplate(null);
    setTemplateName("");
    setSelectedExercises([]);
    setShowCreateModal(true);
  };

  const openEditModal = (template) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    // Убираем поля target_sets, target_reps, target_weight при редактировании
    setSelectedExercises(template.exercises.map(ex => ({
      exercise_id: ex.exercise_id,
      exercise_name: ex.exercise_name
    })));
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingTemplate(null);
    setTemplateName("");
    setSelectedExercises([]);
    setNewExerciseName("");
  };

  const addExerciseToTemplate = (exercise) => {
    if (selectedExercises.find(e => e.exercise_id === exercise.id)) {
      toast.error("Упражнение уже добавлено");
      return;
    }
    setSelectedExercises([...selectedExercises, {
      exercise_id: exercise.id,
      exercise_name: exercise.name
    }]);
  };

  const removeExerciseFromTemplate = (exerciseId) => {
    setSelectedExercises(selectedExercises.filter(e => e.exercise_id !== exerciseId));
  };

  const createAndAddExercise = async () => {
    if (!newExerciseName.trim()) {
      toast.error("Введите название упражнения");
      return;
    }

    try {
      const response = await axios.post(`${API}/exercises/${user.id}`, {
        name: newExerciseName.trim()
      });
      
      setUserExercises([...userExercises, response.data]);
      addExerciseToTemplate(response.data);
      setNewExerciseName("");
      toast.success("Упражнение добавлено");
    } catch (error) {
      console.error("Error creating exercise:", error);
      toast.error("Ошибка создания упражнения");
    }
  };

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
          <h1 className="text-xl font-bold text-white">Программы тренировок</h1>
        </div>

        {/* Зафиксированная кнопка создания */}
        <button
          onClick={openCreateModal}
          className="w-full liquid-button py-4 font-semibold flex items-center justify-center gap-2 mb-6 flex-shrink-0 touch-manipulation"
        >
          <Plus className="w-5 h-5" />
          Создать программу
        </button>

        {/* Скроллируемый список шаблонов */}
        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', minHeight: 0 }}>
          {loading ? (
            <div className="text-white/30 text-center py-20">Загрузка...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-20">
              <Dumbbell className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">Нет программ</p>
              <p className="text-white/30 text-sm">Создайте свою первую программу</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="glass-card p-4"
                data-testid={`template-${template.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {template.name}
                    </h3>
                    <p className="text-white/40 text-sm">
                      {template.exercises.length} упражнений
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(template)}
                      className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-white/60" />
                    </button>
                    <button
                      onClick={() => setDeleteId(template.id)}
                      className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-white/60" />
                    </button>
                  </div>
                </div>

                {/* Exercises preview */}
                <div className="space-y-2 mb-3">
                  {template.exercises.map((ex, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-white/60">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                      <span>{ex.exercise_name}</span>
                    </div>
                  ))}
                </div>

                {/* Start button */}
                <button
                  onClick={() => startWorkoutFromTemplate(template)}
                  className="w-full liquid-button py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Начать тренировку
                </button>
              </div>
            ))}
            </div>
          )}
        </div>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={closeModal}>
        <DialogContent className="bg-zinc-900 border-white/10 max-w-lg mx-auto max-h-[90vh] flex flex-col p-0 overflow-hidden">
          {/* Зафиксированный заголовок */}
          <DialogHeader className="p-6 pb-4 flex-shrink-0 border-b border-white/10">
            <DialogTitle className="text-white">
              {editingTemplate ? "Редактировать программу" : "Новая программа"}
            </DialogTitle>
          </DialogHeader>

          {/* Скроллируемый контент */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4" style={{ WebkitOverflowScrolling: 'touch', minHeight: 0 }}>
            <div className="space-y-4">
              {/* Template name */}
              <div>
                <label className="text-white/70 text-sm mb-2 block">Название</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="День ног, Push day..."
                  className="w-full glass-input px-4 py-3"
                />
              </div>

              {/* Selected exercises */}
              {selectedExercises.length > 0 && (
                <div>
                  <label className="text-white/70 text-sm mb-2 block">Упражнения ({selectedExercises.length})</label>
                  <div className="space-y-2">
                    {selectedExercises.map((ex) => (
                      <div key={ex.exercise_id} className="glass-card p-3 flex items-center justify-between">
                        <span className="text-white font-medium">{ex.exercise_name}</span>
                        <button
                          onClick={() => removeExerciseFromTemplate(ex.exercise_id)}
                          className="text-red-400 hover:text-red-300 touch-manipulation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add exercises */}
              <div>
                <label className="text-white/70 text-sm mb-2 block">Добавить упражнения</label>
                
                {/* Create new exercise */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newExerciseName}
                    onChange={(e) => setNewExerciseName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && createAndAddExercise()}
                    placeholder="Новое упражнение"
                    className="flex-1 glass-input px-3 py-2 text-sm"
                  />
                  <button
                    onClick={createAndAddExercise}
                    className="liquid-button px-4 py-2 flex items-center touch-manipulation"
                    title="Создать и добавить"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Existing exercises list */}
                {userExercises.length > 0 ? (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto overscroll-contain border-t border-white/10 pt-3" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {userExercises.map((exercise) => {
                      const isAdded = selectedExercises.find(e => e.exercise_id === exercise.id);
                      return (
                        <button
                          key={exercise.id}
                          onClick={() => !isAdded && addExerciseToTemplate(exercise)}
                          disabled={isAdded}
                          className={`w-full glass-card p-2 text-left text-sm transition-colors flex items-center justify-between touch-manipulation ${
                            isAdded 
                              ? "opacity-50 cursor-not-allowed text-white/40" 
                              : "text-white hover:bg-white/10 cursor-pointer"
                          }`}
                        >
                          <span>{exercise.name}</span>
                          {isAdded && (
                            <span className="text-xs text-green-400">✓ Добавлено</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-white/40 text-sm border-t border-white/10 pt-3">
                    Нет упражнений. Создайте новое выше ↑
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Зафиксированная кнопка внизу */}
          <div className="p-6 pt-4 border-t border-white/10 flex-shrink-0">
            <button
              onClick={saveTemplate}
              className="w-full liquid-button py-3 font-semibold touch-manipulation"
            >
              {editingTemplate ? "Сохранить изменения" : "Создать программу"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Удалить программу?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction onClick={deleteTemplate} className="bg-red-600 hover:bg-red-700 text-white">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav active="exercises" />
      </div>
    </div>
  );
}
