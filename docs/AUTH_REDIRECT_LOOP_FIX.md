# Исправление бесконечной перезагрузки при истекшем токене

## Проблема

При истечении токена авторизации происходила бесконечная перезагрузка страницы из-за конфликта между серверной и клиентской логикой обработки ошибок 401.

### Причины

1. **Серверная проверка** (`+layout.server.js`):
   - При каждой загрузке страницы проверяет сессию через `/api/user`
   - При 401 удаляет cookie и возвращает `isAuthenticated: false`
   - Это вызывает перезагрузку layout

2. **Клиентская обработка** (`hooks.client.js`):
   - Перехватывает ошибки 401 и вызывает `safeRedirectToLogin`
   - `beforeNavigate` проверяет защищенные маршруты и пытается редиректить

3. **Конфликт**:
   - Серверная проверка → 401 → клиентский редирект → новая серверная проверка → цикл

## Решение

### 0. Пропуск проверки авторизации на публичных страницах

В `+layout.server.js`:
```javascript
// Public pages that don't need authentication check
const publicPages = ['/login', '/register', '/forgot-password', '/reset-password', '/'];
const isPublicPage = publicPages.some(page => pathname === page || pathname.startsWith(page + '/'));

// Skip authentication check for public pages to prevent redirect loops
if (isPublicPage) {
	console.debug('Skipping auth check for public page:', pathname);
	return {
		user: null,
		isAuthenticated: false
	};
}
```

Это предотвращает ненужные API запросы на публичных страницах и исключает возможность цикла.

### 1. Добавлен флаг отслеживания редиректа

В `auth-guard.svelte.js`:
```javascript
let isCurrentlyRedirecting = false;

export function isRedirecting() {
	return isCurrentlyRedirecting;
}

function setRedirecting(value) {
	isCurrentlyRedirecting = value;
	if (value) {
		// Auto-reset после таймаута
		setTimeout(() => {
			isCurrentlyRedirecting = false;
		}, 2000);
	}
}
```

### 2. Улучшена проверка в `beforeNavigate`

В `hooks.client.js`:
```javascript
// Не вмешиваемся, если уже идем на страницу логина
if (pathname === '/login' || pathname.startsWith('/login')) {
	return;
}

// Пропускаем, если уже идет редирект
if (isRedirecting && isRedirecting()) {
	return;
}
```

### 3. Улучшена логика `safeRedirectToLogin`

В `auth.svelte.js`:
```javascript
// Расширен список публичных страниц
const publicPages = ['/login', '/register', '/forgot-password', '/reset-password', '/'];

// Добавлено логирование для отладки
console.debug('Redirecting to login from:', currentPath);

// Используется replaceState для предотвращения истории
await goto(redirectPath, { replaceState: true });

// Увеличен таймаут сброса флага до 2000ms
```

### 4. Улучшена обработка `onUnauthorized`

В `auth.svelte.js`:
```javascript
// Проверка публичных страниц с использованием startsWith
const isPublicPage = publicPages.some(page => 
	currentPath === page || currentPath.startsWith(page)
);

// Дополнительная проверка флага редиректа
if (!isPublicPage && !isRedirectingToLogin) {
	// Редирект
}
```

## Результат

- ✅ Предотвращены множественные одновременные редиректы
- ✅ Исключены циклы перезагрузки страницы
- ✅ Корректная обработка истекших токенов
- ✅ Плавный редирект на страницу логина с сохранением returnTo
- ✅ Автоматический сброс флагов для предотвращения застревания

## Тестирование

Для проверки исправления:

1. Авторизуйтесь в системе
2. Удалите cookie `b5_auth_2_session` через DevTools
3. Обновите страницу или перейдите на защищенный маршрут
4. Должен произойти один редирект на `/login` без циклов

## Файлы изменены

- `b5-admin/src/hooks.client.js`
- `b5-admin/src/lib/auth/auth.svelte.js`
- `b5-admin/src/lib/auth/auth-guard.svelte.js`
