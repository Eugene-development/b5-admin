# Архитектура проекта Bonus5

## Обзор системы

Проект Bonus5 состоит из **трех отдельных приложений**:

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                         b5-admin                                 │
│                    (SvelteKit + SSR)                            │
│                   http://localhost:5173                          │
└────────────┬────────────────────────────┬───────────────────────┘
             │                            │
             │ Auth requests              │ Data requests
             │ (login/logout)             │ (GraphQL)
             │                            │
             ▼                            ▼
┌─────────────────────────┐    ┌──────────────────────────┐
│   BACKEND AUTH          │    │   BACKEND API            │
│   b5-auth-2             │    │   b5-api-2               │
│   (Laravel + JWT)       │    │   (Laravel + GraphQL)    │
│   http://localhost:8001 │    │   http://localhost:8000  │
└─────────────────────────┘    └──────────────────────────┘
```

## Компоненты системы

### 1. Frontend: b5-admin (SvelteKit)

**Порт:** `http://localhost:5173`

**Ответственность:**
- UI и UX
- Server-Side Rendering (SSR)
- Client-side state management
- Routing

**Ключевые файлы:**
- `src/hooks.server.js` - SSR authentication middleware
- `src/lib/api/server.js` - Server-side GraphQL utilities
- `src/lib/api/client.js` - Client-side HTTP client
- `src/lib/state/auth.svelte.js` - Authentication state

### 2. Backend Auth: b5-auth-2 (Laravel)

**Порт:** `http://localhost:8001`

**Ответственность:**
- Аутентификация пользователей (login/register)
- Выдача JWT токенов
- Установка/удаление httpOnly cookies
- Управление сессиями

**API Endpoints:**
- `POST /api/login` - Вход в систему
- `POST /api/register` - Регистрация
- `POST /api/logout` - Выход
- `GET /api/user` - Получение текущего пользователя
- `POST /api/forgot-password` - Восстановление пароля
- `POST /api/reset-password` - Сброс пароля

**Технологии:**
- Laravel
- JWT (tymon/jwt-auth)
- httpOnly cookies

### 3. Backend API: b5-api-2 (Laravel + GraphQL)

**Порт:** `http://localhost:8000`

**Ответственность:**
- GraphQL API для всех данных
- CRUD операции
- Бизнес-логика
- Авторизация доступа к данным

**API Endpoints:**
- `POST /graphql` - Единая точка входа для всех запросов

**GraphQL Queries:**
- `users` - Получение пользователей
- `clients` - Получение клиентов
- `projects` - Получение проектов
- `orders` - Получение заказов
- И другие...

**Технологии:**
- Laravel
- GraphQL (lighthouse-php)
- JWT authentication

## Поток аутентификации

### 1. Login (Вход в систему)

```
User                    b5-admin              b5-auth-2
  │                        │                      │
  │  1. Submit login form  │                      │
  ├───────────────────────>│                      │
  │                        │  2. POST /api/login  │
  │                        ├─────────────────────>│
  │                        │                      │
  │                        │  3. Validate & JWT   │
  │                        │     + httpOnly cookie│
  │                        │<─────────────────────┤
  │                        │                      │
  │  4. Redirect + cookie  │                      │
  │<───────────────────────┤                      │
  │                        │                      │
```

**Детали:**
1. Пользователь отправляет форму логина
2. Frontend отправляет POST запрос к b5-auth-2
3. b5-auth-2 проверяет credentials, создает JWT токен
4. b5-auth-2 возвращает:
   - JSON: `{ user, token }`
   - Cookie: `Set-Cookie: b5_auth_token=<JWT>; HttpOnly; SameSite=lax`
5. Frontend сохраняет user data, redirect на dashboard

### 2. SSR Page Load (Загрузка страницы)

```
Browser              b5-admin (SSR)          b5-api-2
  │                        │                      │
  │  1. GET /agents        │                      │
  ├───────────────────────>│                      │
  │   Cookie: b5_auth_token│                      │
  │                        │                      │
  │                        │ 2. Extract JWT from  │
  │                        │    httpOnly cookie   │
  │                        │    (hooks.server.js) │
  │                        │                      │
  │                        │ 3. POST /graphql     │
  │                        │    Authorization:    │
  │                        │    Bearer <JWT>      │
  │                        ├─────────────────────>│
  │                        │                      │
  │                        │ 4. Validate JWT      │
  │                        │    + return data     │
  │                        │<─────────────────────┤
  │                        │                      │
  │                        │ 5. Render HTML       │
  │                        │    with data         │
  │                        │                      │
  │  6. HTML with data     │                      │
  │<───────────────────────┤                      │
  │   Cookie: b5_auth_token│                      │
```

**Детали:**
1. Browser запрашивает страницу /agents с httpOnly cookie
2. SvelteKit SSR (`hooks.server.js`) извлекает JWT из cookie
3. SSR load function делает GraphQL запрос к b5-api-2 с JWT
4. b5-api-2 валидирует JWT (через middleware) и возвращает данные
5. SvelteKit рендерит HTML с данными
6. Browser получает готовый HTML с данными

### 3. Client-Side Request (CRUD операция)

```
Browser              b5-admin (Client)       b5-api-2
  │                        │                      │
  │  1. Click "Delete"     │                      │
  ├───────────────────────>│                      │
  │                        │                      │
  │                        │ 2. POST /graphql     │
  │                        │    mutation delete   │
  │                        │    Cookie: b5_auth_  │
  │                        │           token      │
  │                        ├─────────────────────>│
  │                        │                      │
  │                        │ 3. Read cookie via   │
  │                        │    middleware        │
  │                        │    + validate JWT    │
  │                        │    + delete record   │
  │                        │                      │
  │                        │ 4. Success response  │
  │                        │<─────────────────────┤
  │                        │                      │
  │  5. Update UI          │                      │
  │<───────────────────────┤                      │
```

**Детали:**
1. Пользователь выполняет действие (delete/update/create)
2. Frontend отправляет GraphQL mutation к b5-api-2
3. Cookie автоматически отправляется браузером
4. b5-api-2 middleware читает cookie, извлекает JWT, добавляет в header
5. GraphQL resolver получает authenticated user и выполняет операцию
6. Frontend обновляет UI

### 4. Logout (Выход из системы)

```
User                b5-admin           b5-auth-2
  │                    │                    │
  │  1. Click Logout   │                    │
  ├───────────────────>│                    │
  │                    │  2. POST /logout   │
  │                    ├───────────────────>│
  │                    │   Cookie: token    │
  │                    │                    │
  │                    │  3. Invalidate JWT │
  │                    │     Clear cookie   │
  │                    │<───────────────────┤
  │                    │   Set-Cookie:      │
  │                    │   deleted          │
  │                    │                    │
  │                    │ 4. Clear local     │
  │                    │    state           │
  │                    │                    │
  │  5. Redirect /login│                    │
  │<───────────────────┤                    │
```

## Безопасность

### httpOnly Cookies

**Преимущества:**
- ✅ Защита от XSS - JavaScript не может прочитать cookie
- ✅ Автоматическая отправка с каждым запросом
- ✅ SameSite защита от CSRF

**Cookie спецификация:**
```
Set-Cookie: b5_auth_token=<JWT>;
  HttpOnly;                    // Защита от XSS
  Secure;                      // Только HTTPS (production)
  SameSite=lax;                // Защита от CSRF
  Path=/;                      // Доступен для всех путей
  Max-Age=3600                 // 1 час (или JWT TTL)
```

### CORS Configuration

Оба backend должны разрешать credentials:

```php
// config/cors.php
'supports_credentials' => true,
'allowed_origins' => [
    'http://localhost:5173',  // Frontend dev
],
```

### Middleware Chain

**b5-auth-2:**
```
Request → CORS → AuthController → Response + Cookie
```

**b5-api-2:**
```
Request → CORS → AuthenticateFromCookie → JWT Auth → GraphQL → Response
```

## Конфигурация

### Environment Variables

**.env для b5-admin:**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_AUTH_API_URL=http://localhost:8001
```

**.env для b5-auth-2:**
```env
APP_URL=http://localhost:8001
FRONTEND_URL=http://localhost:5173
SESSION_DOMAIN=localhost
JWT_TTL=60
```

**.env для b5-api-2:**
```env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
SESSION_DOMAIN=localhost
```

## Deployment Notes

### Development
- Frontend: `npm run dev` (port 5173)
- b5-auth-2: `php artisan serve --port=8001`
- b5-api-2: `php artisan serve --port=8000`

### Production

**Важно:**
1. Включить Secure flag для cookies (HTTPS only)
2. Настроить правильный domain для cookies
3. Обновить CORS allowed_origins
4. Использовать environment-specific JWT secrets

## Troubleshooting

### Cookie не устанавливается

**Проблема:** После login cookie не появляется

**Проверьте:**
1. b5-auth-2: AuthController возвращает cookie
2. b5-auth-2: CORS `supports_credentials: true`
3. Frontend: fetch использует `credentials: 'include'`
4. Domains совпадают или cookie domain правильный

### Cookie не отправляется к b5-api-2

**Проблема:** GraphQL запросы получают 401

**Проверьте:**
1. Cookie domain позволяет отправку на localhost:8000
2. SameSite policy не блокирует
3. b5-api-2: middleware `auth.cookie` применен к /graphql
4. Frontend: fetch использует `credentials: 'include'`

### JWT валидация не работает

**Проблема:** Token валидный, но 401 ошибка

**Проверьте:**
1. JWT_SECRET одинаковый в b5-auth-2 и b5-api-2
2. Middleware правильно извлекает token из cookie
3. Middleware добавляет token в Authorization header
4. JWT не истек (проверьте TTL)

## Схема взаимодействия файлов

```
b5-admin/
├── src/
│   ├── hooks.server.js              ← Читает cookie, добавляет в locals
│   ├── lib/
│   │   ├── api/
│   │   │   ├── server.js            ← SSR GraphQL requests (b5-api-2)
│   │   │   ├── client.js            ← Client GraphQL requests (b5-api-2)
│   │   │   └── auth.js              ← Auth requests (b5-auth-2)
│   │   └── state/
│   │       └── auth.svelte.js       ← Login/Logout через b5-auth-2
│   └── routes/
│       └── (protected)/
│           └── agents/
│               ├── +page.server.js  ← Использует server.js (b5-api-2)
│               └── +page.svelte     ← Использует client.js (b5-api-2)

b5-auth-2/
├── app/Http/Controllers/Api/
│   └── AuthController.php           ← Login/Logout + httpOnly cookie
├── config/
│   └── cors.php                     ← supports_credentials: true
└── routes/
    └── api.php                      ← /api/login, /api/logout

b5-api-2/
├── app/Http/Middleware/
│   └── AuthenticateFromCookie.php   ← Читает cookie → Authorization header
├── config/
│   └── cors.php                     ← supports_credentials: true
└── routes/
    └── web.php                      ← /graphql с middleware auth.cookie
```

## Summary

Ключевые моменты архитектуры:
1. **Три отдельных приложения** работают независимо
2. **httpOnly cookie** устанавливается b5-auth-2, читается всеми
3. **JWT токен** создается b5-auth-2, валидируется b5-api-2
4. **SSR** работает через hooks.server.js с cookie из request
5. **Client-side** запросы автоматически отправляют cookie
6. **CORS** должен быть настроен в обоих backend с `supports_credentials: true`
