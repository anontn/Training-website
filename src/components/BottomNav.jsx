import { useNavigate } from "react-router-dom";
import { Home, Dumbbell, History, BarChart3 } from "lucide-react";

export default function BottomNav({ active }) {
  const navigate = useNavigate();

  const items = [
    { id: "home", icon: Home, label: "Главная", path: "/" },
    { id: "workout", icon: Dumbbell, label: "Тренировка", path: "/workout" },
    { id: "history", icon: History, label: "История", path: "/history" },
    { id: "stats", icon: BarChart3, label: "Стата", path: "/stats" },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;

        return (
          <button
            key={item.id}
            data-testid={`nav-${item.id}`}
            onClick={() => navigate(item.path)}
            className={`nav-item ${isActive ? "active" : ""}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px]">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
