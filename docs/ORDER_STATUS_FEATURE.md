# Функция статусов заказов

## Описание

Добавлена возможность управления статусами заказов в таблице закупок, аналогично функционалу статусов договоров.

## Дата реализации

15 декабря 2024

## Реализованные компоненты

### 1. Frontend компоненты

#### OrderStatusBadge.svelte
**Путь:** `b5-admin/src/lib/components/business-processes/order/OrderStatusBadge.svelte`

Интерактивный компонент для отображения и изменения статуса заказа:
- Отображает текущий статус с цветовой индикацией
- Выпадающий список для выбора нового статуса
- Индикатор загрузки при обновлении
- Поддержка режима только для чтения

**Props:**
- `order` - объект заказа
- `orderStatuses` - массив доступных статусов
- `onStatusChange` - callback при изменении статуса
- `readonly` - режим только для чтения (по умолчанию false)

### 2. API функции

**Файл:** `b5-admin/src/lib/api/orders.js`

#### getOrderStatuses()
Получает список всех доступных статусов заказов из API.

**Возвращает:**
```javascript
[
  {
    id: number,
    slug: string,
    value: string,
    color: string,
    sort_order: number
  }
]
```

#### updateOrderStatus(orderId, statusSlug)
Обновляет статус заказа.

**Параметры:**
- `orderId` - ID заказа
- `statusSlug` - slug нового статуса

**Возвращает:**
```javascript
{
  id: number,
  status_id: number,
  status: {
    id: number,
    slug: string,
    value: string,
    color: string,
    sort_order: number
  }
}
```

### 3. Обновления в таблице заказов

**Файл:** `b5-admin/src/lib/components/business-processes/order/OrderTable.svelte`

Добавлен новый столбец "СТАТУС":
- Десктопная версия: отдельный столбец между "СРОЧНОСТЬ / СТАТУС" и "ДЕЙСТВИЯ"
- Мобильная версия: отдельное поле в карточке заказа

**Новые props:**
- `orderStatuses` - массив доступных статусов
- `onOrderStatusChange` - callback для обработки изменения статуса

### 4. Обновления страницы заказов

**Файл:** `b5-admin/src/routes/(protected)/(business-processes)/order/+page.svelte`

Добавлена логика управления статусами:
- Загрузка списка статусов при инициализации
- Обработчик `handleOrderStatusChange` для обновления локального состояния
- Передача статусов и обработчика в компонент таблицы

## GraphQL запросы

### Получение статусов заказов
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

### Обновление статуса заказа
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
      sort_order
    }
  }
}
```

### Получение заказов (обновлено)
Добавлены поля `status_id` и `status` в запрос получения заказов:
```graphql
query GetOrders($first: Int!, $page: Int!) {
  orders(first: $first, page: $page) {
    data {
      id
      # ... другие поля
      status_id
      status {
        id
        slug
        value
        color
        sort_order
      }
    }
  }
}
```

## Использование

### Изменение статуса заказа

1. В таблице заказов найдите нужный заказ
2. В столбце "СТАТУС" кликните на текущий статус
3. Выберите новый статус из выпадающего списка
4. Статус обновится автоматически с отображением уведомления

### Цветовая индикация

Каждый статус имеет свой цвет, который определяется в базе данных:
- Цвет отображается как фон бейджа (с прозрачностью 20%)
- Текст статуса окрашен в основной цвет

## Backend требования

Для работы функции необходимо наличие в API:

1. **Таблица `order_statuses`** с полями:
   - `id` - уникальный идентификатор
   - `slug` - уникальный код статуса
   - `value` - отображаемое название
   - `color` - HEX цвет для визуализации
   - `sort_order` - порядок сортировки

2. **Поле `status_id`** в таблице `orders`:
   - Внешний ключ на `order_statuses.id`
   - Nullable (может быть NULL)

3. **GraphQL мутация `updateOrderStatus`**:
   - Принимает `order_id` и `status_slug`
   - Обновляет `status_id` в таблице orders
   - Возвращает обновленный заказ со статусом

4. **GraphQL query `orderStatuses`**:
   - Возвращает список всех активных статусов
   - Отсортированных по `sort_order`

## Связанные файлы

- `b5-admin/src/lib/components/business-processes/order/OrderStatusBadge.svelte` - компонент статуса
- `b5-admin/src/lib/components/business-processes/order/OrderTable.svelte` - таблица заказов
- `b5-admin/src/routes/(protected)/(business-processes)/order/+page.svelte` - страница заказов
- `b5-admin/src/lib/api/orders.js` - API функции для работы с заказами

## Примечания

- Функция реализована по аналогии с системой статусов договоров
- Статусы загружаются один раз при инициализации страницы
- Изменение статуса происходит без перезагрузки страницы
- При ошибке обновления отображается уведомление с описанием проблемы
- Компонент поддерживает темную тему
