# Компонент DateBadge

## Описание

`DateBadge` - универсальный компонент для единообразного отображения дат во всех таблицах приложения.

## Расположение

`b5-admin/src/lib/components/common/DateBadge.svelte`

## Особенности

- Серый фон с закругленными углами
- Поддержка светлой и темной темы
- Автоматическое форматирование даты в русском формате
- Удаление точки после сокращения месяца
- Настраиваемый fallback текст

## Использование

```svelte
<script>
	import DateBadge from '$lib/components/common/DateBadge.svelte';
</script>

<!-- Базовое использование -->
<DateBadge date={contract.contract_date} />

<!-- С кастомным fallback -->
<DateBadge date={user.created_at} fallback="Не указана" />
```

## Props

| Prop | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `date` | `string \| null` | `null` | ISO строка даты |
| `fallback` | `string` | `'Не указана'` | Текст при отсутствии даты |

## Формат отображения

Входная дата: `2024-12-17T10:30:00Z`

Выходной формат: `17 дек 2024`

## Стилизация

- Фон: `bg-gray-100` (светлая тема) / `bg-gray-700` (темная тема)
- Текст: `text-gray-900` (светлая тема) / `text-gray-100` (темная тема)
- Padding: `px-2 py-1`
- Размер текста: `text-sm`
- Скругление: `rounded-md`

## Где используется

Компонент подключен в следующих таблицах:

1. **ContractsTable** - столбец "Дата"
   - `b5-admin/src/lib/components/business-processes/contracts/ContractsTable.svelte`

2. **FinancesBonusTable** - столбцы "Начислено", "Доступно", "Выплачено"
   - `b5-admin/src/lib/components/business-processes/finances/FinancesBonusTable.svelte`

3. **AgentPaymentsTable** - столбец "Дата платежа"
   - `b5-admin/src/lib/components/business-processes/finance/AgentPaymentsTable.svelte`

4. **UsersTable** - столбец "Дата регистрации"
   - `b5-admin/src/lib/components/management/users/UsersTable.svelte`

## Миграция

При добавлении новых таблиц с датами используйте `DateBadge` вместо создания собственных функций `formatDate`.

### До:

```svelte
<script>
	function formatDate(dateString) {
		if (!dateString) return 'Не указана';
		return new Date(dateString).toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<td class="px-6 py-5 text-sm text-gray-900">
	{formatDate(item.date)}
</td>
```

### После:

```svelte
<script>
	import DateBadge from '$lib/components/common/DateBadge.svelte';
</script>

<td class="px-6 py-5 text-sm">
	<DateBadge date={item.date} />
</td>
```

## Преимущества

- ✅ Единообразный внешний вид дат во всем приложении
- ✅ Централизованная логика форматирования
- ✅ Легкость обновления стилей
- ✅ Меньше дублирования кода
- ✅ Автоматическая поддержка темной темы
