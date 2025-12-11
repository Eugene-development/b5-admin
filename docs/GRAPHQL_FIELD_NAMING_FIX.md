# Исправление именования полей GraphQL

## Проблема

При открытии модального окна создания договора возникала ошибка:
```
Cannot query field "agentBonus" on type "Contract". Did you mean "agent_bonus"?
```

## Причина

В GraphQL схеме используется snake_case (`agent_bonus`, `curator_bonus`), но в некоторых фронтенд запросах использовался camelCase (`agentBonus`).

## Решение

### 1. Обновлен GraphQL запрос в `b5-admin/src/lib/api/projects.js`

**Было:**
```graphql
contracts {
    agentBonus {
        id
        commission_amount
        status {
            id
            code
            name
        }
    }
}
```

**Стало:**
```graphql
contracts {
    agent_bonus
    curator_bonus
    is_active
}
```

### 2. Обновлен компонент `ProjectViewModal.svelte`

**Было:**
```svelte
{#if contract.agentBonus}
    {formatCurrency(contract.agentBonus.commission_amount)}
{/if}
```

**Стало:**
```svelte
{#if contract.agent_bonus > 0}
    {formatCurrency(contract.agent_bonus)}
{/if}
```

## Изменения

- Удалена попытка запроса несуществующего поля `agentBonus` как объекта
- Используются простые числовые поля `agent_bonus` и `curator_bonus` из схемы Contract
- Упрощена логика отображения бонусов (без статусов, так как это поля самого договора)

### 3. Добавлено отношение `orders()` в модель `Project`

**Проблема:**
```
Call to undefined method App\Models\Project::orders()
```

**Решение:**
Добавлен метод `orders()` в модель `Project`:

```php
/**
 * Get the orders for the project.
 */
public function orders(): HasMany
{
    return $this->hasMany(Order::class);
}
```

## Связанные файлы

- `b5-admin/src/lib/api/projects.js` - GraphQL запросы
- `b5-admin/src/lib/components/business-processes/projects/ProjectViewModal.svelte` - Компонент отображения
- `b5-api-2/graphql/contract.graphql` - GraphQL схема Contract
- `b5-api-2/app/Models/Project.php` - Модель Project (добавлено отношение orders)

## Примечание

Поля `agent_bonus` и `curator_bonus` в модели Contract - это рассчитанные значения бонусов, которые автоматически пересчитываются при изменении суммы договора или процентов. Они не связаны с таблицей `agent_bonuses`, которая используется для отслеживания статусов выплат.
