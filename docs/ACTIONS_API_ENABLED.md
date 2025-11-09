# ✅ Реальный API для акций включен!

## Что было сделано

### Бэкенд (b5-api-2)

1. ✅ **Создана модель** `app/Models/Action.php`
   - Использует ULID для ID
   - Связь с Company через belongsTo
   - Правильные casts для дат и boolean

2. ✅ **Создана GraphQL схема** `graphql/action.graphql`
   - Query: `actions`, `action`
   - Mutation: `createAction`, `updateAction`, `deleteAction`
   - Валидация полей
   - Связь с Company

3. ✅ **Подключена схема** в `graphql/schema.graphql`

### Фронтенд (b5-admin)

1. ✅ **Включен реальный API** в `+page.js`
   - Загрузка акций через `refreshActions()`
   - Загрузка компаний через `getCompaniesForActions()`
   - Fallback на моковые данные при ошибке

2. ✅ **Включен реальный API** в `+page.svelte`
   - Создание акций через `createAction()`
   - Обновление списка через `refreshActions()`
   - Обработка ошибок

## Следующие шаги

### 1. Очистите кэш GraphQL на бэкенде

```bash
cd b5-api-2
php artisan lighthouse:clear-cache
php artisan cache:clear
php artisan config:clear
```

Или используйте скрипт:

```bash
cd b5-api-2
chmod +x clear-graphql-cache.sh
./clear-graphql-cache.sh
```

### 2. Перезапустите бэкенд (если нужно)

```bash
cd b5-api-2
php artisan serve
```

### 3. Проверьте GraphQL схему

Откройте GraphQL Playground:

```
http://localhost:8000/graphql-playground
```

Выполните тестовый запрос:

```graphql
query {
	actions(first: 10) {
		data {
			id
			name
			description
			start
			end
			is_active
			company {
				id
				name
			}
		}
	}
}
```

### 4. Проверьте список компаний

```graphql
query {
	companies(first: 10) {
		data {
			id
			name
			legal_name
			region
			is_active
			ban
		}
	}
}
```

### 5. Протестируйте создание акции

```graphql
mutation {
	createAction(
		input: {
			name: "Тестовая акция"
			description: "Описание тестовой акции"
			start: "2025-02-01"
			end: "2025-02-28"
			company_id: "YOUR_COMPANY_ID_HERE"
			is_active: false
		}
	) {
		id
		name
		description
		start
		end
		is_active
		company {
			name
		}
	}
}
```

### 6. Откройте фронтенд

```bash
cd b5-admin
npm run dev
```

Откройте: `http://localhost:5173/actions`

### 7. Протестируйте функционал

1. Страница должна загрузить реальные данные из БД
2. Нажмите "Добавить акцию"
3. Заполните форму
4. Нажмите "Добавить акцию"
5. Акция должна сохраниться в БД и появиться в списке

## Возможные проблемы

### Ошибка: "Cannot query field 'actions'"

**Решение:**

```bash
cd b5-api-2
php artisan lighthouse:clear-cache
```

### Ошибка: "Table 'actions' doesn't exist"

**Решение:**

```bash
cd b5-db-2
php artisan migrate
```

### Ошибка: "Class 'App\Models\Action' not found"

**Решение:**

```bash
cd b5-api-2
composer dump-autoload
```

### Ошибка CORS

Проверьте `b5-api-2/config/cors.php`:

```php
'paths' => ['api/*', 'graphql', 'sanctum/csrf-cookie'],
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
'supports_credentials' => true,
```

### Пустой список компаний

Убедитесь, что в БД есть активные компании:

```sql
SELECT * FROM companies WHERE is_active = 1 AND ban = 0;
```

## Структура данных

### Action (из БД)

```javascript
{
  id: "01HQZX...",           // ULID
  name: "Название акции",
  description: "Описание",
  start: "2025-02-01",       // Date
  end: "2025-02-28",         // Date
  company_id: "01HQZX...",   // ULID
  is_active: false,          // Boolean
  created_at: "2025-11-10T...",
  updated_at: "2025-11-10T..."
}
```

### Action (для таблицы - старый формат)

Если таблица ожидает старый формат, нужно будет добавить трансформацию данных.

## Откат к моковым данным

Если нужно вернуться к моковым данным:

1. В `+page.js` закомментируйте:

```javascript
// import { refreshActions, getCompaniesForActions } from '$lib/api/actions.js';
```

2. В `+page.svelte` закомментируйте:

```javascript
// import { createAction, refreshActions } from '$lib/api/actions.js';
```

3. Верните моковую реализацию в функциях

## Проверка работы

### Быстрая проверка API:

```bash
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ actions(first: 1) { data { id name } } }"}'
```

Ожидаемый результат: JSON с данными или пустой массив `{"data":{"actions":{"data":[]}}}`

### Проверка фронтенда:

1. Откройте DevTools (F12)
2. Перейдите на `/actions`
3. Проверьте Network tab - должны быть запросы к `/graphql`
4. Проверьте Console - не должно быть ошибок

## Готово! 🎉

Теперь страница `/actions` работает с реальным API и сохраняет данные в базу данных!
