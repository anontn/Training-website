# 📁 Структура проекта Workout Tracker

## ✅ Финальная структура (только нужные файлы):

```
polina site/
├── 📄 Конфигурация проекта
│   ├── package.json          # Зависимости Node.js
│   ├── package-lock.json     # Lock файл зависимостей
│   ├── vite.config.js        # Конфигурация Vite
│   ├── tailwind.config.js    # Конфигурация Tailwind CSS
│   ├── postcss.config.js     # Конфигурация PostCSS
│   └── .gitignore            # Игнорируемые файлы для Git
│
├── 📄 Бэкенд (Python/FastAPI)
│   ├── server_simple.py      # Главный файл API сервера
│   ├── requirements.txt      # Зависимости Python
│   └── Dockerfile            # Docker конфигурация для бэкенда
│
├── 📄 Фронтенд (React/Vite)
│   ├── index.html            # Главный HTML файл
│   └── src/                  # Исходный код приложения
│       ├── index.jsx         # Точка входа React
│       ├── App.jsx           # Главный компонент
│       ├── App.css           # Стили приложения
│       ├── index.css         # Глобальные стили + Tailwind
│       ├── components/       # Компоненты
│       │   ├── BottomNav.jsx # Нижняя навигация
│       │   └── ui/           # UI компоненты
│       │       ├── sonner.jsx
│       │       ├── dialog.jsx
│       │       ├── alert-dialog.jsx
│       │       └── select.jsx
│       └── pages/            # Страницы приложения
│           ├── AuthPage.jsx
│           ├── DashboardPage.jsx
│           ├── WorkoutPage.jsx
│           ├── HistoryPage.jsx
│           ├── StatsPage.jsx
│           ├── ExercisesPage.jsx
│           └── TemplatesPage.jsx
│
├── 📄 Документация
│   ├── README.md             # Главная документация
│   ├── DEPLOY.md             # Инструкция по деплою
│   ├── QUICK_START.md        # Быстрый старт
│   ├── MOBILE_ACCESS.md      # Доступ с мобильного
│   └── PROJECT_STRUCTURE.md  # Этот файл
│
└── 📄 Деплой
    ├── Dockerfile            # Docker образ
    └── .dockerignore         # Игнорируемые файлы для Docker

```

## 🗑️ Что было удалено:

- ❌ `App.css`, `App.js` - старые файлы (дубликаты)
- ❌ `AuthPage.jsx`, `BottomNav.jsx` в корне - старые файлы
- ❌ `index.css` в корне - старая версия
- ❌ `pages/` в корне - старая папка
- ❌ `components/` в корне - старая папка
- ❌ `backend.env`, `env-template.txt` - временные файлы

## 📝 Важные файлы:

- ✅ `.env` - переменные окружения (НЕ коммитить в Git!)
- ✅ `node_modules/` - устанавливаются через `npm install`
- ✅ `.DS_Store` - системный файл Mac (игнорируется в Git)

## 🚀 Команды для работы:

```bash
# Установка зависимостей
npm install

# Запуск фронтенда (разработка)
npm run dev

# Сборка фронтенда (продакшен)
npm run build

# Запуск бэкенда
python3 server_simple.py
```

## 📦 Что будет создано автоматически:

- `dist/` - собранный фронтенд (после `npm run build`)
- `node_modules/` - зависимости (после `npm install`)
- `.env` - создаётся вручную (см. `.env.example` если есть)
