# Исправление мультидоменной системы API

## Проблема

На домене `rubonus.pro` некоторые операции (например, смена статуса договора) падали с ошибкой CORS, потому что запросы шли на `api.bonus.band` вместо `api.rubonus.pro`.

## Причина

Несколько API файлов использовали статический `GRAPHQL_ENDPOINT` из `api.js`, который не учитывал мультидоменную систему из `domain.js`.

## Решение

### 1. Обновлен `src/lib/config/api.js`

Добавлены функции для динамического определения endpoints:

```javascript
export function getGraphQLEndpoint() {
	try {
		const apiUrl = getApiUrl(); // Из domain.js
		if (apiUrl) {
			return `${apiUrl}/graphql`;
		}
	} catch (error) {
		// Fallback to static config
	}
	return `${API_BASE_URL}/graphql`;
}
```

### 2. Обновлены API файлы

Все файлы теперь используют динамический endpoint:

**Обновленные файлы:**
- ✅ `src/lib/api/contracts.js`
- ✅ `src/lib/api/projects.js`
- ✅ `src/lib/api/finances.js`
- ✅ `src/lib/api/complaints.js`
- ✅ `src/lib/api/projectStatuses.js`
- ✅ `src/lib/api/technicalSpecifications.js`
- ✅ `src/lib/api/agents.js`
- ✅ `src/lib/api/clients.js`

**Изменения:**

```javascript
// Было:
import { GRAPHQL_ENDPOINT } from '$lib/config/api.js';
const response = await fetch(GRAPHQL_ENDPOINT, { ... });

// Стало:
import { getGraphQLEndpoint } from '$lib/config/api.js';
const graphqlEndpoint = getGraphQLEndpoint();
const response = await fetch(graphqlEndpoint, { ... });
```

## Как работает мультидоменная система

Конфигурация в `src/lib/config/domain.js`:

```javascript
const DOMAIN_CONFIG = {
	'admin.bonus.band': {
		authApi: 'https://auth.bonus.band',
		api: 'https://api.bonus.band'
	},
	'rubonus.pro': {
		authApi: 'https://auth.rubonus.pro',
		api: 'https://api.rubonus.pro'
	},
	'localhost': {
		authApi: 'http://localhost:8001',
		api: 'http://localhost:8000'
	}
};
```

Система автоматически определяет текущий домен и использует соответствующие API URLs.

## Результат

Теперь:
- `rubonus.pro` → запросы идут на `api.rubonus.pro`
- `admin.bonus.band` → запросы идут на `api.bonus.band`
- Cookie отправляется корректно (тот же домен)
- Все операции работают без ошибок CORS

## Деплой

```bash
cd b5-admin
npm run build
# Деплой на продакшен
```

Никаких дополнительных настроек не требуется.

## Проверка

1. Открыть `https://rubonus.pro`
2. Залогиниться
3. DevTools → Network
4. Выполнить любую операцию (смена статуса, создание договора и т.д.)
5. Проверить URL запроса: должен быть `https://api.rubonus.pro/graphql`
6. Проверить Cookie в Request Headers: должна присутствовать

## Файлы, которые НЕ требуют изменений

Эти файлы используют другой подход или не делают прямые GraphQL запросы:
- `src/lib/api/companies.js` - использует другой подход
- `src/lib/api/orders.js` - использует другой подход
- `src/lib/api/actions.js` - использует другой подход
- `src/lib/api/server.js` - серверный API

## Связанные документы

- `CONTRACT_STATUS_FIX.md` - детали исправления смены статуса договора
- `RUBONUS_DOMAIN_ISSUE.md` - подробное объяснение проблемы
- `../src/lib/config/domain.js` - мультидоменная конфигурация
