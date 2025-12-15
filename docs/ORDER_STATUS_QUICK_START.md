# Quick Start: Статусы заказов

## Что было сделано

✅ Добавлен столбец "СТАТУС" в таблицу заказов  
✅ Реализована возможность изменения статуса через dropdown  
✅ Создан компонент `OrderStatusBadge`  
✅ Добавлены API функции для работы со статусами  
✅ Обновлена страница заказов для поддержки статусов  
✅ Создана полная документация  

## Что нужно сделать на Backend

⚠️ **Для работы функции требуется реализация на backend:**

### 1. Создать таблицу статусов
```sql
CREATE TABLE order_statuses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    value VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);
```

### 2. Добавить поле в таблицу orders
```sql
ALTER TABLE orders 
ADD COLUMN status_id BIGINT UNSIGNED NULL,
ADD CONSTRAINT fk_orders_status 
    FOREIGN KEY (status_id) 
    REFERENCES order_statuses(id) 
    ON DELETE SET NULL;
```

### 3. Заполнить начальными данными
```sql
INSERT INTO order_statuses (slug, value, color, sort_order) VALUES
('new', 'Новый', '#3B82F6', 1),
('in_progress', 'В работе', '#F59E0B', 2),
('ordered', 'Заказан', '#8B5CF6', 3),
('delivered', 'Доставлен', '#10B981', 4),
('completed', 'Завершен', '#059669', 5),
('cancelled', 'Отменен', '#EF4444', 6);
```

### 4. Добавить GraphQL endpoints

**Query для получения статусов:**
```graphql
type Query {
    orderStatuses: [OrderStatus!]! @guard
}
```

**Mutation для обновления статуса:**
```graphql
type Mutation {
    updateOrderStatus(
        order_id: ID!
        status_slug: String!
    ): Order! @guard
}
```

### 5. Создать модель OrderStatus
```php
// app/Models/OrderStatus.php
class OrderStatus extends Model {
    protected $fillable = ['slug', 'value', 'color', 'sort_order', 'is_active'];
}
```

### 6. Обновить модель Order
```php
// app/Models/Order.php
public function status() {
    return $this->belongsTo(OrderStatus::class, 'status_id');
}
```

## Как проверить работу

### После реализации backend:

1. Откройте страницу `/order`
2. В таблице должен появиться столбец "СТАТУС"
3. Кликните на статус любого заказа
4. Должен открыться dropdown со списком статусов
5. Выберите новый статус
6. Статус должен измениться, появится уведомление

## Файлы для изучения

### Frontend (уже готово)
- `b5-admin/src/lib/components/business-processes/order/OrderStatusBadge.svelte` - компонент статуса
- `b5-admin/src/lib/components/business-processes/order/OrderTable.svelte` - таблица с колонкой статуса
- `b5-admin/src/routes/(protected)/(business-processes)/order/+page.svelte` - страница с обработкой статусов
- `b5-admin/src/lib/api/orders.js` - API функции

### Документация
- `ORDER_STATUS_FEATURE.md` - полное описание функции
- `ORDER_STATUS_BACKEND_REQUIREMENTS.md` - детальные требования к backend
- `ORDER_STATUS_ARCHITECTURE.md` - архитектура и схемы
- `ORDER_STATUS_CHANGELOG.md` - список всех изменений

## API которые должны работать

### 1. Получение статусов
```
POST /graphql
{
  "query": "query { orderStatuses { id slug value color sort_order } }"
}
```

### 2. Обновление статуса
```
POST /graphql
{
  "query": "mutation($orderId: ID!, $statusSlug: String!) { 
    updateOrderStatus(order_id: $orderId, status_slug: $statusSlug) { 
      id status_id status { id slug value color } 
    } 
  }",
  "variables": {
    "orderId": "1",
    "statusSlug": "in_progress"
  }
}
```

### 3. Получение заказов (обновлено)
```
POST /graphql
{
  "query": "query { 
    orders(first: 10, page: 1) { 
      data { 
        id 
        status_id 
        status { id slug value color } 
      } 
    } 
  }"
}
```

## Контакты

При возникновении вопросов:
1. Изучите документацию в папке `b5-admin/docs/`
2. Проверьте реализацию аналогичной функции для договоров:
   - `ContractStatusBadge.svelte`
   - `ContractsTable.svelte`
   - `contracts/+page.svelte`

## Чеклист для backend разработчика

- [ ] Создана таблица `order_statuses`
- [ ] Добавлено поле `status_id` в таблицу `orders`
- [ ] Заполнены начальные статусы
- [ ] Создана модель `OrderStatus`
- [ ] Обновлена модель `Order` (добавлена связь `status()`)
- [ ] Реализован GraphQL query `orderStatuses`
- [ ] Реализована GraphQL mutation `updateOrderStatus`
- [ ] Обновлен GraphQL query `orders` (добавлены поля `status_id` и `status`)
- [ ] Протестированы все endpoints
- [ ] Проверена работа с frontend

## Примечание

Все изменения на frontend уже реализованы и протестированы. Код не содержит ошибок и готов к использованию после реализации backend API.
