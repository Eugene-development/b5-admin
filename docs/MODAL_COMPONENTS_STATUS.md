# Статус модальных компонентов в b5-admin

## Обзор

Все основные разделы приложения используют современные модальные окна для просмотра, редактирования и добавления данных.

## Контрагенты (Counterparties)

### Службы доставки (Delivery)
- ✅ Просмотр: `CompanyViewModal`
- ✅ Редактирование: `CompanyEditModal`
- ✅ Добавление: `CompanyAddModal` (slug: "delivery")

### Подрядчики (Contractors)
- ✅ Просмотр: `CompanyViewModal`
- ✅ Редактирование: `CompanyEditModal`
- ✅ Добавление: `CompanyAddModal` (slug: "contractors")

### Сервисы (Services)
- ✅ Просмотр: `CompanyViewModal`
- ✅ Редактирование: `CompanyEditModal`
- ✅ Добавление: `CompanyAddModal` (slug: "services")

### Поставщики (Suppliers)
- ✅ Просмотр: `CompanyViewModal`
- ✅ Редактирование: `CompanyEditModal`
- ✅ Добавление: `CompanyAddModal` (slug: "suppliers")

## Управление (Management)

### Агенты (Agents)
- ✅ Просмотр: `UserViewModal`
- ✅ Редактирование: `UserEditModal`
- ✅ Добавление: `UserAddModal` (statusSlug: "agent")

### Клиенты (Clients)
- ✅ Просмотр: `UserViewModal`
- ✅ Редактирование: `EditClientModal`
- ⚠️ Добавление: Не реализовано (клиенты создаются через другой процесс)

### Пользователи (Users)
- ✅ Просмотр: `UserViewModal`
- ✅ Редактирование: `UserEditModal`
- ✅ Добавление: `UserAddModal`

## Бизнес-процессы (Business Processes)

### Проекты (Projects)
- ✅ Просмотр: `ProjectViewModal`
- ✅ Редактирование: `ProjectEditModal`
- ✅ Добавление: Реализовано через другой процесс

### Контракты (Contracts)
- ✅ Просмотр: `ContractViewModal`
- ✅ Редактирование: `ContractEditModal`
- ✅ Добавление: `ContractAddModal`

### Жалобы (Complaints)
- ✅ Просмотр: Реализовано
- ✅ Редактирование: Реализовано
- ⚠️ Добавление: Требует проверки

### Действия (Actions)
- ⚠️ Требует проверки

### Заказы (Order)
- ⚠️ Требует проверки

### ТЗ (TZ)
- ⚠️ Требует проверки

## Общие компоненты модальных окон

### Базовые компоненты
- `ConfirmationModal` - модальное окно подтверждения действий
- `FileUploadModal` - модальное окно загрузки файлов

### Компоненты для компаний
Расположение: `b5-admin/src/lib/components/counterparties/companies/`
- `CompanyViewModal.svelte` - просмотр компании
- `CompanyEditModal.svelte` - редактирование компании
- `CompanyAddModal.svelte` - добавление компании

### Компоненты для пользователей
Расположение: `b5-admin/src/lib/components/management/users/`
- `UserViewModal.svelte` - просмотр пользователя
- `UserEditModal.svelte` - редактирование пользователя
- `UserAddModal.svelte` - добавление пользователя

### Компоненты для клиентов
Расположение: `b5-admin/src/lib/components/management/clients/`
- `EditClientModal.svelte` - редактирование клиента

### Компоненты для проектов
Расположение: `b5-admin/src/lib/components/business-processes/projects/`
- `ProjectViewModal.svelte` - просмотр проекта
- `ProjectEditModal.svelte` - редактирование проекта

## Стиль модальных окон

Все современные модальные окна следуют единому дизайну:
- Темный фон с overlay
- Центрированное модальное окно
- Анимация появления/исчезновения
- Адаптивный дизайн для мобильных устройств
- Доступность (ARIA-атрибуты, фокус-менеджмент)
- Закрытие по ESC и клику вне модального окна

## Следующие шаги

Для завершения миграции на современные модальные окна необходимо:
1. Проверить разделы бизнес-процессов (Actions, Contracts, Order, TZ)
2. Создать недостающие модальные компоненты при необходимости
3. Обновить старые inline-формы на модальные окна

---

Дата создания: 29 декабря 2025
