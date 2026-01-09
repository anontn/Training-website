# 🚀 Инструкция по развертыванию Workout Tracker

## Вариант 1: Бесплатный хостинг (Рекомендуется для начала)

### Фронтенд на Vercel (бесплатно)
### Бэкенд на Render или Railway (бесплатно)

---

## Шаг 1: Подготовка проекта

### 1.1. Создайте файл `.vercelignore` (опционально)
```
node_modules
.env
.env.local
```

---

## Шаг 2: Деплой фронтенда на Vercel

### 2.1. Установите Vercel CLI (если еще не установлен)
```bash
npm install -g vercel
```

### 2.2. Войдите в Vercel
```bash
vercel login
```

### 2.3. Настройте переменные окружения
В корне проекта создайте `.env.production`:
```env
VITE_BACKEND_URL=https://your-backend-url.onrender.com
```

### 2.4. Соберите проект
```bash
npm run build
```

### 2.5. Задеплойте
```bash
vercel --prod
```

**Или через веб-интерфейс:**
1. Перейдите на [vercel.com](https://vercel.com)
2. Импортируйте ваш GitHub репозиторий
3. Настройте:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: `VITE_BACKEND_URL=https://your-backend-url.onrender.com`

---

## Шаг 3: Деплой бэкенда на Render

### 3.1. Создайте `requirements.txt`
```bash
cd "/Users/antonkoshelev/Documents/Web-разработка/polina site"
cat > requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-dotenv==1.0.0
EOF
```

### 3.2. Создайте `render.yaml` (опционально)
```yaml
services:
  - type: web
    name: workout-tracker-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn server_simple:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
```

### 3.3. Деплой на Render
1. Перейдите на [render.com](https://render.com)
2. Создайте новый **Web Service**
3. Подключите GitHub репозиторий
4. Настройки:
   - **Name**: `workout-tracker-api`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server_simple:app --host 0.0.0.0 --port $PORT`
   - **Port**: Render автоматически установит `$PORT`

### 3.4. Настройте CORS в бэкенде
В `server_simple.py` измените:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Или укажите конкретный домен фронтенда
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Вариант 2: Один сервер (VPS)

### Требования:
- VPS с Ubuntu/Debian
- Python 3.11+
- Node.js 18+
- Nginx (опционально)

### Шаг 1: Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Python
sudo apt install python3 python3-pip python3-venv -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Установка Nginx (опционально)
sudo apt install nginx -y
```

### Шаг 2: Клонирование проекта

```bash
# На сервере
cd /var/www
sudo git clone YOUR_REPO_URL workout-tracker
cd workout-tracker
```

### Шаг 3: Настройка бэкенда

```bash
# Создание виртуального окружения
python3 -m venv venv
source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt

# Создание systemd сервиса
sudo nano /etc/systemd/system/workout-api.service
```

Содержимое файла:
```ini
[Unit]
Description=Workout Tracker API
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/workout-tracker
Environment="PATH=/var/www/workout-tracker/venv/bin"
ExecStart=/var/www/workout-tracker/venv/bin/uvicorn server_simple:app --host 0.0.0.0 --port 8000

[Install]
WantedBy=multi-user.target
```

Запуск:
```bash
sudo systemctl daemon-reload
sudo systemctl enable workout-api
sudo systemctl start workout-api
```

### Шаг 4: Настройка фронтенда

```bash
# Установка зависимостей
npm install

# Сборка проекта
# ⚠️ ВАЖНО: Обязательно установите VITE_BACKEND_URL перед сборкой!
# Если используете Nginx прокси (вариант А):
echo "VITE_BACKEND_URL=" > .env.production
# Или если бэкенд на отдельном домене/порту (вариант Б):
# echo "VITE_BACKEND_URL=http://your-domain.com:8000" > .env.production

npm run build
```

**Вариант А: Бэкенд через Nginx прокси (рекомендуется)**
- Установите `VITE_BACKEND_URL=` (пустое значение)
- Код автоматически будет использовать относительные пути `/api`
- Бэкенд будет доступен через `your-domain.com/api`

**Вариант Б: Бэкенд на отдельном порту**
- Установите `VITE_BACKEND_URL=http://your-domain.com:8000`
- Или `VITE_BACKEND_URL=http://YOUR_SERVER_IP:8000` если без домена

### Шаг 5: Настройка Nginx

```bash
sudo nano /etc/nginx/sites-available/workout-tracker
```

**Вариант А: С прокси для API (рекомендуется)**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Фронтенд
    location / {
        root /var/www/workout-tracker/dist;
        try_files $uri $uri/ /index.html;
    }

    # Бэкенд API через прокси
    location /api {
        proxy_pass http://localhost:8000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Вариант Б: Без прокси (бэкенд на отдельном порту)**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Только фронтенд
    location / {
        root /var/www/workout-tracker/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

Активация:
```bash
sudo ln -s /etc/nginx/sites-available/workout-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Вариант 3: Docker (Простой способ)

### Создайте `Dockerfile` для бэкенда:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server_simple.py .

EXPOSE 8000

CMD ["uvicorn", "server_simple:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Создайте `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - PORT=8000
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        - VITE_BACKEND_URL=http://localhost:8000
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

**⚠️ Важно для Docker:**
- Если фронтенд и бэкенд в разных контейнерах, используйте имя сервиса: `VITE_BACKEND_URL=http://backend:8000`
- Если бэкенд доступен снаружи: `VITE_BACKEND_URL=http://YOUR_SERVER_IP:8000`
- Переменные окружения для Vite должны быть установлены во время сборки (через `args` в Dockerfile)

### Dockerfile для фронтенда:

```dockerfile
FROM node:18-alpine AS build

# Аргумент для URL бэкенда (можно переопределить при сборке)
ARG VITE_BACKEND_URL=http://localhost:8000
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Если нужен кастомный nginx.conf, раскомментируйте:
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Сборка с кастомным URL:**
```bash
docker build --build-arg VITE_BACKEND_URL=http://your-backend-url:8000 -f Dockerfile.frontend -t workout-frontend .
```

---

## ⚠️ Важные замечания:

1. **Переменные окружения**: 
   - ⚠️ **ОБЯЗАТЕЛЬНО** установите `VITE_BACKEND_URL` в продакшене!
   - Автоматическое определение работает только для локальной разработки
   - В Vercel: Settings → Environment Variables → добавить `VITE_BACKEND_URL`
   - В Docker: передайте через `--build-arg` при сборке
   - В VPS: создайте `.env.production` перед `npm run build`
2. **CORS**: Настройте правильные домены в бэкенде (`server_simple.py`)
3. **HTTPS**: Используйте SSL сертификат (Let's Encrypt бесплатный)
4. **База данных**: Сейчас данные хранятся в памяти - при перезапуске пропадут. Для продакшена лучше использовать реальную БД
5. **Nginx прокси**: Если используете прокси для `/api`, установите `VITE_BACKEND_URL=` (пустое значение) для использования относительных путей

---

## 🐛 Troubleshooting:

### Бэкенд не запускается
- Проверьте логи: `sudo journalctl -u workout-api -f`
- Проверьте порт: `sudo netstat -tlnp | grep 8000`

### CORS ошибки
- Проверьте `allow_origins` в `server_simple.py`
- Убедитесь что URL фронтенда правильный

### Фронтенд не подключается к бэкенду
- Проверьте `VITE_BACKEND_URL` в `.env.production`
- Пересоберите проект после изменения переменных

---

## 📝 Рекомендации для продакшена:

1. Используйте реальную БД (PostgreSQL/MongoDB)
2. Настройте HTTPS
3. Добавьте логирование
4. Настройте мониторинг
5. Используйте переменные окружения для секретов
