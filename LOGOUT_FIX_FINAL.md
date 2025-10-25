# Финальное решение проблемы с logout на localhost

## Проблема
После logout cookie `b5_auth_2_session` удалялись, но **сразу снова появлялись** при переходе на любую страницу.

## Причина
Laravel middleware `StartSession` создавал новую сессию при **каждом** запросе к API, даже если session cookie не было. Это происходило потому, что:

1. После logout браузер делал запрос к SvelteKit серверу (например, `/login`)
2. SvelteKit `+layout.server.js` делал запрос к `/api/user` для проверки аутентификации
3. Laravel middleware `StartSession` видел запрос без session cookie и создавал **новую** сессию
4. Новый session cookie отправлялся в браузер
5. Пользователь оставался "залогиненным" с новой пустой сессией

## Решение

### 1. Создан кастомный middleware `StartSessionIfExists`

**Файл:** `b5-auth-2/app/Http/Middleware/StartSessionIfExists.php`

Этот middleware расширяет стандартный `StartSession` и добавляет логику:

- **Для POST/PUT/PATCH/DELETE запросов** (login, register, logout): всегда создает сессию
- **Для GET запросов**: создает сессию только если уже есть session cookie или remember cookie

```php
public function handle($request, Closure $next): Response
{
    // Always start session for mutation requests (login, register, etc.)
    if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
        return parent::handle($request, $next);
    }

    // For GET requests, only start session if cookie exists
    $hasSessionCookie = $request->cookies->has($sessionName);
    $hasRememberCookie = $request->cookies->has($rememberCookieName);

    if (!$hasSessionCookie && !$hasRememberCookie) {
        return $next($request); // Skip session handling
    }

    return parent::handle($request, $next);
}
```

### 2. Заменен middleware в `bootstrap/app.php`

**Было:**
```php
$middleware->api(prepend: [
    \Illuminate\Http\Middleware\HandleCors::class,
    \Illuminate\Session\Middleware\StartSession::class,
]);
```

**Стало:**
```php
$middleware->api(prepend: [
    \Illuminate\Http\Middleware\HandleCors::class,
    \App\Http\Middleware\StartSessionIfExists::class,
]);
```

### 3. Улучшен метод logout в AuthController

**Файл:** `b5-auth-2/app/Http/Controllers/AuthController.php`

- Добавлена специальная обработка для localhost (domain=null)
- Явное удаление cookies через `response()->cookie()` с отрицательным временем жизни
- Удаление как session cookie, так и XSRF-TOKEN
- Подробное логирование

### 4. Улучшен `+layout.server.js`

**Файл:** `b5-admin/src/routes/+layout.server.js`

- Передаются только необходимые cookies (session и XSRF)
- Явное удаление cookie при получении 401/403
- Улучшенное логирование

## Результат

Теперь после logout:

1. ✅ API `/api/logout` удаляет session cookie
2. ✅ Браузер получает команду удалить cookie
3. ✅ При переходе на любую страницу, GET запрос к `/api/user` **не создает** новую сессию
4. ✅ Пользователь остается разлогиненным
5. ✅ Login/Register продолжают работать (POST запросы всегда создают сессию)

## Тестирование

### Локально
1. Войдите в систему
2. Откройте DevTools → Application → Cookies
3. Нажмите "Выйти"
4. Наблюдайте: cookie `b5_auth_2_session` удаляется и **не появляется снова**
5. Перейдите на `/` - не должно перебрасывать на dashboard
6. Попробуйте войти снова - должно работать

### На продакшене
После деплоя проверьте те же шаги.

## Важно

После изменения middleware **обязательно перезапустите** Laravel сервер:
```bash
cd b5-auth-2
php artisan config:clear
php artisan cache:clear
# Перезапустите сервер
```

## Файлы изменены

### Backend (b5-auth-2)
- `app/Http/Middleware/StartSessionIfExists.php` (новый файл)
- `bootstrap/app.php`
- `app/Http/Controllers/AuthController.php`

### Frontend (b5-admin)
- `src/routes/+layout.server.js`
- `src/routes/(protected)/+layout.svelte`
- `src/routes/(protected)/profile/+page.svelte`
- `src/routes/(auth)/email-verify/+page.svelte`
- `src/routes/access-denied/+page.svelte`
- `src/routes/+page.svelte`
- `src/lib/api/auth.js`
