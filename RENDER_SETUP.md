# 🚀 Пошаговая инструкция настройки Render

## ⚠️ Если Render определил проект как Docker

Если при создании Web Service Render автоматически выбрал **Language: Docker**, выполните следующие шаги:

### Шаг 1: Измените Language
1. Найдите поле **Language** в форме
2. Измените значение с **`Docker`** на **`Python 3`**
3. После этого появятся поля **Build Command** и **Start Command**

### Шаг 2: Заполните настройки

**Основные поля:**
- **Name**: `workout-tracker-api` (любое имя)
- **Language**: `Python 3` ✅
- **Branch**: `main` (или ваша основная ветка)
- **Region**: выберите ближайший регион

**Команды (появятся после выбора Python 3):**
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn server_simple:app --host 0.0.0.0 --port $PORT`

**Остальные поля:**
- **Root Directory**: оставьте пустым
- **Health Check Path**: можно указать `/api` (опционально)
- **Auto-Deploy**: оставьте включенным
- **Build Filters / Included Paths**: оставьте пустым или добавьте:
  - `requirements.txt`
  - `server_simple.py`
  - НЕ добавляйте команды сюда!

### Шаг 3: Создайте сервис
Нажмите **"Create Web Service"**

---

## ✅ Правильная конфигурация

```
┌─────────────────────────────────────┐
│ Name: workout-tracker-api            │
│ Language: Python 3 ✅                │ ← Измените с Docker!
│ Branch: main                         │
│ Region: Oregon (US West)             │
├─────────────────────────────────────┤
│ Build Command:                      │
│ pip install -r requirements.txt      │ ← Команда сборки
├─────────────────────────────────────┤
│ Start Command:                      │
│ uvicorn server_simple:app...        │ ← Команда запуска
├─────────────────────────────────────┤
│ Build Filters:                      │
│ [пусто или пути к файлам]           │ ← НЕ команды!
└─────────────────────────────────────┘
```

---

## 🐛 Частые ошибки

### ❌ Ошибка: "Language: Docker" вместо Python
**Решение**: Измените Language на Python 3 в выпадающем списке

### ❌ Ошибка: "must match re" в Build Filters
**Решение**: Удалите команды из Included Paths, оставьте пустым или добавьте только пути к файлам

### ❌ Не видно полей Build Command / Start Command
**Решение**: Убедитесь, что выбрали Language: Python 3, а не Docker

---

## 📝 Альтернатива: Использование Docker

Если хотите использовать Docker (не рекомендуется для простого деплоя):
- Оставьте Language: Docker
- Убедитесь, что Dockerfile находится в корне проекта
- Render автоматически соберет и запустит контейнер

Но для простоты лучше использовать Python 3 напрямую.
