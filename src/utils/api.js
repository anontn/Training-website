// Автоматическое определение URL бэкенда
// Если переменная окружения установлена, используем её
// Если пустая строка - используем относительные пути (для Nginx прокси)
// Иначе определяем автоматически: если открыто с IP - используем IP, иначе localhost
function getBackendUrl() {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  
  // Если переменная явно установлена как пустая строка - используем относительные пути (для прокси)
  if (envUrl === "") {
    return "";
  }
  
  // Если переменная установлена и не пустая - используем её
  if (envUrl) {
    return envUrl;
  }
  
  // Автоматическое определение только для локальной разработки
  // Определяем текущий хост
  const hostname = window.location.hostname;
  
  // Если открыто с IP адреса (не localhost), используем тот же IP для бэкенда
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    return `http://${hostname}:3000`;
  }
  
  // По умолчанию localhost
  return "http://localhost:3000";
}

export const BACKEND_URL = getBackendUrl();
// Если BACKEND_URL пустой, используем относительные пути (для прокси)
export const API = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";
