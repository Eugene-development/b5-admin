# Архитектура системы статусов заказов

## Схема компонентов

```
┌─────────────────────────────────────────────────────────────┐
│                    Order Page (+page.svelte)                 │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ State Management                                      │   │
│  │ • orders: Order[]                                     │   │
│  │ • orderStatuses: OrderStatus[]                        │   │
│  │ • partnerPaymentStatuses: PaymentStatus[]             │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
│                           ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Event Handlers                                        │   │
│  │ • handleOrderStatusChange(orderId, result)            │   │
│  │ • refreshData() - loads statuses                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
│                           ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              OrderTable Component                     │   │
│  │                                                        │   │
│  │  Props:                                                │   │
│  │  • orders                                              │   │
│  │  • orderStatuses                                       │   │
│  │  • onOrderStatusChange                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
│                           ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          OrderStatusBadge Component                   │   │
│  │                                                        │   │
│  │  • Displays current status with color                 │   │
│  │  • Dropdown menu for status selection                 │   │
│  │  • Loading indicator                                   │   │
│  │  • Calls updateOrderStatus API                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (orders.js)                   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ getOrderStatuses()                                    │   │
│  │ • Fetches all available order statuses                │   │
│  │ • Returns: OrderStatus[]                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ updateOrderStatus(orderId, statusSlug)                │   │
│  │ • Updates order status                                 │   │
│  │ • Returns: { id, status_id, status }                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ getOrders()                                            │   │
│  │ • Fetches orders with status field                     │   │
│  │ • Returns: Order[] (with status)                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    GraphQL API (Backend)                     │
│                                                               │
│  Query: orderStatuses                                         │
│  • Returns list of all active statuses                        │
│                                                               │
│  Mutation: updateOrderStatus                                  │
│  • Updates order.status_id                                    │
│  • Returns updated order with status                          │
│                                                               │
│  Query: orders                                                │
│  • Includes status_id and status fields                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database (MySQL)                         │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ order_statuses                                        │   │
│  │ • id (PK)                                              │   │
│  │ • slug (UNIQUE)                                        │   │
│  │ • value                                                │   │
│  │ • color                                                │   │
│  │ • sort_order                                           │   │
│  │ • is_active                                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
│                           │ FK: status_id                     │
│                           ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ orders                                                │   │
│  │ • id (PK)                                              │   │
│  │ • status_id (FK, nullable)                             │   │
│  │ • ... other fields                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Поток данных при изменении статуса

```
User clicks on status badge
         │
         ▼
OrderStatusBadge shows dropdown
         │
         ▼
User selects new status
         │
         ▼
OrderStatusBadge.handleStatusChange()
         │
         ├─► Shows loading indicator
         │
         ▼
API: updateOrderStatus(orderId, statusSlug)
         │
         ▼
GraphQL Mutation: updateOrderStatus
         │
         ▼
Backend updates orders.status_id
         │
         ▼
Returns updated order with status
         │
         ▼
OrderStatusBadge receives result
         │
         ├─► Hides loading indicator
         ├─► Shows success toast
         │
         ▼
Calls onStatusChange callback
         │
         ▼
OrderTable passes to parent
         │
         ▼
Order Page: handleOrderStatusChange()
         │
         ├─► Updates local orders state
         ├─► Increments updateCounter
         │
         ▼
UI re-renders with new status
```

## Структура данных

### OrderStatus
```typescript
interface OrderStatus {
  id: number;
  slug: string;        // Уникальный код: 'new', 'in_progress', etc.
  value: string;       // Отображаемое название: 'Новый', 'В работе'
  color: string;       // HEX цвет: '#3B82F6'
  sort_order: number;  // Порядок сортировки
  is_active: boolean;  // Активен ли статус
}
```

### Order (с добавленными полями)
```typescript
interface Order {
  id: number;
  // ... existing fields
  status_id: number | null;
  status: OrderStatus | null;
}
```

## Компоненты и их ответственность

### 1. OrderStatusBadge
**Ответственность:**
- Отображение текущего статуса
- Управление dropdown меню
- Вызов API для обновления статуса
- Отображение состояния загрузки
- Уведомление родителя об изменениях

**Props:**
- `order` - объект заказа
- `orderStatuses` - список доступных статусов
- `onStatusChange` - callback при изменении
- `readonly` - режим только для чтения

### 2. OrderTable
**Ответственность:**
- Отображение таблицы заказов
- Рендеринг OrderStatusBadge для каждого заказа
- Передача событий изменения статуса родителю

**Props:**
- `orders` - список заказов
- `orderStatuses` - список статусов
- `onOrderStatusChange` - обработчик изменения статуса

### 3. Order Page
**Ответственность:**
- Загрузка списка статусов
- Управление состоянием заказов
- Обработка изменений статусов
- Обновление локального состояния

## API Endpoints

### GET /graphql - orderStatuses
**Request:**
```graphql
query GetOrderStatuses {
  orderStatuses {
    id
    slug
    value
    color
    sort_order
  }
}
```

**Response:**
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
      }
    ]
  }
}
```

### POST /graphql - updateOrderStatus
**Request:**
```graphql
mutation UpdateOrderStatus($orderId: ID!, $statusSlug: String!) {
  updateOrderStatus(order_id: $orderId, status_slug: $statusSlug) {
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

**Response:**
```json
{
  "data": {
    "updateOrderStatus": {
      "id": "123",
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

## Обработка ошибок

```
API Error
    │
    ▼
handleApiError() in toastStore
    │
    ├─► Logs error to console
    ├─► Shows error toast notification
    │
    ▼
OrderStatusBadge
    │
    ├─► Hides loading indicator
    ├─► Closes dropdown
    ├─► Keeps old status (no change)
    │
    ▼
User sees error message
```

## Состояния компонента OrderStatusBadge

```
┌─────────────┐
│   Initial   │ - Показывает текущий статус
└──────┬──────┘
       │ User clicks
       ▼
┌─────────────┐
│   Dropdown  │ - Показывает список статусов
│    Open     │
└──────┬──────┘
       │ User selects status
       ▼
┌─────────────┐
│   Loading   │ - Показывает индикатор загрузки
└──────┬──────┘
       │ API responds
       ▼
┌─────────────┐
│   Success   │ - Обновляет статус, показывает toast
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Initial   │ - Возвращается к начальному состоянию
└─────────────┘

       OR (if error)
       │
       ▼
┌─────────────┐
│    Error    │ - Показывает ошибку, сохраняет старый статус
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Initial   │ - Возвращается к начальному состоянию
└─────────────┘
```

## Производительность

### Оптимизации
1. **Загрузка статусов:** Один раз при инициализации страницы
2. **Локальное обновление:** Состояние обновляется локально после успешного API вызова
3. **Минимальные перерисовки:** Используется `updateCounter` для контроля ре-рендеринга
4. **Закрытие dropdown:** Автоматически при клике вне компонента

### Метрики
- Время загрузки статусов: ~100-200ms
- Время обновления статуса: ~200-500ms
- Размер компонента: ~4KB (минифицированный)

## Безопасность

1. **Авторизация:** Все API запросы требуют аутентификации (`@guard`)
2. **Валидация:** Backend проверяет существование заказа и статуса
3. **Права доступа:** Проверка прав на изменение заказов
4. **XSS защита:** Все данные экранируются при отображении
