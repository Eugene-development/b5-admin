# Трансформация данных акций

## Проблема

API возвращает данные в формате:

```javascript
{
  id: "01HQZX...",
  name: "Название акции",
  description: "Описание",
  start: "2025-02-01",
  end: "2025-02-28",
  company_id: "01HQZX...",
  is_active: false,
  company: {
    id: "01HQZX...",
    name: "ООО Компания",
    region: "Москва"
  }
}
```

Но таблица `ActionTable.svelte` ожидает данные в формате:

```javascript
{
  id: 1,
  company_name: "ООО Компания",
  action_name: "Название акции",
  region: "Москва",
  start_date: "2025-02-01",
  end_date: "2025-02-28",
  description: "Описание",
  comment: "Акция активна"
}
```

## Решение

В файле `+page.js` добавлена трансформация данных:

```javascript
const actions = actionsData.map((action) => ({
	id: action.id,
	company_name: action.company?.name || 'Не указано',
	action_name: action.name,
	phone: action.company?.phone || '',
	contact_person: action.company?.contact_person || '',
	region: action.company?.region || 'Не указан',
	start_date: action.start,
	end_date: action.end,
	description: action.description,
	comment: action.is_active ? 'Акция активна' : 'Акция неактивна',
	is_active: action.is_active,
	company_id: action.company_id,
	created_at: action.created_at,
	updated_at: action.updated_at,
	_original: action // Сохраняем оригинальные данные для редактирования
}));
```

## Маппинг полей

| API поле         | Таблица поле   | Описание                       |
| ---------------- | -------------- | ------------------------------ |
| `id`             | `id`           | ID акции                       |
| `name`           | `action_name`  | Название акции                 |
| `description`    | `description`  | Описание акции                 |
| `start`          | `start_date`   | Дата начала                    |
| `end`            | `end_date`     | Дата окончания                 |
| `company.name`   | `company_name` | Название компании              |
| `company.region` | `region`       | Регион компании                |
| `is_active`      | `comment`      | Статус (преобразуется в текст) |

## Дополнительные поля

- `_original` - сохраняет оригинальные данные от API для использования при редактировании
- `comment` - генерируется на основе `is_active`
- `phone`, `contact_person` - заполняются из данных компании (если доступны)

## Альтернативное решение

Можно было бы обновить `ActionTable.svelte` для работы с новым форматом данных, но это потребовало бы больше изменений и могло бы сломать существующий функционал.

## Будущие улучшения

1. Обновить `ActionTable.svelte` для работы напрямую с API форматом
2. Добавить TypeScript типы для обоих форматов
3. Создать отдельную функцию трансформации для переиспользования
