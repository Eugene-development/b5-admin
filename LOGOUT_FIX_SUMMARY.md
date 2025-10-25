# Исправление проблемы logout на localhost

## Проблема
Cookie не удалялись после logout на localhost, и пользователь автоматически авторизовывался снова.

## Причины
1. **Remember Me cookie**: При использовании "Запомни меня" Laravel создает долгоживущий cookie `remember_web_...`, который не удалялся при logout
2. **Автоматическое создание сессии**: Laravel middleware `StartSession` создавал новую сессию при каждом запросе, даже после logout
3. **Localhost domain**: Cookie с `domain=null` ведут себя по-разному на localhost и production

## Решения

### 1. Удаление Remember Me cookie при logout
**Файл:** `b5-auth-2/app/Http/Controllers/AuthController.php`

Добавлено удаление remember cookie:
```php
$rememberCookieName = 'remember_web_' . sha1('web');
$response->cookie($rememberCookieName, '', -2628000, ...);
```

### 2. Кастомный middleware для предотвращения создания новых сессий
**Файл:** `b5-auth-2/app/Http/Middleware/StartSessionIfExists.php`

Создан middleware, который:
- Проверяет наличие session или remember cookie
- Если cookies нет, НЕ создает новую сессию
- Если cookie есть, работает как обычный StartSession

**Файл:** `b5-auth-2/bootstrap/app.php`
```php
$middleware->api(prepend: [
    \App\Http\Middleware\StartSessionIfExists::class,
]);
```

### 3. Обработка localhost domain
**Файл:** `b5-auth-2/app/Http/Controllers/AuthController.php`

```php
$isLocalhost = in_array($request->getHost(), ['localhost', '127.0.0.1', '::1']);
$cookieDomain = $isLocalhost ? null : $sessionDomain;
```

## Тестирование

### Шаг 1: Перезапустить Laravel сервер
```bash
cd b5-auth-2
# Остановить текущий сервер (Ctrl+C)
php artisan serve --host=127.0.0.1 --port=8001
```

### Шаг 2: Проверить cookies перед logout
1. Войти в систему (с "Запомни меня" или без)
2. Открыть DevTools → Application → Cookies
3. Найти cookies:
   - `b5_auth_2_session`
   - `XSRF-TOKEN`
   - `remember_web_59ba36addc2b2f9401580f014c7f58ea4e30989d` (если использовали "Запомни меня")

### Шаг 3: Выполнить logout
1. Нажать "Выйти"
2. Подтвердить в модальном окне
3. Проверить DevTools → Cookies - все cookies должны удалиться
4. Проверить консоль браузера - должны быть сообщения `🚪 Calling logout API...`

### Шаг 4: Проверить, что не создается новая сессия
1. После logout перейти на `/`
2. Проверить DevTools → Cookies - cookies НЕ должны появиться снова
3. Не должно быть редиректа на `/dashboard`

### Шаг 5: Проверить логи Laravel
```bash
cd b5-auth-2
tail -f storage/logs/laravel.log
```

Должны быть записи:
- `Logout initiated`
- `Cookie config`
- `Cookie deletion params` с `isLocalhost: true`
- `Logout completed successfully, all cookies set to expire`
- `deleted_cookies: [b5_auth_2_session, XSRF-TOKEN, remember_web_...]`

## Удаленные cookies при logout
1. `b5_auth_2_session` - session cookie
2. `XSRF-TOKEN` - CSRF token
3. `remember_web_59ba36addc2b2f9401580f014c7f58ea4e30989d` - remember me cookie

## Если проблема сохраняется

### Проверка 1: Очистить все cookies вручную
В DevTools → Application → Cookies → Удалить все cookies для localhost

### Проверка 2: Проверить, что middleware применился
```bash
cd b5-auth-2
php artisan route:list --path=api/user
```

Должен показать middleware, включая `StartSessionIfExists`

### Проверка 3: Проверить конфигурацию session
```bash
cd b5-auth-2
php artisan config:cache
php artisan config:clear
```

### Проверка 4: Проверить, что используется правильный guard
В логах должно быть `Auth::guard('web')->logout()`
