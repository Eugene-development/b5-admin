# Изменение статусов бонусов

## Дата: 27.12.2025

## Описание изменений

Статусы бонусов в системе были упрощены с трёх до двух:

### Было (3 статуса):
1. **Начислено** (`accrued`) - Бонус начислен, ожидает оплаты партнёром
2. **Доступно к выплате** (`available_for_payment`) - Партнёр оплатил, бонус доступен к выплате агенту
3. **Выплачено** (`paid`) - Бонус выплачен агенту

### Стало (2 статуса):
1. **Ожидание** (`pending`) - Бонус ожидает выплаты
2. **Выплачено** (`paid`) - Бонус выплачен агенту

## Затронутые компоненты

### База данных (b5-db-2)
- Миграция: `2025_12_27_000001_update_bonus_statuses_to_two_states.php`
- Таблица: `bonus_statuses`
- Все бонусы со статусом `available_for_payment` автоматически переведены в `pending`

### Фронтенд (b5-admin)
- `FinancesBonusTable.svelte` - убран столбец "Дост" (Доступно)
- `BonusPaymentStatusIndicator.svelte` - обновлены цвета и логика статусов
- `BonusPaymentStatusBadge.svelte` - обновлены цвета и логика статусов
- `/routes/(protected)/finances/+page.svelte` - обновлена статистика и фильтры
- `src/lib/api/finances.js` - обновлены GraphQL запросы

### Фронтенд (b5-agent)
- `BonusesTable.svelte` - обновлены цвета статусов
- `BonusStatsCards.svelte` - обновлена статистика
- `src/lib/api/finances.js` - обновлены GraphQL запросы
- `src/lib/state/finances.svelte.js` - обновлена структура данных

## Применение изменений

1. Запустить миграцию базы данных:
   ```bash
   cd b5-db-2
   php artisan migrate
   ```

2. Пересобрать фронтенд проекты:
   ```bash
   cd b5-admin && npm run build
   cd b5-agent && npm run build
   ```

## Откат изменений

Для отката миграции:
```bash
cd b5-db-2
php artisan migrate:rollback --step=1
```

Это восстановит три статуса и вернёт все бонусы в исходное состояние.
