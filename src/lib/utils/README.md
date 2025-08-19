# Утилиты форматирования данных

Этот модуль содержит функции для форматирования различных типов данных в проектах B5 Admin.

## Основные функции

### Финансовые данные

```javascript
import { formatCurrency, formatAgentRate } from '$lib/utils/formatters.js';

// Форматирование валюты
formatCurrency(1500000); // "1 500 000 ₽"
formatCurrency(1000, 'USD'); // "1 000 $"
formatCurrency(null); // "Не указано"

// Форматирование ставки агента
formatAgentRate(15, 'percentage'); // "15%"
formatAgentRate(50000, 'fixed'); // "50 000 ₽"
```

### Даты

```javascript
import { formatDate, isOverdue, getDateUrgency } from '$lib/utils/formatters.js';
import { getRelativeTime, getDateUrgencyClasses } from '$lib/utils/dateUtils.js';

// Форматирование даты
formatDate('2025-01-15'); // "15.01.2025"
formatDate(null); // "Не указано"

// Проверка просрочки
isOverdue('2025-01-10'); // true (если сегодня позже)

// Относительное время
getRelativeTime('2025-01-20'); // "Через 5 дней"

// CSS классы для срочности
getDateUrgencyClasses('2025-01-10'); // "text-red-600 font-semibold bg-red-50 px-2 py-1 rounded"
```

### Текст

```javascript
import { truncateText, isTruncated } from '$lib/utils/formatters.js';

// Обрезка текста
truncateText('Очень длинное описание проекта...', 50); // "Очень длинное описание проекта..."
isTruncated('Короткий текст', 50); // false
```

### Агенты

```javascript
import { formatAgentDisplay } from '$lib/utils/formatters.js';

const agent = { name: 'Иван Иванов', email: 'ivan@example.com' };
formatAgentDisplay(agent); // "Иван Иванов (ivan@example.com)"
formatAgentDisplay(null); // "Не назначен"
```

## Компоненты

### TruncatedText

Компонент для отображения текста с автоматической обрезкой и tooltip:

```svelte
<script>
  import { TruncatedText } from '$lib';
</script>

<TruncatedText 
  text="Очень длинное описание проекта которое нужно обрезать"
  maxLength={100}
  className="text-gray-700"
/>
```

### DateDisplay

Компонент для отображения дат с цветовой индикацией:

```svelte
<script>
  import { DateDisplay } from '$lib';
</script>

<DateDisplay 
  date="2025-01-15"
  showRelative={true}
  className="text-sm"
/>
```

### CurrencyDisplay

Компонент для отображения финансовых данных:

```svelte
<script>
  import { CurrencyDisplay } from '$lib';
</script>

<CurrencyDisplay 
  amount={1500000}
  currency="RUB"
  size="large"
/>

<CurrencyDisplay 
  amount={15}
  type="agent_rate"
  rateType="percentage"
/>
```

### AgentDisplay

Компонент для отображения информации об агенте:

```svelte
<script>
  import { AgentDisplay } from '$lib';
</script>

<AgentDisplay 
  agent={{ name: 'Иван Иванов', email: 'ivan@example.com', id: 1 }}
  clickable={true}
  showId={true}
/>
```

## Цветовая индикация дат

Система автоматически применяет цветовую индикацию для дат:

- **Красный** (overdue): Просроченные даты
- **Оранжевый** (urgent): До 3 дней
- **Желтый** (warning): До 7 дней  
- **Серый** (normal): Более 7 дней

## Локализация

Все функции поддерживают русскую локализацию:
- Форматирование чисел и валют по российским стандартам
- Правильные падежи для дней ("1 день", "2 дня", "5 дней")
- Русские названия для состояний ("Не указано", "Не назначен")