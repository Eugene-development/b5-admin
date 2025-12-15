# Backend требования для статусов заказов

## Необходимые изменения в API

### 1. Создание таблицы статусов заказов

**Миграция:** `b5-db-2/database/migrations/`

```sql
CREATE TABLE IF NOT EXISTS order_statuses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    value VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Добавление поля status_id в таблицу orders

```sql
ALTER TABLE orders 
ADD COLUMN status_id BIGINT UNSIGNED NULL AFTER is_urgent,
ADD CONSTRAINT fk_orders_status 
    FOREIGN KEY (status_id) 
    REFERENCES order_statuses(id) 
    ON DELETE SET NULL;

CREATE INDEX idx_orders_status_id ON orders(status_id);
```

### 3. Заполнение начальными данными

```sql
INSERT INTO order_statuses (slug, value, color, sort_order) VALUES
('new', 'Новый', '#3B82F6', 1),
('in_progress', 'В работе', '#F59E0B', 2),
('ordered', 'Заказан', '#8B5CF6', 3),
('delivered', 'Доставлен', '#10B981', 4),
('completed', 'Завершен', '#059669', 5),
('cancelled', 'Отменен', '#EF4444', 6);
```

### 4. GraphQL схема

**Файл:** `b5-api-2/graphql/order.graphql`

```graphql
# Тип статуса заказа
type OrderStatus {
    id: ID!
    slug: String!
    value: String!
    color: String!
    sort_order: Int!
    is_active: Boolean!
    created_at: DateTime!
    updated_at: DateTime!
}

# Обновить тип Order
type Order {
    id: ID!
    # ... существующие поля
    status_id: ID
    status: OrderStatus
}

# Query для получения статусов
extend type Query {
    orderStatuses: [OrderStatus!]! @guard
}

# Mutation для обновления статуса
extend type Mutation {
    updateOrderStatus(
        order_id: ID!
        status_slug: String!
    ): Order! @guard
}
```

### 5. Resolver для получения статусов

**Файл:** `b5-api-2/app/GraphQL/Queries/OrderStatusesQuery.php`

```php
<?php

namespace App\GraphQL\Queries;

use App\Models\OrderStatus;

class OrderStatusesQuery
{
    public function __invoke($rootValue, array $args)
    {
        return OrderStatus::where('is_active', true)
            ->orderBy('sort_order')
            ->get();
    }
}
```

### 6. Resolver для обновления статуса

**Файл:** `b5-api-2/app/GraphQL/Mutations/UpdateOrderStatus.php`

```php
<?php

namespace App\GraphQL\Mutations;

use App\Models\Order;
use App\Models\OrderStatus;
use Illuminate\Support\Facades\Log;

class UpdateOrderStatus
{
    public function __invoke($rootValue, array $args)
    {
        $orderId = $args['order_id'];
        $statusSlug = $args['status_slug'];

        // Найти заказ
        $order = Order::findOrFail($orderId);

        // Найти статус по slug
        $status = OrderStatus::where('slug', $statusSlug)
            ->where('is_active', true)
            ->firstOrFail();

        // Обновить статус заказа
        $order->status_id = $status->id;
        $order->save();

        // Логирование изменения
        Log::info('Order status updated', [
            'order_id' => $orderId,
            'old_status_id' => $order->getOriginal('status_id'),
            'new_status_id' => $status->id,
            'status_slug' => $statusSlug
        ]);

        // Вернуть обновленный заказ со статусом
        return $order->load('status');
    }
}
```

### 7. Модель OrderStatus

**Файл:** `b5-api-2/app/Models/OrderStatus.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderStatus extends Model
{
    protected $table = 'order_statuses';

    protected $fillable = [
        'slug',
        'value',
        'color',
        'sort_order',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer'
    ];

    /**
     * Get orders with this status
     */
    public function orders()
    {
        return $this->hasMany(Order::class, 'status_id');
    }
}
```

### 8. Обновление модели Order

**Файл:** `b5-api-2/app/Models/Order.php`

Добавить в модель:

```php
/**
 * Get the status of the order
 */
public function status()
{
    return $this->belongsTo(OrderStatus::class, 'status_id');
}
```

Добавить в `$fillable`:
```php
protected $fillable = [
    // ... существующие поля
    'status_id',
];
```

Добавить в `$casts`:
```php
protected $casts = [
    // ... существующие поля
    'status_id' => 'integer',
];
```

## Тестирование

### 1. Проверка получения статусов

```graphql
query {
  orderStatuses {
    id
    slug
    value
    color
    sort_order
  }
}
```

**Ожидаемый результат:**
```json
{
  "data": {
    "orderStatuses": [
      {
        "id": "1",
        "slug": "new",
        "value": "Новый",
        "color": "#3B82F6",
        "sort_order": 1
      },
      // ... другие статусы
    ]
  }
}
```

### 2. Проверка обновления статуса

```graphql
mutation {
  updateOrderStatus(order_id: "1", status_slug: "in_progress") {
    id
    status_id
    status {
      id
      slug
      value
      color
    }
  }
}
```

**Ожидаемый результат:**
```json
{
  "data": {
    "updateOrderStatus": {
      "id": "1",
      "status_id": "2",
      "status": {
        "id": "2",
        "slug": "in_progress",
        "value": "В работе",
        "color": "#F59E0B"
      }
    }
  }
}
```

## Права доступа

Убедитесь, что:
- Query `orderStatuses` доступен всем авторизованным пользователям
- Mutation `updateOrderStatus` доступен пользователям с правами на редактирование заказов
- Используйте `@guard` директиву для защиты endpoints

## Примечания

- Поле `status_id` в таблице `orders` должно быть nullable
- При удалении статуса связанные заказы должны получить NULL в `status_id` (ON DELETE SET NULL)
- Статусы должны быть отсортированы по `sort_order` при возврате из API
- Цвета должны быть в формате HEX (#RRGGBB)
