# Примеры кода для функции блокировки доступа

## Основная логика проверки

### 1. Проверка при логине

```javascript
// src/routes/(auth)/login/+page.svelte

async function handleSubmit(event) {
	event.preventDefault();
	clearError();
	clientErrors = {};
	if (!validateForm()) return;

	try {
		const success = await login(email, password, remember);

		if (success) {
			// ✅ ПРОВЕРКА СТАТУСА ПОЛЬЗОВАТЕЛЯ
			const userType = authState.user?.type;

			// Редирект на access-denied если статус неразрешён
			if (!userType || !['Клиент', 'Агент', 'Дизайнер'].includes(userType)) {
				goto('/access-denied');
				return;
			}

			// Проверка email verification
			if (authState.user && !authState.user.email_verified) {
				goto('/email-verify');
			} else {
				goto(returnUrl);
			}
		}
	} catch (error) {
		console.error('Login failed:', error);
	}
}
```

### 2. Проверка в auth-guard

```javascript
// src/lib/auth/auth-guard.svelte.js

export function createAuthLoad(options = {}) {
	const { redirectTo = '/login', requireAuth = true, requireEmailVerification = false } = options;

	return async ({ url, route }) => {
		// Проверка аутентификации
		let isAuth = false;
		let userData = null;

		if (authState.initialized) {
			isAuth = authState.isAuthenticated;
			userData = authState.user;
		} else {
			const hasToken = hasAuthToken();
			const storedUser = getUserData();
			isAuth = hasToken && storedUser;
			userData = storedUser;
		}

		if (requireAuth && !isAuth) {
			const returnTo = url.pathname + url.search;
			const loginUrl = `${redirectTo}?returnTo=${encodeURIComponent(returnTo)}`;
			throw redirect(302, loginUrl);
		}

		// ✅ ПРОВЕРКА СТАТУСА ПОЛЬЗОВАТЕЛЯ
		if (requireAuth && isAuth && userData) {
			const userType = userData.type;
			if (!userType || !['Клиент', 'Агент', 'Дизайнер'].includes(userType)) {
				throw redirect(302, '/access-denied');
			}
		}

		// Проверка email verification
		if (requireEmailVerification && isAuth && userData && !userData.email_verified) {
			throw redirect(302, '/email-verify');
		}

		return {
			user: userData,
			isAuthenticated: isAuth,
			emailVerified: userData?.email_verified || false
		};
	};
}
```

## Структура данных пользователя

### Ожидаемый формат от API

```javascript
// Успешный ответ от /api/login
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Иван Иванов",
    "email": "ivan@example.com",
    "type": "Клиент",              // ⚠️ ВАЖНОЕ ПОЛЕ
    "email_verified": true,
    "email_verified_at": "2024-01-01T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "token": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "Bearer",
    "expires_at": "2024-01-02T00:00:00Z"
  }
}
```

### Примеры разных статусов

```javascript
// ✅ РАЗРЕШЁННЫЕ СТАТУСЫ
{
	type: 'Админ';
} // Доступ разрешён
{
	type: 'Куратор';
} // Доступ разрешён
{
	type: 'Менеджер';
} // Доступ разрешён

// ❌ ЗАБЛОКИРОВАННЫЕ СТАТУСЫ
{
	type: 'Клиент';
} // Блокировка
{
	type: 'Агент';
} // Блокировка
{
	type: 'Дизайнер';
} // Блокировка
{
	type: null;
} // Блокировка
{
	type: undefined;
} // Блокировка
{
	type: 'Администратор';
} // Блокировка
{
	type: '';
} // Блокировка
```

## Примеры использования

### Пример 1: Базовая проверка

```javascript
function checkUserAccess(user) {
	const allowedTypes = ['Админ', 'Куратор', 'Менеджер'];
	const userType = user?.type;

	if (!userType || !allowedTypes.includes(userType)) {
		console.log(`❌ Доступ запрещён (статус: ${userType || 'не определён'})`);
		return false;
	}

	console.log(`✅ Доступ разрешён (статус: ${userType})`);
	return true;
}

// Использование
const user = { type: 'Админ' };
if (checkUserAccess(user)) {
	// Разрешить доступ
} else {
	// Заблокировать доступ
}
```

### Пример 2: Проверка с логированием

```javascript
async function checkAndLogAccess(user) {
	const allowedTypes = ['Админ', 'Куратор', 'Менеджер'];
	const userType = user?.type;
	const isAllowed = userType && allowedTypes.includes(userType);

	// Логирование
	await fetch('/api/logs/access-check', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			user_id: user?.id,
			user_email: user?.email,
			user_type: userType,
			is_allowed: isAllowed,
			timestamp: new Date().toISOString()
		})
	});

	return isAllowed;
}
```

### Пример 3: Проверка с уведомлением

```javascript
async function checkAccessWithNotification(user) {
	const allowedTypes = ['Клиент', 'Агент', 'Дизайнер'];
	const userType = user?.type;

	if (!userType || !allowedTypes.includes(userType)) {
		// Уведомить администратора
		await fetch('/api/admin/notify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				type: 'access_denied',
				user_id: user?.id,
				user_email: user?.email,
				user_type: userType,
				reason: !userType ? 'undefined_type' : 'invalid_type',
				timestamp: new Date().toISOString()
			})
		});

		return false;
	}

	return true;
}
```

## Кастомизация проверки

### Добавление whitelist

```javascript
function checkUserAccessWithWhitelist(user) {
	// Whitelist пользователей (всегда разрешён доступ)
	const whitelist = ['admin@b5.ru', 'superuser@b5.ru'];

	if (whitelist.includes(user?.email)) {
		console.log('✅ Пользователь в whitelist');
		return true;
	}

	// Стандартная проверка статуса
	const allowedTypes = ['Клиент', 'Агент', 'Дизайнер'];
	const userType = user?.type;

	return userType && allowedTypes.includes(userType);
}
```

### Добавление временных разрешений

```javascript
function checkUserAccessWithTemporary(user) {
	// Проверка временного разрешения
	const tempAccess = localStorage.getItem(`temp_access_${user?.id}`);
	if (tempAccess) {
		const expiresAt = new Date(tempAccess);
		if (expiresAt > new Date()) {
			console.log('✅ Временное разрешение активно');
			return true;
		}
	}

	// Стандартная проверка статуса
	const allowedTypes = ['Клиент', 'Агент', 'Дизайнер'];
	const userType = user?.type;

	return userType && allowedTypes.includes(userType);
}
```

### Добавление ролевой системы

```javascript
function checkUserAccessWithRoles(user) {
	// Определение ролей для каждого типа
	const typeRoles = {
		Клиент: ['view_orders', 'create_orders'],
		Агент: ['view_orders', 'create_orders', 'manage_clients'],
		Дизайнер: ['view_projects', 'create_projects', 'manage_designs']
	};

	const userType = user?.type;

	if (!userType || !typeRoles[userType]) {
		console.log('❌ Неизвестный тип пользователя');
		return { allowed: false, roles: [] };
	}

	return {
		allowed: true,
		roles: typeRoles[userType]
	};
}

// Использование
const access = checkUserAccessWithRoles(user);
if (access.allowed) {
	console.log('Доступные роли:', access.roles);
}
```

## Интеграция с API

### Laravel Backend пример

```php
// app/Http/Controllers/Auth/LoginController.php

public function login(Request $request)
{
    $credentials = $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    if (Auth::attempt($credentials)) {
        $user = Auth::user();

        // Создание токена
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'type' => $user->type,  // ⚠️ ВАЖНО
                'email_verified' => $user->hasVerifiedEmail(),
                'email_verified_at' => $user->email_verified_at,
            ],
            'token' => [
                'access_token' => $token,
                'token_type' => 'Bearer',
                'expires_at' => now()->addDays(30),
            ],
        ]);
    }

    return response()->json([
        'success' => false,
        'message' => 'Неверный email или пароль',
    ], 401);
}
```

### Node.js/Express Backend пример

```javascript
// routes/auth.js

router.post('/login', async (req, res) => {
	const { email, password } = req.body;

	try {
		const user = await User.findOne({ email });

		if (!user || !(await user.comparePassword(password))) {
			return res.status(401).json({
				success: false,
				message: 'Неверный email или пароль'
			});
		}

		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

		res.json({
			success: true,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				type: user.type, // ⚠️ ВАЖНО
				email_verified: user.emailVerified,
				email_verified_at: user.emailVerifiedAt
			},
			token: {
				access_token: token,
				token_type: 'Bearer',
				expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
			}
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Ошибка сервера'
		});
	}
});
```

## Тестирование

### Unit тест для проверки статуса

```javascript
// auth-guard.test.js

import { describe, it, expect } from 'vitest';

describe('User Type Access Control', () => {
	const allowedTypes = ['Клиент', 'Агент', 'Дизайнер'];

	it('should allow access for valid types', () => {
		const validUsers = [{ type: 'Клиент' }, { type: 'Агент' }, { type: 'Дизайнер' }];

		validUsers.forEach((user) => {
			expect(allowedTypes.includes(user.type)).toBe(true);
		});
	});

	it('should deny access for invalid types', () => {
		const invalidUsers = [
			{ type: null },
			{ type: undefined },
			{ type: 'Администратор' },
			{ type: 'Менеджер' },
			{ type: '' }
		];

		invalidUsers.forEach((user) => {
			expect(allowedTypes.includes(user.type)).toBe(false);
		});
	});
});
```

### E2E тест с Playwright

```javascript
// tests/access-denied.spec.js

import { test, expect } from '@playwright/test';

test.describe('Access Denied Feature', () => {
	test('should block access for undefined user type', async ({ page }) => {
		// Mock API response with undefined type
		await page.route('**/api/login', (route) => {
			route.fulfill({
				status: 200,
				body: JSON.stringify({
					success: true,
					user: { id: 1, email: 'test@example.com', type: null },
					token: { access_token: 'fake_token' }
				})
			});
		});

		await page.goto('/login');
		await page.fill('input[name="email"]', 'test@example.com');
		await page.fill('input[name="password"]', 'password');
		await page.click('button[type="submit"]');

		await expect(page).toHaveURL('/access-denied');
		await expect(page.locator('h1')).toContainText('ДОСТУП ЗАПРЕЩЁН');
	});

	test('should allow access for valid user type', async ({ page }) => {
		// Mock API response with valid type
		await page.route('**/api/login', (route) => {
			route.fulfill({
				status: 200,
				body: JSON.stringify({
					success: true,
					user: {
						id: 1,
						email: 'test@example.com',
						type: 'Клиент',
						email_verified: true
					},
					token: { access_token: 'fake_token' }
				})
			});
		});

		await page.goto('/login');
		await page.fill('input[name="email"]', 'test@example.com');
		await page.fill('input[name="password"]', 'password');
		await page.click('button[type="submit"]');

		await expect(page).toHaveURL('/dashboard');
	});
});
```

## Отладка

### Консольное логирование

```javascript
// Добавьте в login/+page.svelte для отладки

async function handleSubmit(event) {
	// ... existing code ...

	if (success) {
		console.group('🔐 Access Control Check');
		console.log('User:', authState.user);
		console.log('User Type:', authState.user?.type);
		console.log('Allowed Types:', ['Клиент', 'Агент', 'Дизайнер']);
		console.log(
			'Is Allowed:',
			authState.user?.type && ['Клиент', 'Агент', 'Дизайнер'].includes(authState.user?.type)
		);
		console.groupEnd();

		const userType = authState.user?.type;

		if (!userType || !['Клиент', 'Агент', 'Дизайнер'].includes(userType)) {
			console.warn('❌ Access denied - redirecting to /access-denied');
			goto('/access-denied');
			return;
		}

		console.log('✅ Access granted - proceeding to dashboard');
		// ... rest of code ...
	}
}
```

### Проверка в DevTools

```javascript
// Откройте консоль браузера (F12) и выполните:

// 1. Проверить текущего пользователя
const userData = JSON.parse(localStorage.getItem('b5_admin_user_data'));
console.table({
	'User ID': userData?.id,
	Email: userData?.email,
	Type: userData?.type,
	'Email Verified': userData?.email_verified
});

// 2. Проверить доступ
const allowedTypes = ['Клиент', 'Агент', 'Дизайнер'];
const hasAccess = userData?.type && allowedTypes.includes(userData.type);
console.log(`Access: ${hasAccess ? '✅ Allowed' : '❌ Denied'}`);

// 3. Симулировать изменение статуса
userData.type = 'Администратор';
localStorage.setItem('b5_admin_user_data', JSON.stringify(userData));
console.log('Type changed to:', userData.type);
location.reload();
```

## Полезные утилиты

### Функция для проверки доступа

```javascript
// src/lib/utils/access-control.js

export const USER_TYPES = {
	CLIENT: 'Клиент',
	AGENT: 'Агент',
	DESIGNER: 'Дизайнер'
};

export const ALLOWED_TYPES = Object.values(USER_TYPES);

export function isAccessAllowed(user) {
	return user?.type && ALLOWED_TYPES.includes(user.type);
}

export function getUserTypeLabel(type) {
	const labels = {
		[USER_TYPES.CLIENT]: 'Клиент',
		[USER_TYPES.AGENT]: 'Агент',
		[USER_TYPES.DESIGNER]: 'Дизайнер'
	};
	return labels[type] || 'Не определено';
}

export function getAccessDeniedReason(user) {
	if (!user) return 'Пользователь не найден';
	if (!user.type) return 'Статус пользователя не определён';
	return `Статус "${user.type}" не разрешён`;
}
```

### Использование утилит

```javascript
import { isAccessAllowed, getAccessDeniedReason } from '$lib/utils/access-control.js';

async function handleSubmit(event) {
	// ... existing code ...

	if (success) {
		if (!isAccessAllowed(authState.user)) {
			const reason = getAccessDeniedReason(authState.user);
			console.warn('Access denied:', reason);
			goto('/access-denied');
			return;
		}

		// ... rest of code ...
	}
}
```

## Заключение

Эти примеры кода помогут вам:

- Понять логику проверки статуса пользователя
- Интегрировать функцию в ваш проект
- Кастомизировать проверку под ваши нужды
- Тестировать и отлаживать функциональность
- Расширять систему контроля доступа

Для получения дополнительной информации см.:

- `docs/ACCESS_DENIED_FEATURE.md` - Полное описание
- `docs/ACCESS_DENIED_INTEGRATION.md` - Руководство по интеграции
- `test-access-denied.md` - Инструкция по тестированию
