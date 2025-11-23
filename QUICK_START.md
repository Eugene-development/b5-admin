# 🚀 Quick Start - httpOnly Cookies Setup

## Быстрая настройка за 10 минут

### ✅ Что уже сделано (Frontend)

- ✅ hooks.server.js - извлечение JWT из httpOnly cookie
- ✅ HTTP client обновлен для `credentials: 'include'`
- ✅ Server-side утилиты созданы
- ✅ Страницы agents и clients мигрированы на SSR
- ✅ Документация создана

### 🔧 Что нужно сделать (Backend)

## ⚠️ ВАЖНО: Архитектура проекта

У вас **два отдельных backend проекта**:
- **b5-auth-2** - Аутентификация (login, register, logout)
- **b5-api-2** - API для данных (GraphQL, CRUD операции)

Оба проекта нужно обновить!

---

## 📦 Часть A: Обновление b5-auth-2 (Аутентификация)

### Шаг 1: Обновите AuthController (5 мин)

**Проект:** `b5-auth-2`

**Файл:** `app/Http/Controllers/Api/AuthController.php`

Скопируйте код из [BACKEND_IMPLEMENTATION.md](BACKEND_IMPLEMENTATION.md) секция "Шаг 1"

**Ключевые изменения:**
- В `login()`: добавьте создание и возврат httpOnly cookie
- В `logout()`: добавьте очистку cookie
- В `register()`: добавьте создание cookie

### Шаг 2: Обновите CORS в b5-auth-2 (1 мин)

**Проект:** `b5-auth-2`

**Файл:** `config/cors.php`

Замените:
```php
'supports_credentials' => false,
```

На:
```php
'supports_credentials' => true,  // IMPORTANT!
```

---

## 📦 Часть B: Обновление b5-api-2 (GraphQL API)

### Шаг 3: Создайте Middleware для чтения cookie (2 мин)

**Проект:** `b5-api-2`

**Файл:** `app/Http/Middleware/AuthenticateFromCookie.php`

Скопируйте код из [BACKEND_IMPLEMENTATION.md](BACKEND_IMPLEMENTATION.md) секция "Шаг 3"

**Что делает:** Читает JWT из httpOnly cookie и добавляет в Authorization header

### Шаг 4: Обновите CORS в b5-api-2 (1 мин)

**Проект:** `b5-api-2`

**Файл:** `config/cors.php`

```php
'supports_credentials' => true,  // IMPORTANT!
```

### Шаг 5: Зарегистрируйте Middleware (1 мин)

**Проект:** `b5-api-2`

**Файл:** `app/Http/Kernel.php`

В `$middlewareAliases` добавьте:
```php
'auth.cookie' => \App\Http\Middleware\AuthenticateFromCookie::class,
```

### Шаг 6: Примените Middleware к GraphQL (1 мин)

**Проект:** `b5-api-2`

**Файл:** `routes/web.php` (или где у вас GraphQL)

Добавьте `auth.cookie` middleware:
```php
Route::middleware(['auth.cookie'])->post('/graphql', ...);
```

## 🧪 Быстрый тест (2 мин)

### Терминал тест:

```bash
# 1. Login через b5-auth-2 и сохранить cookie
curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  -c cookies.txt -v

# Ожидаемый результат: Set-Cookie: b5_auth_token=...; HttpOnly

# 2. Проверить, что cookie установлен
grep b5_auth_token cookies.txt

# 3. GraphQL запрос к b5-api-2 с cookie
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"query":"{ users { id name email } }"}' \
  -v

# Ожидаемый результат: JSON с данными пользователей

# 4. Logout через b5-auth-2
curl -X POST http://localhost:8001/api/logout \
  -b cookies.txt \
  -c cookies.txt \
  -v

# Ожидаемый результат: Set-Cookie: b5_auth_token=deleted
```

**Порты:**
- `localhost:8001` - **b5-auth-2** (аутентификация)
- `localhost:8000` - **b5-api-2** (GraphQL API)

### Браузер тест:

1. Откройте http://localhost:5173/login
2. Войдите в систему
3. **F12** → **Application** → **Cookies**
4. Проверьте наличие `b5_auth_token` с флагом **HttpOnly**
5. Откройте http://localhost:5173/agents
6. **F12** → **Console** - должны быть логи:
   ```
   🔍 Agents page - agents array: [...]
   🔍 Agents page - agents length: X
   ```

## ✅ Ожидаемый результат

После настройки:

- ✅ Страница `/agents` показывает данные **сразу** без loading
- ✅ Страница `/clients` показывает данные **сразу** без loading
- ✅ Cookie `b5_auth_token` установлен с флагом HttpOnly
- ✅ Кнопка "Обновить" работает
- ✅ CRUD операции работают
- ✅ Logout очищает cookie

## 🐛 Если не работает

### 1. Cookie не устанавливается

**Проверьте:**
```bash
# В response должен быть Set-Cookie header
curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  -v 2>&1 | grep Set-Cookie
```

**Должно быть:**
```
< Set-Cookie: b5_auth_token=...; HttpOnly; Path=/; SameSite=lax
```

**Если нет:**
- Проверьте, что код из BACKEND_IMPLEMENTATION.md скопирован
- Проверьте `config/cors.php`: `supports_credentials => true`
- Перезапустите Laravel: `php artisan serve`

### 2. Страница показывает "Нет данных"

**Откройте Console (F12):**

**Если видите:**
```
🔍 Agents page - agents array: []
🔍 Agents page - agentsData: { needsClientLoad: true }
```

**Значит:** Cookie не отправляется с сервера

**Решение:**
1. Проверьте пункт 1 выше
2. Очистите cookies в браузере
3. Войдите заново

**Если видите:**
```
🔍 Agents page - agentsData: { error: "..." }
```

**Значит:** Ошибка на сервере

**Решение:**
1. Проверьте логи Laravel: `tail -f storage/logs/laravel.log`
2. Проверьте GraphQL endpoint
3. Проверьте, что middleware `auth.cookie` применен

### 3. Cookie есть, но данные не загружаются

**Проверьте Network tab:**
1. F12 → Network
2. Перезагрузите страницу
3. Найдите запрос к `/graphql` или `/agents`
4. Проверьте Request Headers:
   - Должен быть `Cookie: b5_auth_token=...`

**Если Cookie не отправляется:**
- Проверьте, что frontend использует `credentials: 'include'` ✅ (уже сделано)
- Проверьте SameSite policy в backend

**Если Cookie отправляется, но 401:**
- Проверьте middleware `auth.cookie` в routes
- Добавьте debug в middleware (см. BACKEND_IMPLEMENTATION.md)

## 📞 Нужна помощь?

Запустите все команды из секции "🧪 Быстрый тест" и отправьте результаты.

## 🎯 Следующие шаги

После успешной настройки:

1. Уберите debug логи из agents/+page.svelte
2. Мигрируйте остальные 17 страниц (используйте agents как шаблон)
3. Настройте production environment (Secure cookies, правильный domain)

## 📚 Полная документация

- [BACKEND_IMPLEMENTATION.md](BACKEND_IMPLEMENTATION.md) - Полная инструкция с кодом
- [BACKEND_COOKIE_SETUP.md](BACKEND_COOKIE_SETUP.md) - Спецификации и детали
- [SSR_MIGRATION_GUIDE.md](SSR_MIGRATION_GUIDE.md) - Миграция остальных страниц
- [SSR_MIGRATION_SUMMARY.md](SSR_MIGRATION_SUMMARY.md) - Общий обзор проекта
