# Scripts - Agri Platform

Вспомогательные скрипты для развертывания и управления Agri Platform.

## Содержание

- [deploy.sh](#deploysh) - Развертывание приложения
- [health-check.sh](#health-checksh) - Проверка здоровья сервисов

---

## deploy.sh

Автоматизированный скрипт развертывания с поддержкой режимов разработки и production.

### Использование

```bash
# Режим разработки (по умолчанию)
./scripts/deploy.sh

# Или явно
./scripts/deploy.sh dev

# Production режим
./scripts/deploy.sh prod
```

### Режимы

#### Development (dev)

- Запускает все контейнеры с Docker Compose
- Автоматически ждет инициализации сервисов
- Выводит доступные адреса и команды

**Примерный вывод:**

```
🚀 Agri Platform Deployment Script
==================================
Environment: dev
Version: latest
Registry: docker.io

✓ Docker установлен
✓ Docker Compose установлен
✓ Проект находится в: /path/to/agri-platform

=> Запуск в режиме разработки...
✓ Контейнеры запущены
=> Ожидание инициализации сервисов (30-60 сек)...
✨ Агри Платформа запущена!

📍 Доступные сервисы:
   Frontend:        http://localhost:3000
   API Gateway:     http://localhost:8000
   Swagger Docs:    http://localhost:8080
   Grafana:         http://localhost:3000 (admin/admin)
   Prometheus:      http://localhost:9090
   Loki:            http://localhost:3100
```

#### Production (prod)

- Проверяет необходимые переменные окружения
- Построит Docker образы без кэша
- Тегирует образы с версией
- Публикует образы в Docker Registry

**Требуемые переменные:**

```bash
export DOCKER_USERNAME=yourusername
export DOCKER_REGISTRY=docker.io  # опционально, по умолчанию docker.io
export VERSION=1.0.0              # опционально, по умолчанию latest
```

**Примерная последовательность:**

```bash
# 1. Установить переменные
export DOCKER_USERNAME=myusername
export VERSION=1.0.0

# 2. Запустить deploy
./scripts/deploy.sh prod

# 3. Ввести учетные данные Docker Hub
# (будет запрос на логин в Docker Registry)

# 4. Образы будут построены, помечены и опубликованы
```

### Требования

- ✅ Docker 20.10+
- ✅ Docker Compose 2.0+
- ✅ curl (для проверки сервисов)
- ✅ git (для определения корневой папки проекта)

---

## health-check.sh

Скрипт для проверки статуса всех сервисов и зависимостей.

### Использование

```bash
./scripts/health-check.sh
```

### Результаты проверки

Проверяет следующие группы:

1. **Infrastructure Services**
   - PostgreSQL
   - MongoDB
   - Kafka

2. **Application Services**
   - API Gateway (Port 8000)
   - Product Service (Port 8003)
   - Order Service (Port 8001)
   - Delivery Service (Port 8004)
   - Query Service (Port 8002)

3. **Monitoring Stack**
   - Grafana (Port 3000)
   - Prometheus (Port 9090)
   - Loki (Port 3100)
   - Tempo (Port 3200)

4. **Frontend**
   - React App (Port 3000)
   - Swagger UI (Port 8080)

5. **Docker Containers**
   - Проверяет количество запущенных контейнеров
   - Показывает статус каждого контейнера

### Пример вывода

```
🏥 Agri Platform Health Check
==============================

🔍 Checking Services...

Infrastructure Services:
⊘ PostgreSQL: URL не указан
⊘ MongoDB: URL не указан
⊘ Kafka: URL не указан

Application Services:
✓ API Gateway: OK (HTTP 200)
✓ Product Service: OK (HTTP 200)
✓ Order Service: OK (HTTP 200)
✓ Delivery Service: OK (HTTP 200)
✓ Query Service: OK (HTTP 200)

Monitoring Stack:
✓ Grafana: OK (HTTP 200)
✓ Prometheus: OK (HTTP 200)
✓ Loki: OK (HTTP 200)
✓ Tempo: OK (HTTP 200)

Frontend:
✓ React App: OK (HTTP 200)
✓ Swagger UI: OK (HTTP 200)

Container Status:
✓ All containers running (12/12)

==============================
Summary:
  Passed: 10
  Failed: 0

✨ All systems operational!

Quick Links:
  📱 Frontend:   http://localhost:3000
  🔗 API:        http://localhost:8000
  📖 Swagger:    http://localhost:8080
  📊 Grafana:    http://localhost:3000
```

### Статус выхода

```bash
# Успех (все сервисы работают)
echo $?  # 0

# Ошибка (некоторые сервисы не работают)
echo $?  # 1
```

---

## Рекомендуемый рабочий процесс

### Первоначальное развертывание

```bash
# 1. Клонировать репозиторий
git clone https://github.com/yourusername/agri-platform.git
cd agri-platform

# 2. Убедиться, что скрипты исполняемые
chmod +x scripts/*.sh

# 3. Развернуть в режиме разработки
./scripts/deploy.sh dev

# 4. Проверить статус
./scripts/health-check.sh
```

### Ежедневный старт/стоп

```bash
# Запустить сервисы
docker-compose up -d

# Проверить статус
./scripts/health-check.sh

# Остановить сервисы
docker-compose down
```

### Подготовка к production

```bash
# Установить переменные
export DOCKER_USERNAME=myusername
export VERSION=1.0.0

# Запустить production deploy
./scripts/deploy.sh prod

# Проверить образы
docker images | grep $DOCKER_USERNAME
```

### Отладка проблем

```bash
# Проверить статус контейнеров
docker-compose ps

# Просмотреть логи сервиса
docker-compose logs -f api-gateway

# Выполнить health check
./scripts/health-check.sh

# Перезагрузить сервис
docker-compose restart api-gateway

# Пересоздать сервис
docker-compose down
docker-compose up -d api-gateway
```

---

## Переменные окружения

### Для develop

```bash
# Обычно не требуются - используются значения по умолчанию
docker-compose up -d
```

### Для production

```bash
# Требуемые
export DOCKER_USERNAME=your-docker-username

# Опциональные
export DOCKER_REGISTRY=docker.io
export VERSION=1.0.0
export LOG_LEVEL=info
export NODE_ENV=production
```

---

## Устранение неполадок

### Скрипт не выполняется

```bash
# Сделать скрипт исполняемым
chmod +x scripts/deploy.sh
chmod +x scripts/health-check.sh

# Или запустить через bash
bash scripts/deploy.sh
```

### Ошибки на M1/M2 Mac

```bash
# Убедиться в правильной архитектуре
docker version
uname -m  # должно показать arm64

# Переполнить образы
docker-compose build --no-cache
```

### Проблемы с памятью

```bash
# Увеличить лимит Docker
# macOS: Docker Desktop → Settings → Resources → Memory: 8GB

# Linux: проверить доступную память
free -h

# Остановить неиспользуемые контейнеры
docker system prune -a
```

### Ошибки портов

```bash
# Проверить, какие процессы используют порты
lsof -i :8000   # API Gateway
lsof -i :3000   # Frontend & Grafana
lsof -i :5432   # PostgreSQL

# Убить процесс
kill -9 <PID>

# Или используйте разные порты в docker-compose.yml
```

---

## Дополнительные команды

```bash
# Просмотр всех контейнеров
docker-compose ps -a

# Просмотр логов всех сервисов
docker-compose logs -f

# Логи конкретного сервиса в реальном времени
docker-compose logs -f api-gateway

# Выполнить команду в контейнере
docker-compose exec api-gateway bash

# Перестроить конкретный сервис
docker-compose up -d --build product-service

# Удалить все данные и пересоздать
docker-compose down -v
docker-compose up -d
```

---

## Поддержка

Для проблем с развертыванием:

1. Запустите `./scripts/health-check.sh`
2. Проверьте логи: `docker-compose logs -f`
3. Смотрите [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)
4. Откройте issue на GitHub

---

**Версия**: 1.0.0  
**Последнее обновление**: 2024  
**Автор**: Agri Platform Team
