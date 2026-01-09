import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Check, X, Play, Pause, RotateCcw, Settings } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import BottomNav from "../components/BottomNav";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { API } from "../utils/api";

export default function WorkoutPage({ user }) {
  const navigate = useNavigate();
  const { date: paramDate } = useParams();
  const today = new Date().toISOString().split("T")[0];
  const workoutDate = paramDate || today;
  const isToday = workoutDate === today;

  const [exercises, setExercises] = useState([]);
  const [userExercises, setUserExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  
  // Таймер отдыха
  const [restTime, setRestTime] = useState(90); // секунды по умолчанию
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    loadData();
    // Загружаем сохранённое время отдыха из localStorage
    const savedRestTime = localStorage.getItem("restTime");
    if (savedRestTime) {
      setRestTime(parseInt(savedRestTime));
    }
  }, [user.id, workoutDate]);

  // Таймер отдыха
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            // Уведомление когда таймер закончился
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Время отдыха истекло!', {
                body: 'Можно начинать следующий подход',
                icon: '/favicon.ico'
              });
            }
            toast.success("⏱️ Время отдыха истекло! Можно начинать следующий подход");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, timerSeconds]);

  // Запрос разрешения на уведомления
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const startTimer = () => {
    setTimerSeconds(restTime);
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resumeTimer = () => {
    if (timerSeconds > 0) {
      setIsTimerRunning(true);
    }
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRestTimeChange = (newTime) => {
    setRestTime(newTime);
    localStorage.setItem("restTime", newTime.toString());
    setShowTimerSettings(false);
  };

  const loadData = async () => {
    try {
      const [workoutRes, exercisesRes] = await Promise.all([
        axios.get(`${API}/workouts/${user.id}/date/${workoutDate}`),
        axios.get(`${API}/exercises/${user.id}`),
      ]);
      if (workoutRes.data) {
        setExercises(workoutRes.data.exercises || []);
      }
      setUserExercises(exercisesRes.data || []);
    } catch (error) {
      console.error("Error loading workout:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveWorkout = async (updatedExercises) => {
    setSaving(true);
    try {
      await axios.post(`${API}/workouts/${user.id}`, {
        date: workoutDate,
        exercises: updatedExercises,
      });
    } catch (error) {
      console.error("Error saving workout:", error);
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const addExerciseToWorkout = (exercise) => {
    const exists = exercises.find((e) => e.exercise_id === exercise.id);
    if (exists) {
      toast.error("Упражнение уже добавлено");
      return;
    }
    const updated = [...exercises, { exercise_id: exercise.id, exercise_name: exercise.name, sets: [] }];
    setExercises(updated);
    saveWorkout(updated);
    setShowExerciseModal(false);
    toast.success(`${exercise.name} добавлено`);
  };

  const createAndAddExercise = async () => {
    if (!newExerciseName.trim()) {
      toast.error("Введите название упражнения");
      return;
    }
    try {
      const response = await axios.post(`${API}/exercises/${user.id}`, { name: newExerciseName.trim() });
      setUserExercises([...userExercises, response.data]);
      addExerciseToWorkout(response.data);
      setNewExerciseName("");
    } catch (error) {
      toast.error("Ошибка создания упражнения");
    }
  };

  const removeExerciseFromWorkout = (exerciseId) => {
    const updated = exercises.filter((e) => e.exercise_id !== exerciseId);
    setExercises(updated);
    saveWorkout(updated);
    toast.success("Упражнение удалено");
  };

  const updateSet = (exerciseId, setIndex, field, value) => {
    // Разрешаем пустую строку для редактирования
    const numValue = value === "" ? "" : (parseFloat(value) || 0);
    const updated = exercises.map((ex) => {
      if (ex.exercise_id === exerciseId) {
        const newSets = [...ex.sets];
        newSets[setIndex] = { ...newSets[setIndex], [field]: numValue };
        return { ...ex, sets: newSets };
      }
      return ex;
    });
    setExercises(updated);
  };

  const saveSetChanges = () => {
    // Нормализуем данные: пустые строки превращаем в 0
    const normalized = exercises.map(ex => ({
      ...ex,
      sets: ex.sets.map(set => ({
        weight: set.weight === "" ? 0 : (typeof set.weight === 'number' ? set.weight : parseFloat(set.weight) || 0),
        reps: set.reps === "" ? 0 : (typeof set.reps === 'number' ? set.reps : parseFloat(set.reps) || 0)
      }))
    }));
    setExercises(normalized);
    saveWorkout(normalized);
  };

  const addSet = (exerciseId, autoStartTimer = true) => {
    const updated = exercises.map((ex) => {
      if (ex.exercise_id === exerciseId) {
        // Создаем пустой подход (без значений по умолчанию)
        return {
          ...ex,
          sets: [
            ...ex.sets,
            { weight: "", reps: "" },
          ],
        };
      }
      return ex;
    });
    setExercises(updated);
    saveWorkout(updated);
    
    // Автозапуск таймера после добавления подхода (если это не первый подход)
    const exercise = updated.find(ex => ex.exercise_id === exerciseId);
    if (autoStartTimer && exercise && exercise.sets.length > 1) {
      startTimer();
    }
  };

  const removeSet = (exerciseId, setIndex) => {
    const updated = exercises.map((ex) => {
      if (ex.exercise_id === exerciseId) {
        return { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex) };
      }
      return ex;
    });
    setExercises(updated);
    saveWorkout(updated);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
  };

  return (
    <div className="app-container px-4 pt-6">
      <div className="fade-in">
        <div className="flex items-center gap-4 mb-6">
          <button
            data-testid="back-button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{isToday ? "Сегодня" : formatDate(workoutDate)}</h1>
            {saving && <p className="text-white/30 text-xs">Сохранение...</p>}
          </div>
        </div>

        {loading ? (
          <div className="text-white/30 text-center py-20">Загрузка...</div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {exercises.map((exercise) => (
                <div key={exercise.exercise_id} className="glass-card p-4 slide-up" data-testid={`exercise-card-${exercise.exercise_id}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">{exercise.exercise_name}</h3>
                    <button
                      data-testid={`remove-exercise-${exercise.exercise_id}`}
                      onClick={() => removeExerciseFromWorkout(exercise.exercise_id)}
                      className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>

                  {exercise.sets.length > 0 && (
                    <div className="grid grid-cols-12 gap-2 mb-2 text-white/40 text-xs px-2">
                      <div className="col-span-2">№</div>
                      <div className="col-span-4">Вес (кг)</div>
                      <div className="col-span-4">Повторы</div>
                      <div className="col-span-2"></div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {exercise.sets.map((set, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center set-row">
                        <div className="col-span-2 text-white/50 text-sm pl-2">{index + 1}</div>
                        <div className="col-span-4">
                          <input
                            data-testid={`weight-input-${exercise.exercise_id}-${index}`}
                            type="number"
                            value={set.weight === "" || set.weight === 0 ? "" : set.weight}
                            onChange={(e) => {
                              const val = e.target.value;
                              // Разрешаем пустую строку или валидное число
                              if (val === "" || !isNaN(parseFloat(val)) || val === "-" || val === ".") {
                                updateSet(exercise.exercise_id, index, "weight", val);
                              }
                            }}
                            onBlur={saveSetChanges}
                            className="w-full glass-input px-3 py-2 text-sm text-center"
                            min="0"
                            step="0.5"
                          />
                        </div>
                        <div className="col-span-4">
                          <input
                            data-testid={`reps-input-${exercise.exercise_id}-${index}`}
                            type="number"
                            value={set.reps === "" || set.reps === 0 ? "" : set.reps}
                            onChange={(e) => {
                              const val = e.target.value;
                              // Разрешаем пустую строку или валидное число
                              if (val === "" || !isNaN(parseFloat(val)) || val === "-") {
                                updateSet(exercise.exercise_id, index, "reps", val);
                              }
                            }}
                            onBlur={saveSetChanges}
                            className="w-full glass-input px-3 py-2 text-sm text-center"
                            min="0"
                          />
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <button
                            data-testid={`remove-set-${exercise.exercise_id}-${index}`}
                            onClick={() => removeSet(exercise.exercise_id, index)}
                            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                          >
                            <X className="w-4 h-4 text-white/40" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    data-testid={`add-set-${exercise.exercise_id}`}
                    onClick={() => addSet(exercise.exercise_id)}
                    className="w-full mt-3 py-2 rounded-xl bg-white/5 text-white/60 text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить подход
                  </button>
                  
                  {/* Start timer button - показываем после первого подхода */}
                  {exercise.sets.length > 0 && (
                    <button
                      onClick={startTimer}
                      className="w-full mt-2 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 text-sm flex items-center justify-center gap-2 hover:bg-blue-600/30 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Начать отдых ({formatTime(restTime)})
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              data-testid="add-exercise-btn"
              onClick={() => setShowExerciseModal(true)}
              className="w-full liquid-button py-4 font-semibold flex items-center justify-center gap-2 mb-6"
            >
              <Plus className="w-5 h-5" />
              Добавить упражнение
            </button>

            {exercises.length === 0 && (
              <div className="text-center text-white/30 py-10">
                <p>Нажмите кнопку выше, чтобы добавить первое упражнение</p>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={showExerciseModal} onOpenChange={setShowExerciseModal}>
        <DialogContent className="bg-zinc-900 border-white/10 max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Выберите упражнение</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                data-testid="new-exercise-input"
                type="text"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                placeholder="Новое упражнение"
                className="flex-1 glass-input px-4 py-2"
                onKeyPress={(e) => e.key === "Enter" && createAndAddExercise()}
              />
              <button
                data-testid="create-exercise-btn"
                onClick={createAndAddExercise}
                className="liquid-button px-4 py-2"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {userExercises.length > 0 && (
              <div className="border-t border-white/10 pt-4">
                <p className="text-white/40 text-sm mb-2">Ваши упражнения:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {userExercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      data-testid={`select-exercise-${exercise.id}`}
                      onClick={() => addExerciseToWorkout(exercise)}
                      className="w-full glass-card p-3 text-left text-white hover:bg-white/10 transition-colors flex items-center justify-between"
                    >
                      <span>{exercise.name}</span>
                      <Check className="w-4 h-4 text-white/30" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Таймер отдыха - плавающий компонент */}
      {(timerSeconds > 0 || isTimerRunning) && (
        <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto z-40">
          <div className="glass-card p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isTimerRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-white/60 text-sm">Отдых</span>
              </div>
              <button
                onClick={() => setShowTimerSettings(true)}
                className="text-white/40 hover:text-white/60 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            
            <div className="text-center mb-3">
              <div className="text-4xl font-bold text-white mb-1">
                {formatTime(timerSeconds)}
              </div>
              <div className="text-white/40 text-xs">
                {isTimerRunning ? 'Отдыхайте...' : 'На паузе'}
              </div>
            </div>

            <div className="flex gap-2">
              {isTimerRunning ? (
                <button
                  onClick={pauseTimer}
                  className="flex-1 liquid-button py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  Пауза
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  className="flex-1 liquid-button py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Продолжить
                </button>
              )}
              <button
                onClick={resetTimer}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={stopTimer}
                className="px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-center justify-center hover:bg-red-500/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Настройки таймера */}
      <Dialog open={showTimerSettings} onOpenChange={setShowTimerSettings}>
        <DialogContent className="bg-zinc-900 border-white/10 max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Настройка времени отдыха</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-white/70 text-sm mb-3 block">Время отдыха (секунды)</label>
              <div className="grid grid-cols-4 gap-2">
                {[60, 90, 120, 180].map((time) => (
                  <button
                    key={time}
                    onClick={() => handleRestTimeChange(time)}
                    className={`py-3 rounded-xl font-semibold transition-colors ${
                      restTime === time
                        ? 'liquid-button text-white'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {formatTime(time)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-white/70 text-sm mb-2 block">Или введите своё</label>
              <input
                type="number"
                value={restTime}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 60;
                  setRestTime(Math.max(30, Math.min(600, value))); // от 30 до 600 секунд
                }}
                className="w-full glass-input px-4 py-3 text-center text-lg"
                min="30"
                max="600"
                step="10"
              />
              <button
                onClick={() => handleRestTimeChange(restTime)}
                className="w-full mt-3 liquid-button py-2.5 font-semibold"
              >
                Сохранить
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav active="workout" />
    </div>
  );
}
