# Руководство по доступу для кураторов

## Обзор

Пользователи со статусом **Куратор** (slug: `curators`) имеют **полный доступ ко всем страницам**, кроме:
- ❌ `/agents` - Управление агентами
- ❌ `/delivery` - Доставка

При попытке доступа к этим страницам происходит автоматический редирект на `/access-denied`.

## Архитектура решения

### 1. Конфигурация разрешений

В файле [src/lib/auth/status-permissions.js](src/lib/auth/status-permissions.js) для кураторов настроен полный доступ с исключениями:

```javascript
[USER_STATUSES.CURATORS]: {
    name: 'Куратор',
    description: 'Полный доступ ко всем страницам, кроме Агентов и Доставки',
    routes: '*', // Полный доступ
    excludeRoutes: [ROUTES.AGENTS, ROUTES.DELIVERY], // Исключения
    canManageProjects: true,
    canManageCompanies: false,
    canManageFinances: false,
    canAccessReports: true
}
```

### 2. Проверка доступа

Функция `hasRouteAccess` была обновлена для поддержки исключений:

```javascript
export function hasRouteAccess(userStatusSlug, route) {
    // ... public and common routes checks ...

    const permissions = STATUS_PERMISSIONS[userStatusSlug];

    // Полный доступ с исключениями
    if (permissions.routes === '*') {
        // Проверка, есть ли маршрут в списке исключений
        if (permissions.excludeRoutes && Array.isArray(permissions.excludeRoutes)) {
            return !permissions.excludeRoutes.includes(route);
        }
        return true;
    }

    // ...
}
```

### 3. Получение списка разрешенных маршрутов

Функция `getAllowedRoutes` также обновлена:

```javascript
export function getAllowedRoutes(userStatusSlug) {
    const permissions = STATUS_PERMISSIONS[userStatusSlug];

    if (permissions.routes === '*') {
        const allRoutes = Object.values(ROUTES);

        // Фильтрация исключенных маршрутов
        if (permissions.excludeRoutes) {
            return allRoutes.filter(route =>
                !permissions.excludeRoutes.includes(route)
            );
        }
        return allRoutes;
    }
    // ...
}
```

## Матрица доступа для кураторов

### ✅ Разрешенные страницы

**Менеджмент:**
- ✅ `/curators` - Кураторы
- ✅ `/managers` - Менеджеры
- ✅ `/designers` - Дизайнеры
- ✅ `/clients` - Клиенты

**Контрагенты:**
- ✅ `/contractors` - Подрядчики
- ✅ `/suppliers` - Поставщики
- ✅ `/services` - Сервисы

**Бизнес-процессы:**
- ✅ `/projects` - Проекты
- ✅ `/tz` - Технические задания
- ✅ `/contracts` - Контракты
- ✅ `/order` - Закупка
- ✅ `/complaints` - Рекламации
- ✅ `/finance` - Финансы

**Информация:**
- ✅ `/actions` - Акции
- ✅ `/documentation` - Документация

**Общие:**
- ✅ `/` - Главная
- ✅ `/dashboard` - Дашборд
- ✅ `/profile` - Профиль
- ✅ `/settings` - Настройки

### ❌ Запрещенные страницы

- ❌ `/agents` - Управление агентами → редирект на `/access-denied`
- ❌ `/delivery` - Доставка → редирект на `/access-denied`

## Тестирование

### Подготовка тестовых данных

Создайте тестового куратора в базе данных:

```sql
-- Получить ID статуса "Куратор"
SELECT id, slug, value FROM user_statuses WHERE slug = 'curators';

-- Создать тестового куратора
INSERT INTO users (id, key, name, email, password, status_id, email_verified_at, created_at, updated_at)
VALUES (
    ULID(),
    ULID(),
    'Test Curator',
    'curator@test.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    (SELECT id FROM user_statuses WHERE slug = 'curators'),
    NOW(),
    NOW(),
    NOW()
);
```

### Тест 1: Вход куратора

1. Откройте браузер и перейдите на `http://localhost:5137`
2. Войдите с учетными данными:
   - Email: `curator@test.com`
   - Password: `password`
3. В консоли браузера проверьте статус:
   ```javascript
   import { debugDomainState } from '/src/lib/utils/domainAccess.svelte.js';
   debugDomainState();
   ```
4. Проверьте вывод:
   - `user.status.slug` должен быть `'curators'`
   - `hasAdminAccess` должен быть `false`

### Тест 2: Проверка доступа к разрешенным страницам

Куратор должен иметь доступ к следующим страницам (НЕТ редиректа):

```
✅ http://localhost:5137/curators
✅ http://localhost:5137/managers
✅ http://localhost:5137/designers
✅ http://localhost:5137/clients
✅ http://localhost:5137/contractors
✅ http://localhost:5137/suppliers
✅ http://localhost:5137/services
✅ http://localhost:5137/projects
✅ http://localhost:5137/tz
✅ http://localhost:5137/contracts
✅ http://localhost:5137/order
✅ http://localhost:5137/complaints
✅ http://localhost:5137/finance
✅ http://localhost:5137/actions
✅ http://localhost:5137/documentation
```

### Тест 3: Проверка блокировки доступа

Куратор **НЕ должен** иметь доступ к следующим страницам (должен быть редирект на `/access-denied`):

```
❌ http://localhost:5137/agents     → /access-denied
❌ http://localhost:5137/delivery   → /access-denied
```

**Шаги для проверки:**

1. Войдите как куратор
2. Попытайтесь открыть `/agents`:
   - Введите URL напрямую: `http://localhost:5137/agents`
   - Должен произойти редирект на `/access-denied`
3. Попытайтесь открыть `/delivery`:
   - Введите URL напрямую: `http://localhost:5137/delivery`
   - Должен произойти редирект на `/access-denied`

### Тест 4: Проверка видимости навигации

В боковом меню **НЕ должны** быть видны следующие пункты:
- ❌ Агенты
- ❌ Доставка

Все остальные пункты должны быть видимы:
- ✅ Дашборд
- ✅ Клиенты
- ✅ Кураторы
- ✅ Менеджеры
- ✅ Дизайнеры
- ✅ Подрядчики
- ✅ Поставщики
- ✅ Сервис
- ✅ Проекты
- ✅ Техзадания
- ✅ Контракты
- ✅ Закупка
- ✅ Рекламации
- ✅ Акции
- ✅ Документация

### Тест 5: Программная проверка доступа

Выполните следующий код в консоли браузера после входа как куратор:

```javascript
import { hasRouteAccess } from '/src/lib/auth/status-permissions.js';

// Должны быть доступны
console.assert(hasRouteAccess('curators', '/projects') === true, 'Projects should be accessible');
console.assert(hasRouteAccess('curators', '/clients') === true, 'Clients should be accessible');
console.assert(hasRouteAccess('curators', '/finance') === true, 'Finance should be accessible');
console.assert(hasRouteAccess('curators', '/contractors') === true, 'Contractors should be accessible');

// Должны быть заблокированы
console.assert(hasRouteAccess('curators', '/agents') === false, 'Agents should be blocked');
console.assert(hasRouteAccess('curators', '/delivery') === false, 'Delivery should be blocked');

console.log('✅ All curator access tests passed!');
```

## Автоматические тесты

Создайте файл `test-curator-access.js`:

```javascript
import { hasRouteAccess, getAllowedRoutes } from './src/lib/auth/status-permissions.js';

const CURATOR_STATUS = 'curators';

// Разрешенные маршруты
const allowedRoutes = [
    '/dashboard',
    '/projects',
    '/clients',
    '/finance',
    '/contractors',
    '/suppliers',
    '/services',
    '/curators',
    '/managers',
    '/designers',
    '/tz',
    '/contracts',
    '/order',
    '/complaints',
    '/actions',
    '/documentation'
];

// Заблокированные маршруты
const blockedRoutes = [
    '/agents',
    '/delivery'
];

console.log('🧪 Testing Curator Access Control...\n');

// Тест доступа к разрешенным маршрутам
console.log('✅ Testing allowed routes:');
allowedRoutes.forEach(route => {
    const hasAccess = hasRouteAccess(CURATOR_STATUS, route);
    const status = hasAccess ? '✅' : '❌';
    console.log(`${status} ${route}: ${hasAccess ? 'ACCESSIBLE' : 'BLOCKED'}`);
    if (!hasAccess) {
        console.error(`   ⚠️  ERROR: Route should be accessible!`);
    }
});

// Тест блокировки запрещенных маршрутов
console.log('\n❌ Testing blocked routes:');
blockedRoutes.forEach(route => {
    const hasAccess = hasRouteAccess(CURATOR_STATUS, route);
    const status = !hasAccess ? '✅' : '❌';
    console.log(`${status} ${route}: ${hasAccess ? 'ACCESSIBLE' : 'BLOCKED'}`);
    if (hasAccess) {
        console.error(`   ⚠️  ERROR: Route should be blocked!`);
    }
});

// Проверка getAllowedRoutes
console.log('\n📋 Checking getAllowedRoutes:');
const routes = getAllowedRoutes(CURATOR_STATUS);
console.log(`Total allowed routes: ${routes.length}`);
console.log(`Contains /agents: ${routes.includes('/agents') ? '❌ ERROR' : '✅ Correct'}`);
console.log(`Contains /delivery: ${routes.includes('/delivery') ? '❌ ERROR' : '✅ Correct'}`);
console.log(`Contains /projects: ${routes.includes('/projects') ? '✅ Correct' : '❌ ERROR'}`);
console.log(`Contains /finance: ${routes.includes('/finance') ? '✅ Correct' : '❌ ERROR'}`);

console.log('\n✅ Curator access tests completed!');
```

## Отладка проблем

### Проблема: Куратор имеет доступ к запрещенным страницам

**Решение:**
1. Проверьте конфигурацию в `status-permissions.js`:
   ```sql
   SELECT u.email, s.slug, s.value
   FROM users u
   JOIN user_statuses s ON u.status_id = s.id
   WHERE u.email = 'curator@test.com';
   ```
2. Убедитесь, что `slug = 'curators'`
3. Проверьте, что `excludeRoutes` содержит `/agents` и `/delivery`

### Проблема: Куратор не может получить доступ к разрешенной странице

**Решение:**
1. Проверьте, что маршрут не добавлен в `excludeRoutes` по ошибке
2. Проверьте логи в консоли браузера
3. Выполните `debugDomainState()` для проверки статуса пользователя

### Проблема: Навигация показывает запрещенные пункты

**Решение:**
1. Проверьте, что `shouldShowNavItem` использует `hasRouteAccess`
2. Очистите кэш браузера и перезагрузите страницу
3. Проверьте, что пользователь перелогинился после изменения конфигурации

## Сравнение доступа

| Страница | Администратор | Куратор | Менеджер | Агент |
|----------|---------------|---------|----------|-------|
| Агенты | ✅ | ❌ | ❌ | ❌ |
| Кураторы | ✅ | ✅ | ❌ | ❌ |
| Менеджеры | ✅ | ✅ | ❌ | ❌ |
| Дизайнеры | ✅ | ✅ | ❌ | ❌ |
| Клиенты | ✅ | ✅ | ✅ | ❌ |
| Подрядчики | ✅ | ✅ | ❌ | ❌ |
| Поставщики | ✅ | ✅ | ❌ | ❌ |
| Доставка | ✅ | ❌ | ❌ | ❌ |
| Сервис | ✅ | ✅ | ❌ | ❌ |
| Проекты | ✅ | ✅ | ✅ | ✅ |
| Техзадания | ✅ | ✅ | ✅ | ❌ |
| Контракты | ✅ | ✅ | ❌ | ❌ |
| Закупка | ✅ | ✅ | ✅ | ❌ |
| Рекламации | ✅ | ✅ | ❌ | ❌ |
| Финансы | ✅ | ✅ | ❌ | ❌ |
| Акции | ✅ | ✅ | ✅ | ✅ |
| Документация | ✅ | ✅ | ✅ | ✅ |

## Заключение

Система доступа для кураторов реализована с использованием механизма исключений:
- ✅ Полный доступ ко всем страницам (`routes: '*'`)
- ✅ Исключения для `/agents` и `/delivery` (`excludeRoutes: [...]`)
- ✅ Автоматический редирект на `/access-denied` при попытке доступа к запрещенным страницам
- ✅ Скрытие запрещенных пунктов меню в навигации
