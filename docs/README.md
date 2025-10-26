# B5 Admin Panel

Административная панель для проекта Bonus5, построенная на SvelteKit.

## Настройка окружения

Проект использует переменные окружения для конфигурации. Создайте файлы окружения:

```sh
# Скопируйте example файлы
cp .env.development.example .env.development
cp .env.production.example .env.production
```

При необходимости отредактируйте переменные в файлах под ваше окружение.

### Переменные окружения

- `VITE_API_BASE_URL` - URL GraphQL API сервера
- `VITE_AUTH_API_URL` - URL сервера аутентификации
- `VITE_FRONTEND_URL` - URL frontend приложения

## Разработка

Установите зависимости и запустите dev сервер:

```sh
npm install
npm run dev

# или откройте в браузере автоматически
npm run dev -- --open

# для тестирования с production конфигурацией
npm run dev:prod
```

## Сборка

Для создания production версии:

```sh
npm run build        # production сборка
npm run build:dev    # development сборка для тестирования
```

Предварительный просмотр production сборки:

```sh
npm run preview
```

## Структура проекта

- `/src/lib/config/api.js` - конфигурация API endpoints
- `/src/routes/` - страницы и маршруты приложения
- `/static/` - статические файлы
