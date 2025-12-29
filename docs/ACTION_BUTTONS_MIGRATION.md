# Миграция кнопок действий на универсальные компоненты

## ✅ Миграция завершена (100%)

Все таблицы в проекте b5-admin успешно обновлены с использованием новых универсальных компонентов кнопок `ActionButton` и `MobileActionButton`.

## Обновленные таблицы

### Бизнес-процессы
- ✅ `TzTable.svelte` - обновлены кнопки для desktop и mobile
- ✅ `ActionTable.svelte` - обновлены кнопки для всех трех layout (mobile, compact, desktop)
- ✅ `ActionButtons.svelte` - обновлены кнопки для всех layout
- ✅ `ComplaintsTable.svelte` - обновлены кнопки для desktop и mobile
- ✅ `ContractsTable.svelte` - обновлены кнопки для desktop и mobile
- ✅ `OrderTable.svelte` - обновлены кнопки для desktop и mobile
- ✅ `AgentPaymentsTable.svelte` - обновлены кнопки для desktop и mobile (включая approve/reject)

### Контрагенты
- ✅ `CompanyTable.svelte` - обновлены кнопки для desktop и mobile
- ✅ `ServiceTable.svelte` - обновлены кнопки для desktop и mobile

### Менеджмент
- ✅ `AgentsTable.svelte` - обновлены кнопки удаления
- ✅ `UsersTable.svelte` - обновлены кнопки просмотра, редактирования и удаления для desktop, mobile и tablet
- ✅ `ClientsTable.svelte` - обновлены кнопки для desktop, mobile и tablet

**Страницы, использующие UsersTable:**
- Агенты (`/agents`)
- Кураторы (`/curators`)
- Менеджеры (`/managers`)
- Дизайнеры (`/designers`)

## Варианты кнопок

- `view` - Просмотр (серый)
- `edit` - Редактирование (синий)
- `delete` - Удаление (красный)
- `upload` - Загрузка (фиолетовый)
- `download` - Скачивание (изумрудный)
- `approve` - Одобрение (зеленый)
- `reject` - Отклонение (оранжевый)
- `custom` - Кастомный цвет

## Пример замены

### Было:
```svelte
<button
	type="button"
	onclick={() => onView && onView(item)}
	class="inline-flex items-center rounded-md bg-gray-600 px-2.5 py-1.5 text-xs font-semibold text-white..."
>
	<svg class="h-4 w-4">...</svg>
</button>
```

### Стало:
```svelte
<ActionButton
	variant="view"
	onclick={() => onView && onView(item)}
	ariaLabel="Просмотреть {item.name}"
	title="Просмотреть"
/>
```
