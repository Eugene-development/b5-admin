# Исправление смены статуса договора на rubonus.pro

## Проблема

При смене статуса договора на `https://rubonus.pro` возникала ошибка CORS:
```
Access to fetch at 'https://api.bonus.band/graphql' from origin 'https://rubonus.pro' 
has been blocked by CORS policy
```

## Причина

Файл `contracts.js` использовал статический `GRAPHQL_ENDPOINT`, который не учитывал мультидоменную систему. Запросы шли на `api.bonus.band` вместо `api.rubonus.pro`, и httpOnly cookie не отправлялась (разные домены).

## Решение

### Изменения в коде

**1. `src/lib/config/api.js`**

Добавлена функция для динамического определения GraphQL endpoint:

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

**2. `src/lib/api/contracts.js`**

Изменен импорт и использование:

```javascript
// Было:
import { GRAPHQL_ENDPOINT } from '$lib/config/api.js';
const response = await fetchFunction(GRAPHQL_ENDPOINT, { ... });

// Стало:
import { getGraphQLEndpoint } from '$lib/config/api.js';
const graphqlEndpoint = getGraphQLEndpoint();
const response = await fetchFunction(graphqlEndpoint, { ... });
```

## Как это работает

Мультидоменная система (`domain.js`) автоматически определяет правильный API URL на основе текущего домена:

- `rubonus.pro` → `https://api.rubonus.pro/graphql`
- `admin.bonus.band` → `https://api.bonus.band/graphql`
- `localhost` → `http://localhost:8000/graphql`

Теперь cookie с доменом `.rubonus.pro` корректно отправляется на `api.rubonus.pro`.

## Деплой

После коммита изменений:

```bash
cd b5-admin
npm run build
# Деплой build на продакшен
```

Никаких дополнительных настроек не требуется - мультидоменная система уже настроена.

## Проверка

1. Открыть `https://rubonus.pro`
2. Залогиниться
3. Открыть DevTools → Network
4. Изменить статус договора
5. Проверить запрос к GraphQL:
   - URL должен быть `https://api.rubonus.pro/graphql`
   - В Request Headers должна быть `Cookie: b5_auth_token=...`
   - Ошибок быть не должно

## Связанные файлы

- `src/lib/config/domain.js` - мультидоменная система
- `src/lib/config/api.js` - конфигурация API
- `src/lib/api/contracts.js` - API для работы с договорами
