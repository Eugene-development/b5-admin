# Изменения: Функционал изменения статуса проекта

## Дата: 23 октября 2025

## Описание

Добавлен функционал изменения статуса проекта в модальном окне редактирования проекта на странице проектов в b5-admin.

## Изменения в Backend (b5-api-2)

### 1. GraphQL Schema (`b5-api-2/graphql/project.graphql`)

- Добавлен новый запрос `projectStatuses` для получения списка всех статусов проектов
- Добавлено поле `status_id` в `UpdateProjectInput` для возможности изменения статуса при обновлении проекта
- Обновлен тип `ProjectStatusType` в мутации `updateProject` для включения полей `sort_order` и `is_default`

```graphql
extend type Query {
    ...
    "Get all project statuses"
    projectStatuses: [ProjectStatusType!]! @all(model: "App\\Models\\ProjectStatus")
}

input UpdateProjectInput {
    id: ID!
    value: String
    user_id: ID
    status_id: ID  # Новое поле
    ...
}
```

## Изменения в Frontend (b5-admin)

### 1. Новый API модуль (`b5-admin/src/lib/api/projectStatuses.js`)

Создан новый модуль для работы со статусами проектов:

- Функция `getProjectStatuses()` - получение списка всех статусов проектов
- Поддержка server-side и client-side fetch
- Обработка ошибок и retry механизм

### 2. Обновлен компонент ProjectEditModal (`b5-admin/src/lib/components/ProjectEditModal.svelte`)

- Добавлен импорт `getProjectStatuses` из нового API модуля
- Добавлено состояние для хранения списка статусов проектов
- Добавлено поле `status_id` в форму редактирования
- Добавлен select для выбора статуса проекта с фильтрацией активных статусов и сортировкой
- Обновлена логика сохранения для включения `status_id` в данные обновления

### 3. Обновлен API модуль проектов (`b5-admin/src/lib/api/projects.js`)

- Обновлена мутация `UPDATE_PROJECT_MUTATION` для включения полей `sort_order` и `is_default` в ответе

## База данных

### Существующие компоненты (уже были созданы ранее)

- Миграция `2025_14_10_120000_create_project_statuses_table.php` - создание таблицы статусов
- Миграция `2025_14_10_120001_add_status_id_to_projects_table.php` - добавление связи с проектами
- Модель `ProjectStatus` - модель для работы со статусами
- Сидер `ProjectStatusSeeder` - начальные данные статусов (8 статусов)

### Статусы проектов (из сидера)

1. Новый проект (по умолчанию)
2. Принят куратором
3. ТЗ отправлено
4. Договор оформлен
5. Договор выполнен
6. Бонус начислен
7. Бонус оплачен
8. Клиент отказался

## Использование

### Для администратора

1. Открыть страницу "Проекты" в админ-панели
2. Нажать кнопку "Редактировать" на нужном проекте
3. В модальном окне выбрать новый статус из выпадающего списка
4. Нажать "Сохранить изменения"

### Логика отображения кнопки "Принять"

Кнопка "Принять" отображается только для проектов, которые:

1. Еще не приняты ни одним пользователем
2. Имеют статус "Новый проект" (slug: 'new-project')

При изменении статуса проекта на любой другой, кнопка "Принять" автоматически скрывается.

### Для разработчика

```javascript
// Получение списка статусов
import { getProjectStatuses } from '$lib/api/projectStatuses.js';

const statuses = await getProjectStatuses();

// Обновление проекта с новым статусом
import { updateProject } from '$lib/api/projects.js';

await updateProject({
	id: projectId,
	status_id: newStatusId
	// другие поля...
});
```

## Тестирование

### Запуск сидера (если статусы еще не созданы)

```bash
cd b5-db-2
php artisan db:seed --class=ProjectStatusSeeder
```

### Проверка GraphQL запроса

```graphql
query {
	projectStatuses {
		id
		value
		slug
		color
		icon
		sort_order
		is_active
	}
}
```

### Проверка обновления проекта

```graphql
mutation {
	updateProject(input: { id: "PROJECT_ID", status_id: "STATUS_ID" }) {
		id
		value
		status {
			id
			value
		}
	}
}
```

## Примечания

- Все статусы имеют цветовую маркировку для визуального отображения
- В выпадающем списке отображаются только активные статусы
- Статусы отсортированы по полю `sort_order`
- Поле статуса необязательное - можно оставить пустым
