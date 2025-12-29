# Миграция SearchBar на всех страницах

## Цель
Перенести компонент SearchBar на место заголовка H1, а сам заголовок скрыть (оставить только для screen readers).

## Статус выполнения

### ✅ Выполнено

#### Управление (Management)
- `/clients` - Клиенты
- `/agents` - Агенты
- `/curators` - Кураторы
- `/designers` - Дизайнеры  
- `/managers` - Менеджеры

#### Контрагенты (Counterparties)
- `/services` - Услуги
- `/contractors` - Подрядчики
- `/suppliers` - Поставщики
- `/delivery` - Доставка

#### Бизнес-процессы (Business Processes)
- `/projects` - Проекты
- `/complaints` - Жалобы
- `/contracts` - Договоры
- `/finance` - Финансы (Выплаты агентам)
- `/tz` - Техзадания
- `/actions` - Действия
- `/order` - Заказы

#### Финансы
- `/finances` - Финансы (Бонусы)

## Шаблон изменений

### Было:
```svelte
<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
	<div class="flex items-center justify-between">
		<div>
			<h1 id="page-title" class="text-4xl font-semibold text-gray-900 dark:text-white">
				Заголовок
			</h1>
		</div>
	</div>
	<div class="flex items-center space-x-3">
		<!-- Buttons -->
	</div>
</div>

<!-- Separator -->
<div class="my-4 border-t border-gray-200 dark:border-gray-700"></div>

<!-- Search and Filters -->
<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
	<div class="flex flex-1 items-center space-x-4">
		<SearchBar bind:value={searchTerm} onSearch={handleSearch} />
	</div>
</div>
```

### Стало:
```svelte
<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
	<div class="flex flex-1 items-center justify-start">
		<div class="w-full max-w-md">
			<SearchBar bind:value={searchTerm} onSearch={handleSearch} />
		</div>
	</div>
	<div class="flex items-center justify-end space-x-3">
		<!-- Buttons -->
	</div>
</div>

<!-- Hidden H1 for accessibility -->
<h1 id="page-title" class="sr-only">
	Заголовок
</h1>

<!-- Separator -->
<div class="my-4 border-t border-gray-200 dark:border-gray-700"></div>
```

## Ключевые изменения

1. **SearchBar перемещён** в первую позицию header'а (слева)
2. **H1 скрыт** с помощью класса `sr-only` (доступен для screen readers)
3. **Удалён** отдельный блок "Search and Filters" после separator'а
4. **Кнопки** остаются справа с классом `justify-end`

## Примечания

- Сохраняется `id="page-title"` для accessibility
- Сохраняется `aria-labelledby="page-title"` на `<main>`
- SearchBar получает `max-w-md` для ограничения ширины
- Все функциональные обработчики остаются без изменений
