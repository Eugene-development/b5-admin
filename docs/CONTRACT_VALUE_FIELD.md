# Contract Value Field Feature

## Описание изменений

Добавлено новое поле `value` в таблицу `contracts` для хранения номера договора от фабрики.

### Логика работы:

1. **`contract_number`** — номер договора, присваиваемый нашей системой автоматически (формат: `DOC-XXXX-0000`). Это поле НЕ редактируется пользователем.

2. **`value`** — номер договора от фабрики (опциональный). Пользователь вводит этот номер вручную через форму.

## Изменения в Backend (b5-api-2)

### База данных
- Добавлена миграция `2026_01_17_170000_add_value_to_contracts_table.php` в `b5-db-2`
- Добавлено поле `value` (nullable, varchar 255)

### Модель Contract
- Поле `value` добавлено в `$fillable`

### GraphQL Schema (`graphql/contract.graphql`)
- Тип `Contract` теперь содержит поле `value`
- `CreateContractInput` содержит поле `value` (не `contract_number`)
- `UpdateContractInput` содержит поле `value` (не `contract_number`)

### Мутации
- `CreateContract.php` — при создании договора `value` берётся из формы, `contract_number` генерируется автоматически
- `UpdateContract.php` — при обновлении работаем с `value`, `contract_number` НЕ обновляется

## Изменения в Frontend (b5-admin)

### API (`src/lib/api/contracts.js`)
- Добавлено поле `value` во все GraphQL запросы

### ContractAddModal.svelte
- Поле переименовано: "Номер договора" → "Номер договора от фабрики"
- Данные записываются в поле `value`

### ContractEditModal.svelte
- Поле переименовано: "Номер договора" → "Номер договора от фабрики"
- Данные берутся из `contract.value` и записываются обратно в `value`

### ContractViewModal.svelte
- В заголовке модального окна отображается `contract_number` (системный номер)
- В разделе "Проект и компания" добавлено отображение "Номер договора от фабрики" (`value`), если он указан

### ContractsTable.svelte
- Без изменений — отображается `contract_number` (системный номер)

## Дата: 2026-01-17
