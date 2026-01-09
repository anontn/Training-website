import { useState } from "react";
import { Dumbbell } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { API, BACKEND_URL } from "../utils/api";

export default function AuthPage({ onLogin }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Введите ваше имя");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/users`, { name: name.trim() });
      toast.success(`Добро пожаловать, ${response.data.name}!`);
      onLogin(response.data);
    } catch (error) {
      // Более информативное сообщение об ошибке
      if (error.code === "ECONNREFUSED" || error.message.includes("Network Error")) {
        toast.error(
          `Не удалось подключиться к серверу. Убедитесь, что бэкенд запущен на ${BACKEND_URL}`
        );
      } else if (error.response) {
        // Сервер ответил, но с ошибкой
        toast.error(`Ошибка сервера: ${error.response.data?.detail || error.response.statusText}`);
      } else {
        toast.error("Ошибка входа. Попробуйте снова.");
      }
      console.error("Ошибка при входе:", error);
      console.error("API URL:", API);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container flex flex-col items-center justify-center min-h-screen px-6">
      <div className="fade-in w-full max-w-sm">
        <div className="flex flex-col items-center mb-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
            <Dumbbell className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
            Тренировки
          </h1>
          <p className="text-white/50 text-center">
            Записывай прогресс, достигай целей
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-card p-6">
            <label className="block text-white/70 text-sm mb-2">
              Как вас зовут?
            </label>
            <input
              data-testid="name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите имя"
              className="w-full glass-input px-4 py-3 text-lg"
              autoFocus
            />
          </div>

          <button
            data-testid="login-button"
            type="submit"
            disabled={loading}
            className="w-full liquid-button py-4 text-lg font-semibold disabled:opacity-50"
          >
            {loading ? "Входим..." : "Начать"}
          </button>
        </form>
      </div>
    </div>
  );
}
