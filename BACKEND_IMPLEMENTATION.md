# Backend Implementation - httpOnly Cookies

## Пошаговая инструкция для Laravel

### Шаг 1: Обновите AuthController

Создайте или обновите `app/Http/Controllers/Api/AuthController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AuthController extends Controller
{
    /**
     * Login user and set httpOnly cookie
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        // Validate credentials
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'remember' => 'boolean'
        ]);

        // Attempt authentication
        if (!Auth::attempt(['email' => $credentials['email'], 'password' => $credentials['password']])) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        $user = Auth::user();

        // Generate JWT token
        try {
            $token = JWTAuth::fromUser($user);
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not create token'
            ], 500);
        }

        // Calculate TTL in minutes
        $ttl = config('jwt.ttl', 60); // Default 60 minutes
        if ($request->input('remember', false)) {
            $ttl = config('jwt.refresh_ttl', 20160); // 14 days
        }

        // Create httpOnly cookie
        $cookie = cookie(
            'b5_auth_token',           // Cookie name
            $token,                     // JWT token
            $ttl,                       // Expiration time (minutes)
            '/',                        // Path
            config('session.domain'),   // Domain
            config('app.env') === 'production', // Secure (HTTPS only in production)
            true,                       // HttpOnly
            false,                      // Raw
            'lax'                       // SameSite
        );

        // Return response with cookie
        return response()->json([
            'success' => true,
            'user' => $user,
            'token' => $token,  // Also return token for localStorage fallback
            'message' => 'Login successful'
        ])->cookie($cookie);
    }

    /**
     * Register new user and set httpOnly cookie
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        // Validate registration data
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'region' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'terms_accepted' => 'required|accepted'
        ]);

        // Create user
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'region' => $validated['region'] ?? null,
            'phone' => $validated['phone'] ?? null,
        ]);

        // Generate JWT token
        try {
            $token = JWTAuth::fromUser($user);
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User created but could not create token'
            ], 500);
        }

        // Create httpOnly cookie
        $ttl = config('jwt.ttl', 60);
        $cookie = cookie(
            'b5_auth_token',
            $token,
            $ttl,
            '/',
            config('session.domain'),
            config('app.env') === 'production',
            true,
            false,
            'lax'
        );

        return response()->json([
            'success' => true,
            'user' => $user,
            'token' => $token,
            'message' => 'Registration successful'
        ])->cookie($cookie);
    }

    /**
     * Logout user and clear httpOnly cookie
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        try {
            // Try to invalidate JWT token
            $token = JWTAuth::getToken();
            if ($token) {
                JWTAuth::invalidate($token);
            }
        } catch (JWTException $e) {
            // Token might already be invalid, continue anyway
        }

        // Clear the httpOnly cookie
        $cookie = cookie()->forget('b5_auth_token');

        return response()->json([
            'success' => true,
            'message' => 'Logout successful'
        ])->cookie($cookie);
    }

    /**
     * Get current authenticated user
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function user(Request $request)
    {
        try {
            // Try to get user from JWT
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'user' => $user
            ]);
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid token'
            ], 401);
        }
    }
}
```

### Шаг 2: Обновите CORS настройки

Файл `config/cors.php`:

```php
<?php

return [
    'paths' => ['api/*', 'graphql', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',  // Vite dev server
        'http://localhost:4173',  // Vite preview
        env('FRONTEND_URL', 'http://localhost:5173'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,  // IMPORTANT: Must be true for httpOnly cookies
];
```

### Шаг 3: Обновите Middleware для чтения cookie

Создайте middleware `app/Http/Middleware/AuthenticateFromCookie.php`:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AuthenticateFromCookie
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Check if Authorization header exists
        $authHeader = $request->header('Authorization');

        // If no Authorization header, try to get token from cookie
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            $token = $request->cookie('b5_auth_token');

            if ($token) {
                // Set the token in the request for JWTAuth
                $request->headers->set('Authorization', 'Bearer ' . $token);
            }
        }

        return $next($request);
    }
}
```

### Шаг 4: Зарегистрируйте middleware

В `app/Http/Kernel.php`, добавьте в секцию `$middlewareAliases`:

```php
protected $middlewareAliases = [
    // ... existing middleware
    'auth.cookie' => \App\Http\Middleware\AuthenticateFromCookie::class,
];
```

### Шаг 5: Примените middleware к routes

В `routes/api.php`:

```php
use App\Http\Controllers\Api\AuthController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Protected routes - apply auth.cookie middleware
Route::middleware(['auth.cookie', 'auth:api'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
});
```

В `routes/web.php` или где у вас GraphQL:

```php
// GraphQL endpoint with cookie authentication
Route::middleware(['auth.cookie'])->group(function () {
    Route::post('/graphql', [\Nuwave\Lighthouse\GraphQLController::class, 'query']);
});
```

### Шаг 6: Обновите .env файл

```env
# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# Session domain (leave empty for same domain)
SESSION_DOMAIN=

# JWT settings
JWT_TTL=60
JWT_REFRESH_TTL=20160
```

## Тестирование

### 1. Тест login с httpOnly cookie

```bash
curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  -c cookies.txt -v
```

**Ожидаемый результат:**
- HTTP 200 OK
- Header `Set-Cookie: b5_auth_token=....; HttpOnly; Path=/; SameSite=lax`
- JSON response с user и token

### 2. Тест GraphQL запроса с cookie

```bash
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"query":"{ users { id name email } }"}' \
  -v
```

**Ожидаемый результат:**
- HTTP 200 OK
- JSON response с данными пользователей

### 3. Тест logout

```bash
curl -X POST http://localhost:8001/api/logout \
  -b cookies.txt \
  -c cookies.txt \
  -v
```

**Ожидаемый результат:**
- HTTP 200 OK
- Header `Set-Cookie: b5_auth_token=deleted; expires=...`

### 4. Проверка в браузере

1. Откройте http://localhost:5173/login
2. Войдите в систему
3. Откройте DevTools → Application → Cookies
4. Найдите cookie `b5_auth_token`
5. Проверьте флаги:
   - ✅ HttpOnly
   - ✅ SameSite: Lax
   - ✅ Secure (в production)
   - ✅ Path: /

## Troubleshooting

### Cookie не устанавливается

**Проблема:** Cookie не появляется в браузере после логина

**Решения:**
1. Проверьте CORS: `supports_credentials` должен быть `true`
2. Проверьте frontend: `credentials: 'include'` в fetch
3. Проверьте domain: должен совпадать или быть пустым
4. Проверьте логи Laravel: `tail -f storage/logs/laravel.log`

### Cookie не отправляется с запросами

**Проблема:** Cookie есть, но не отправляется с GraphQL запросами

**Решения:**
1. Проверьте SameSite policy: должен быть `lax` или `none`
2. Проверьте, что запросы идут на тот же домен
3. Убедитесь, что middleware `auth.cookie` применен

### 401 Unauthorized

**Проблема:** Получаете 401 при GraphQL запросах

**Решения:**
1. Проверьте, что middleware `auth.cookie` выполняется первым
2. Добавьте debug в middleware:
   ```php
   \Log::info('Cookie token:', ['token' => $request->cookie('b5_auth_token')]);
   ```
3. Проверьте JWT secret: `php artisan config:cache`

## Следующие шаги

После настройки backend:

1. ✅ Перезапустите Laravel: `php artisan serve`
2. ✅ Очистите кеш: `php artisan config:clear`
3. ✅ Проверьте тестами из раздела "Тестирование"
4. ✅ Откройте frontend и войдите в систему
5. ✅ Проверьте, что страницы agents и clients загружают данные сразу
6. ✅ Проверьте console.log в браузере для отладки

## Полезные команды

```bash
# Очистить все кеши
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Посмотреть routes
php artisan route:list | grep api

# Проверить JWT
php artisan jwt:secret

# Запустить сервер
php artisan serve --port=8001
```
