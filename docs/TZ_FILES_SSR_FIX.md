# Исправление отображения файлов ТЗ при SSR

## Дата: 6 декабря 2025

## Проблема

При обновлении страницы `/tz` в браузере (F5) данные о файлах (эскизы и коммерческие предложения) не отображались в таблице. Файлы появлялись только после нажатия кнопки "Обновить".

## Причина

Серверный загрузчик данных (`+page.server.js`) не запрашивал поля `sketches` и `commercialOffers` из GraphQL API, поэтому при серверном рендеринге (SSR) эти данные не загружались.

При нажатии кнопки "Обновить" использовался клиентский API (`technicalSpecifications.js`), который запрашивал полные данные включая файлы.

## Решение

### 1. Обновлен серверный загрузчик

**Файл:** `b5-admin/src/routes/(protected)/(business-processes)/tz/+page.server.js`

Добавлены поля в GraphQL запрос:

```javascript
const TZ_QUERY = `
	query GetTechnicalSpecifications($first: Int!, $page: Int) {
		technicalSpecifications(first: $first, page: $page) {
			data {
				id
				value
				project_id
				project { ... }
				description
				comment
				is_active
				requires_approval
				is_approved
				files {
					id
					file_type
					file_name
					file_path
					file_size
					mime_type
					uploaded_by
					uploader {
						id
						name
						email
					}
					created_at
					updated_at
				}
				sketches {
					id
					file_type
					file_name
					file_path
					file_size
					mime_type
					uploaded_by
					uploader {
						id
						name
						email
					}
					created_at
					updated_at
				}
				commercialOffers {
					id
					file_type
					file_name
					file_path
					file_size
					mime_type
					uploaded_by
					uploader {
						id
						name
						email
					}
					created_at
					updated_at
				}
				created_at
				updated_at
			}
		}
	}
`;
```

### 2. Улучшена синхронизация данных на клиенте

**Файл:** `b5-admin/src/routes/(protected)/(business-processes)/tz/+page.svelte`

Изменена логика инициализации в `onMount` для надежной загрузки серверных данных:

```javascript
// Load projects and initialize data on mount
onMount(async () => {
	loadProjects();

	// Initialize from server data if available
	try {
		const tzData = await data.tzData;
		if (tzData && tzData.tzList && tzData.tzList.length > 0) {
			tzList = tzData.tzList;
			console.log('📊 TZ: Initialized from server data:', tzList.length, 'items');
		} else if (tzList.length === 0) {
			// Fallback: load data if server data is empty
			await loadServices(true);
		}
	} catch (error) {
		console.error('Failed to load server data:', error);
		// Fallback: load data on error
		if (tzList.length === 0) {
			await loadServices(true);
		}
	}
});
```

Удалена старая логика инициализации в шаблоне, которая работала ненадежно:

```javascript
// Удалено:
{#if !tzList.length && tzData.tzList.length}
	{((tzList = tzData.tzList), '')}
{/if}
```

### 3. Добавлена сортировка при клиентском обновлении

**Файл:** `b5-admin/src/routes/(protected)/(business-processes)/tz/+page.svelte`

Добавлена сортировка в функцию `loadServices` для консистентности с серверной сортировкой:

```javascript
async function loadServices(isInitialLoad = false) {
	isRefreshing = true;
	try {
		const refreshedData = await refreshTechnicalSpecifications();
		
		// Sort by created_at descending (newest first) to match server-side sorting
		const sortedData = [...(refreshedData || [])].sort((a, b) => {
			const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
			const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
			return dateB - dateA;
		});
		
		tzList = sortedData;
		// ...
	}
}
```

## Результат

✅ Файлы отображаются сразу при загрузке страницы (SSR)  
✅ Данные корректно синхронизируются между сервером и клиентом  
✅ Обновление через кнопку "Обновить" продолжает работать  
✅ Порядок элементов остается консистентным (новые первыми) при любом способе загрузки  

## Тестирование

1. Откройте страницу `/tz` в браузере
2. Убедитесь, что столбцы "Эскизы" и "КП" показывают количество файлов
3. Нажмите F5 для обновления страницы
4. Проверьте, что данные о файлах остались на месте
5. Загрузите новый файл
6. Убедитесь, что счетчик обновился

## Связанные файлы

- `b5-admin/src/routes/(protected)/(business-processes)/tz/+page.server.js` - серверный загрузчик
- `b5-admin/src/routes/(protected)/(business-processes)/tz/+page.svelte` - страница
- `b5-admin/src/lib/api/technicalSpecifications.js` - клиентский API

## Примечания

- Серверный и клиентский GraphQL запросы теперь синхронизированы
- Используется реактивный `$effect` вместо условного рендеринга в шаблоне
- Логирование помогает отслеживать инициализацию данных
