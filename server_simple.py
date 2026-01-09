from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import os

app = FastAPI()

# CORS настройки
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
# Для продакшена рекомендуется указать конкретные домены вместо "*"
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS + ["*"],  # Разрешаем все для упрощения (можно ограничить для продакшена)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Простое хранилище данных в памяти
users_db = {}
exercises_db = {}
workouts_db = {}
templates_db = {}
records_db = {}

# Pydantic модели
class UserCreate(BaseModel):
    name: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ExerciseCreate(BaseModel):
    name: str

class Exercise(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SetData(BaseModel):
    weight: float
    reps: int

class WorkoutExercise(BaseModel):
    exercise_id: str
    exercise_name: str
    sets: List[SetData]

class Workout(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: str
    exercises: List[WorkoutExercise]
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class WorkoutCreate(BaseModel):
    date: str
    exercises: List[WorkoutExercise]

class ExerciseStats(BaseModel):
    date: str
    max_weight: float
    total_reps: int
    total_sets: int

# Модели для шаблонов тренировок
class TemplateExercise(BaseModel):
    exercise_id: str
    exercise_name: str
    # Поля опциональные для обратной совместимости (больше не используются)
    target_sets: Optional[int] = None
    target_reps: Optional[int] = None
    target_weight: Optional[float] = None

class WorkoutTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str  # "День ног", "Push day" и т.д.
    exercises: List[TemplateExercise]
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TemplateCreate(BaseModel):
    name: str
    exercises: List[TemplateExercise]

# Модель для персональных рекордов
class PersonalRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    exercise_id: str
    exercise_name: str
    max_weight: float
    reps: int
    date: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# API endpoints
@app.get("/")
async def root():
    return {"message": "Workout Tracker API - Simple Version (In-Memory Storage)"}

@app.get("/api")
async def api_root():
    return {"message": "API is running", "version": "1.0-simple"}

# Users
@app.post("/api/users", response_model=User)
async def create_or_get_user(input: UserCreate):
    # Проверяем существует ли пользователь
    for user in users_db.values():
        if user["name"] == input.name:
            return User(**user)
    
    # Создаем нового пользователя
    user = User(name=input.name)
    users_db[user.id] = user.model_dump()
    return user

@app.get("/api/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return User(**users_db[user_id])

# Exercises
@app.get("/api/exercises/{user_id}", response_model=List[Exercise])
async def get_exercises(user_id: str):
    user_exercises = [Exercise(**ex) for ex in exercises_db.values() if ex["user_id"] == user_id]
    return user_exercises

@app.post("/api/exercises/{user_id}", response_model=Exercise)
async def create_exercise(user_id: str, input: ExerciseCreate):
    # Проверяем существует ли упражнение
    for ex in exercises_db.values():
        if ex["user_id"] == user_id and ex["name"] == input.name:
            return Exercise(**ex)
    
    # Создаем новое упражнение
    exercise = Exercise(user_id=user_id, name=input.name)
    exercises_db[exercise.id] = exercise.model_dump()
    return exercise

@app.delete("/api/exercises/{exercise_id}")
async def delete_exercise(exercise_id: str):
    if exercise_id not in exercises_db:
        raise HTTPException(status_code=404, detail="Упражнение не найдено")
    del exercises_db[exercise_id]
    return {"message": "Упражнение удалено"}

# Workouts
@app.get("/api/workouts/{user_id}", response_model=List[Workout])
async def get_workouts(user_id: str, limit: int = 50):
    user_workouts = [Workout(**w) for w in workouts_db.values() if w["user_id"] == user_id]
    user_workouts.sort(key=lambda x: x.date, reverse=True)
    return user_workouts[:limit]

@app.get("/api/workouts/{user_id}/date/{date}", response_model=Optional[Workout])
async def get_workout_by_date(user_id: str, date: str):
    for workout in workouts_db.values():
        if workout["user_id"] == user_id and workout["date"] == date:
            return Workout(**workout)
    return None

@app.post("/api/workouts/{user_id}", response_model=Workout)
async def create_or_update_workout(user_id: str, input: WorkoutCreate):
    # Ищем существующую тренировку
    existing_id = None
    for wid, workout in workouts_db.items():
        if workout["user_id"] == user_id and workout["date"] == input.date:
            existing_id = wid
            break
    
    if existing_id:
        # Обновляем существующую
        workouts_db[existing_id]["exercises"] = [e.model_dump() for e in input.exercises]
        return Workout(**workouts_db[existing_id])
    
    # Создаем новую
    workout = Workout(user_id=user_id, date=input.date, exercises=input.exercises)
    workouts_db[workout.id] = workout.model_dump()
    return workout

@app.delete("/api/workouts/{workout_id}")
async def delete_workout(workout_id: str):
    if workout_id not in workouts_db:
        raise HTTPException(status_code=404, detail="Тренировка не найдена")
    del workouts_db[workout_id]
    return {"message": "Тренировка удалена"}

# Stats
@app.get("/api/stats/{user_id}/{exercise_id}", response_model=List[ExerciseStats])
async def get_exercise_stats(user_id: str, exercise_id: str, limit: int = 30):
    stats = []
    
    # Собираем статистику из всех тренировок
    user_workouts = [w for w in workouts_db.values() if w["user_id"] == user_id]
    user_workouts.sort(key=lambda x: x["date"], reverse=True)
    
    for workout in user_workouts[:limit]:
        for ex in workout.get("exercises", []):
            if ex.get("exercise_id") == exercise_id:
                sets = ex.get("sets", [])
                if sets:
                    max_weight = max(s.get("weight", 0) for s in sets)
                    total_reps = sum(s.get("reps", 0) for s in sets)
                    stats.append(ExerciseStats(
                        date=workout["date"],
                        max_weight=max_weight,
                        total_reps=total_reps,
                        total_sets=len(sets)
                    ))
                break
    
    # Возвращаем в хронологическом порядке
    stats.reverse()
    return stats

# Workout Templates
@app.get("/api/templates/{user_id}", response_model=List[WorkoutTemplate])
async def get_templates(user_id: str):
    user_templates = [WorkoutTemplate(**t) for t in templates_db.values() if t["user_id"] == user_id]
    user_templates.sort(key=lambda x: x.created_at, reverse=True)
    return user_templates

@app.post("/api/templates/{user_id}", response_model=WorkoutTemplate)
async def create_template(user_id: str, input: TemplateCreate):
    template = WorkoutTemplate(user_id=user_id, name=input.name, exercises=input.exercises)
    templates_db[template.id] = template.model_dump()
    return template

@app.put("/api/templates/{template_id}", response_model=WorkoutTemplate)
async def update_template(template_id: str, input: TemplateCreate):
    if template_id not in templates_db:
        raise HTTPException(status_code=404, detail="Шаблон не найден")
    templates_db[template_id]["name"] = input.name
    templates_db[template_id]["exercises"] = [e.model_dump() for e in input.exercises]
    return WorkoutTemplate(**templates_db[template_id])

@app.delete("/api/templates/{template_id}")
async def delete_template(template_id: str):
    if template_id not in templates_db:
        raise HTTPException(status_code=404, detail="Шаблон не найден")
    del templates_db[template_id]
    return {"message": "Шаблон удален"}

# Personal Records
@app.get("/api/records/{user_id}", response_model=List[PersonalRecord])
async def get_records(user_id: str):
    user_records = [PersonalRecord(**r) for r in records_db.values() if r["user_id"] == user_id]
    user_records.sort(key=lambda x: x.max_weight, reverse=True)
    return user_records

@app.get("/api/records/{user_id}/{exercise_id}", response_model=Optional[PersonalRecord])
async def get_exercise_record(user_id: str, exercise_id: str):
    for record in records_db.values():
        if record["user_id"] == user_id and record["exercise_id"] == exercise_id:
            return PersonalRecord(**record)
    return None

@app.post("/api/records/{user_id}", response_model=PersonalRecord)
async def update_record(user_id: str, record: PersonalRecord):
    # Проверяем существует ли рекорд для этого упражнения
    existing_id = None
    for rid, r in records_db.items():
        if r["user_id"] == user_id and r["exercise_id"] == record.exercise_id:
            existing_id = rid
            break
    
    if existing_id:
        # Обновляем только если новый результат лучше
        if record.max_weight > records_db[existing_id]["max_weight"]:
            records_db[existing_id] = record.model_dump()
            return record
        return PersonalRecord(**records_db[existing_id])
    
    # Создаем новый рекорд
    records_db[record.id] = record.model_dump()
    return record

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print("🚀 Запуск упрощенного сервера (данные в памяти)")
    print(f"📊 API доступен на: http://0.0.0.0:{port}")
    print(f"📝 Документация: http://0.0.0.0:{port}/docs")
    uvicorn.run(app, host="0.0.0.0", port=port)
