# Функционал добавления акций

## Описание
Реализован функционал добавления акций от поставщиков на странице `/actions` через модальное окно.

## Реализованные компоненты

### 1. ActionAddModal.svelte
Модальное окно для добавления новой акции с полями:
- **Название акции** (обязательное) - текстовое поле
- **Описание акции** (обязательное) - многострочное текстовое поле
- **Компания-поставщик** (обязательное) - выпадающий список компаний
- **Дата начала** (обязательное) - поле выбора даты
- **Дата окончания** (обязательное) - поле выбора даты
- **Акция активна** - чекбокс (по умолчанию выключен, is_active = false)

### 2. Валидация формы
- Проверка обязательных полей
- Валидация дат (дата окончания должна быть позже даты начала)
- Отображение ошибок валидации под соответствующими полями
- Блокировка кнопки сохранения при невалидной форме

### 3. Интеграция со страницей actions
Обновлена страница `/actions`:
- Добавлена кнопка "Добавить акцию"
- Интегрировано модальное окно ActionAddModal
- Реализованы обработчики открытия/закрытия модального окна
- Добавлена логика сохранения новой акции (с заглушкой для API)
- Добавлена загрузка списка компаний для выбора

## Структура данных

Согласно миграции `create_actions_table`:
```javascript
{
  id: string,              // ULID
  name: string,            // Название акции
  description: string,     // Описание акции
  start: date,             // Дата начала
  end: date,               // Дата окончания
  company_id: string,      // ULID компании
  is_active: boolean,      // Активность акции
  created_at: timestamp,
  updated_at: timestamp
}
```

## Стилизация
Форма стилизована в соответствии с формой добавления компаний на странице `/suppliers`:
- Темная тема
- Адаптивный дизайн
- Доступность (ARIA-атрибуты)
- Управление фокусом
- Обработка клавиатуры (Escape, Tab)

## Файлы

### Созданные файлы:
- `b5-admin/src/lib/components/ActionAddModal.svelte` - компонент модального окна
- `b5-admin/src/lib/api/actions.js` - API функции для работы с акциями

### Измененные файлы:
- `b5-admin/src/routes/(protected)/actions/+page.svelte` - добавлен функционал с реальным API
- `b5-admin/src/routes/(protected)/actions/+page.js` - загрузка данных через API
- `b5-admin/src/lib/index.js` - экспорт нового компонента и API функций

## API Integration

### Реализованные функции (b5-admin/src/lib/api/actions.js):
- `createAction(actionData)` - создание новой акции
- `updateAction(actionData)` - обновление акции
- `deleteAction(actionId)` - удаление акции
- `refreshActions()` - получение списка всех акций
- `getCompaniesForActions()` - получение списка активных компаний для выбора

### GraphQL Mutations/Queries:
```graphql
# Создание акции
mutation CreateAction($input: CreateActionInput!) {
  createAction(input: $input) {
    id
    name
    description
    start
    end
    company_id
    is_active
    created_at
    updated_at
  }
}

# Получение акций
query GetActions {
  actions(first: 1000) {
    data {
      id
      name
      description
      start
      end
      company_id
      is_active
      created_at
      updated_at
      company {
        id
        name
        legal_name
        region
      }
    }
  }
}
```

## TODO
- [ ] Добавить функционал редактирования акций
- [ ] Добавить функционал удаления акций
- [ ] Добавить фильтрацию по статусу (активные/неактивные)
- [ ] Добавить фильтрацию по датам

## Использование

```svelte
<script>
  import ActionAddModal from '$lib/components/ActionAddModal.svelte';
  
  let showModal = false;
  let companies = []; // Список компаний
  
  function handleSave(actionData) {
    // Логика сохранения
    console.log('New action:', actionData);
  }
  
  function handleCancel() {
    showModal = false;
  }
</script>

<ActionAddModal
  isOpen={showModal}
  onSave={handleSave}
  onCancel={handleCancel}
  isLoading={false}
  {companies}
/>
```
