# Исправление ошибки "Cannot read properties of undefined (reading 'id')" в контрактах

## Проблема

При переходе на страницу контрактов возникала ошибка:

```
Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'id')
```

## Причина

Ошибка возникала из-за нескольких проблем:

1. **Несоответствие полей в GraphQL запросах**:
   - **Основной запрос** `CONTRACTS_QUERY` возвращал полную информацию о проекте и компании
   - **Мутации** `CREATE_CONTRACT_MUTATION` и `UPDATE_CONTRACT_MUTATION` возвращали только базовые поля
   - При создании или обновлении контракта, новый объект добавлялся в локальное состояние с неполными данными

2. **Неправильное использование компонента ActionButtons**:
   - Компонент `ActionButtons` был разработан для агентов и пользователей
   - Он ожидал пропс `agent` или `user` с полем `id`
   - В `ContractsTable` компонент использовался без передачи этих пропсов
   - На строке 51 в `ActionButtons.svelte` происходило обращение к `entity.id`, где `entity` был `undefined`

## Решение

### 1. Обновлены GraphQL мутации

Добавлены недостающие поля в `CREATE_CONTRACT_MUTATION` и `UPDATE_CONTRACT_MUTATION`:

```graphql
project {
  id
  value
  region
  description
}
company {
  id
  name
  legal_name
  inn
  region
}
```

### 2. Добавлена защита от undefined в ключах итерации

В `ContractsTable.svelte` обновлены ключи для `#each`:

```svelte
{#each contracts as contract, index (contract?.id || index + '-' + updateCounter)}
```

### 3. Добавлена валидация данных в API функциях

Все функции API теперь фильтруют невалидные контракты:

```javascript
// В getContracts и refreshContracts
return contracts.filter((contract) => contract && contract.id);

// В createContract и updateContract
if (!contract || !contract.id) {
	throw new Error('Invalid contract data returned from server');
}
```

### 4. Добавлена фильтрация в компонентах

- В `+page.svelte` функция `filteredContracts` фильтрует `null`/`undefined` контракты
- В `getProcessedContracts` добавлена проверка на валидность контрактов
- В `removeContractFromList` и `updateContractInList` добавлены проверки на существование контракта

### 5. Создан специализированный компонент ContractActionButtons

Вместо использования универсального `ActionButtons`, создан специальный компонент `ContractActionButtons`:

```svelte
<ContractActionButtons
	onView={() => onViewContract(contract)}
	onEdit={() => onEditContract(contract)}
	onDelete={() => onDeleteContract(contract)}
	{isLoading}
/>
```

Этот компонент:

- Не требует передачи `agent` или `user` пропсов
- Работает только с callback функциями
- Специально разработан для управления контрактами

## Файлы изменены

- `b5-admin/src/lib/api/contracts.js` - обновлены GraphQL мутации и добавлена валидация
- `b5-admin/src/lib/components/ContractsTable.svelte` - заменён ActionButtons на ContractActionButtons
- `b5-admin/src/lib/components/ContractActionButtons.svelte` - создан новый компонент (НОВЫЙ)
- `b5-admin/src/lib/index.js` - добавлен экспорт ContractActionButtons
- `b5-admin/src/routes/(protected)/contracts/+page.svelte` - добавлена фильтрация невалидных данных

## Дата исправления

13 ноября 2025
