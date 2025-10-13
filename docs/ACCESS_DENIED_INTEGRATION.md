# Руководство по интеграции функции блокировки доступа

## Быстрый старт

### 1. Проверка API

Убедитесь, что ваш API возвращает поле `type` в объекте пользователя:

```json
{
  "user": {
    "id": 1,
    "name": "Иван Иванов",
    "email": "ivan@example.com",
    "type": "Клиент",
    "email_verified": true,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "token": {
    "access_token": "...",
    "token_type": "Bearer",
    "expires_at": "2024-01-02T00:00:00Z"
  }
}
```

### 2. Настройка базы данных

Добавьте поле `type` в таблицу пользователей (если ещё не добавлено):

```sql
ALTER TABLE users ADD COLUMN type VARCHAR(50) DEFAULT NULL;

-- Создайте индекс для оптимизации запросов
CREATE INDEX idx_users_type ON users(type);

-- Опционально: добавьте constraint для валидации
ALTER TABLE users ADD CONSTRAINT chk_user_type 
CHECK (type IN ('Клиент', 'Агент', 'Дизайнер', NULL));
```

### 3. Обновление существующих пользователей

```sql
-- Назначьте статусы существующим пользователям
UPDATE users SET type = 'Клиент' WHERE /* условие для клиентов */;
UPDATE users SET type = 'Агент' WHERE /* условие для агентов */;
UPDATE users SET type = 'Дизайнер' WHERE /* условие для дизайнеров */;
```

### 4. Проверка работы

```bash
# Запустите dev-сервер
npm run dev

# Откройте браузер
open http://localhost:5173/login
```

## Настройка разрешённых статусов

Если вам нужно изменить список разрешённых статусов, отредактируйте два файла:

### 1. Login страница

**Файл:** `src/routes/(auth)/login/+page.svelte`

```javascript
// Найдите эту строку:
if (!userType || !['Клиент', 'Агент', 'Дизайнер'].includes(userType)) {

// Измените на:
if (!userType || !['Клиент', 'Агент', 'Дизайнер', 'Менеджер'].includes(userType)) {
```

### 2. Auth Guard

**Файл:** `src/lib/auth/auth-guard.svelte.js`

```javascript
// Найдите эту строку:
if (!userType || !['Клиент', 'Агент', 'Дизайнер'].includes(userType)) {

// Измените на:
if (!userType || !['Клиент', 'Агент', 'Дизайнер', 'Менеджер'].includes(userType)) {
```

### 3. Обновите документацию

Не забудьте обновить:
- `docs/ACCESS_DENIED_FEATURE.md`
- `test-access-denied.md`
- Страницу `/access-denied` (если нужно отобразить новые статусы)

## Кастомизация страницы блокировки

### Изменение email поддержки

**Файл:** `src/routes/access-denied/+page.svelte`

```svelte
<!-- Найдите эту строку: -->
<a href="mailto:support@b5.ru"

<!-- Измените на: -->
<a href="mailto:your-support@example.com"
```

### Изменение цветовой схемы

Замените классы Tailwind:

```svelte
<!-- Красная схема (текущая) -->
from-red-950 via-black to-gray-900
border-red-600
text-red-500

<!-- Синяя схема -->
from-blue-950 via-black to-gray-900
border-blue-600
text-blue-500

<!-- Оранжевая схема -->
from-orange-950 via-black to-gray-900
border-orange-600
text-orange-500
```

### Добавление логотипа компании

```svelte
<!-- Добавьте перед иконкой предупреждения -->
<div class="mb-4">
  <img src="/logo.svg" alt="Company Logo" class="h-16 w-auto mx-auto" />
</div>
```

### Изменение текста сообщений

```svelte
<!-- Найдите блок с текстом -->
<p class="text-lg text-gray-300 md:text-xl">
  Ваш статус пользователя не определён или не соответствует требованиям системы
</p>

<!-- Измените на свой текст -->
<p class="text-lg text-gray-300 md:text-xl">
  Ваш аккаунт не имеет необходимых прав для доступа к этой системе
</p>
```

## Добавление логирования

### 1. Создайте функцию логирования

**Файл:** `src/lib/utils/access-logger.js`

```javascript
export async function logAccessDenied(user, reason) {
  try {
    await fetch('/api/logs/access-denied', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user?.id,
        user_email: user?.email,
        user_type: user?.type,
        reason,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
      }),
    });
  } catch (error) {
    console.error('Failed to log access denied:', error);
  }
}
```

### 2. Используйте в login странице

```javascript
import { logAccessDenied } from '$lib/utils/access-logger.js';

// В функции handleSubmit:
if (!userType || !['Клиент', 'Агент', 'Дизайнер'].includes(userType)) {
  await logAccessDenied(authState.user, 'Invalid user type');
  goto('/access-denied');
  return;
}
```

### 3. Используйте в auth-guard

```javascript
import { logAccessDenied } from '$lib/utils/access-logger.js';

// В функции createAuthLoad:
if (!userType || !['Клиент', 'Агент', 'Дизайнер'].includes(userType)) {
  if (browser) {
    await logAccessDenied(userData, 'Invalid user type on protected route');
  }
  throw redirect(302, '/access-denied');
}
```

## Добавление уведомлений администратору

### 1. Создайте функцию уведомления

**Файл:** `src/lib/utils/admin-notifier.js`

```javascript
export async function notifyAdminAccessDenied(user) {
  try {
    await fetch('/api/admin/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'access_denied',
        user_id: user?.id,
        user_email: user?.email,
        user_type: user?.type,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Failed to notify admin:', error);
  }
}
```

### 2. Используйте при блокировке

```javascript
import { notifyAdminAccessDenied } from '$lib/utils/admin-notifier.js';

if (!userType || !['Клиент', 'Агент', 'Дизайнер'].includes(userType)) {
  await notifyAdminAccessDenied(authState.user);
  goto('/access-denied');
  return;
}
```

## Тестирование

### Unit тесты

**Файл:** `src/lib/auth/auth-guard.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import { createAuthLoad } from './auth-guard.svelte.js';

describe('createAuthLoad', () => {
  it('should allow access for valid user types', async () => {
    const load = createAuthLoad();
    const mockUser = { type: 'Клиент', email_verified: true };
    
    // Mock authState
    authState.initialized = true;
    authState.isAuthenticated = true;
    authState.user = mockUser;
    
    const result = await load({ url: new URL('http://localhost'), route: {} });
    expect(result.user).toEqual(mockUser);
  });

  it('should redirect for invalid user types', async () => {
    const load = createAuthLoad();
    const mockUser = { type: 'Администратор', email_verified: true };
    
    authState.initialized = true;
    authState.isAuthenticated = true;
    authState.user = mockUser;
    
    await expect(load({ url: new URL('http://localhost'), route: {} }))
      .rejects.toThrow();
  });
});
```

### E2E тесты

**Файл:** `tests/access-denied.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test('should redirect to access-denied for invalid user type', async ({ page }) => {
  // Login with invalid user type
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test-admin@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Should redirect to access-denied
  await expect(page).toHaveURL('/access-denied');
  await expect(page.locator('h1')).toContainText('ДОСТУП ЗАПРЕЩЁН');
});

test('should allow access for valid user type', async ({ page }) => {
  // Login with valid user type
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test-client@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Should redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
});
```

## Отладка

### Проверка статуса пользователя в консоли

```javascript
// Откройте консоль браузера (F12)

// Проверить текущего пользователя
const userData = JSON.parse(localStorage.getItem('b5_admin_user_data'));
console.log('User type:', userData?.type);

// Проверить authState
console.log('Auth state:', authState);

// Проверить, разрешён ли доступ
const allowedTypes = ['Клиент', 'Агент', 'Дизайнер'];
const isAllowed = allowedTypes.includes(userData?.type);
console.log('Access allowed:', isAllowed);
```

### Логирование в auth-guard

Добавьте временное логирование:

```javascript
// В createAuthLoad:
console.log('Auth check:', {
  isAuth,
  userType: userData?.type,
  allowed: ['Клиент', 'Агент', 'Дизайнер'].includes(userData?.type)
});
```

### Проверка редиректов

```javascript
// В login/+page.svelte:
console.log('Login success, checking user type:', {
  user: authState.user,
  type: authState.user?.type,
  willRedirect: !authState.user?.type || 
    !['Клиент', 'Агент', 'Дизайнер'].includes(authState.user?.type)
});
```

## Производственное развёртывание

### 1. Проверьте конфигурацию

```bash
# Убедитесь, что все файлы на месте
ls -la src/routes/access-denied/
ls -la docs/

# Проверьте синтаксис
npm run check
```

### 2. Соберите проект

```bash
npm run build
```

### 3. Проверьте сборку

```bash
npm run preview
```

### 4. Разверните

```bash
# Ваш процесс развёртывания
npm run deploy
```

## Мониторинг

### Метрики для отслеживания

1. **Количество блокировок доступа**
   - Общее количество
   - По типам пользователей
   - По времени

2. **Попытки обхода**
   - Прямые переходы на защищённые маршруты
   - Повторные попытки логина

3. **Обращения в поддержку**
   - Клики на кнопку "СВЯЗАТЬСЯ С ПОДДЕРЖКОЙ"
   - Email запросы

### Пример дашборда

```javascript
// Метрики для отслеживания
{
  access_denied_total: 42,
  access_denied_by_type: {
    undefined: 15,
    null: 10,
    'Администратор': 12,
    'Другое': 5
  },
  support_contacts: 8,
  logout_clicks: 34
}
```

## Часто задаваемые вопросы

### Q: Можно ли добавить несколько email для поддержки?

A: Да, измените кнопку:

```svelte
<a href="mailto:support@b5.ru,admin@b5.ru?subject=Access%20Denied"
```

### Q: Как добавить телеграм-бот для уведомлений?

A: Создайте функцию:

```javascript
async function notifyTelegram(message) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: ADMIN_CHAT_ID,
      text: message
    })
  });
}
```

### Q: Можно ли временно отключить проверку?

A: Да, закомментируйте проверки в `login/+page.svelte` и `auth-guard.svelte.js`, но это не рекомендуется для production.

### Q: Как добавить whitelist пользователей?

A: Добавьте проверку:

```javascript
const whitelist = ['admin@b5.ru', 'superuser@b5.ru'];
if (whitelist.includes(authState.user?.email)) {
  // Разрешить доступ
  goto(returnUrl);
  return;
}
```

## Поддержка

При возникновении проблем:
1. Проверьте документацию: `docs/ACCESS_DENIED_FEATURE.md`
2. Выполните тесты: `test-access-denied.md`
3. Проверьте changelog: `CHANGELOG_ACCESS_DENIED.md`
4. Свяжитесь с командой разработки
