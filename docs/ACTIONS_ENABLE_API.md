# Инструкция по подключению реального API для акций

## Текущее состояние

Сейчас страница `/actions` работает с **моковыми данными** (тестовыми данными), так как бэкенд API еще не реализован.

При попытке использовать API возникает ошибка:
```
Cannot query field "actions" on type "Query"
```

Это означает, что GraphQL схема на бэкенде не содержит необходимые типы и операции.

## Шаги для подключения реального API

### 1. Реализуйте бэкенд API

Следуйте инструкциям в файле `ACTIONS_API_BACKEND.md`:

1. Запустите миграцию (уже создана):
   ```bash
   cd b5-db-2
   php artisan migrate
   ```

2. Создайте модель `Action` (см. `ACTIONS_API_BACKEND.md`)

3. Добавьте GraphQL схему в `graphql/schema.graphql`:
   ```graphql
   extend type Query {
       actions(first: Int = 10, page: Int): ActionConnection! @paginate
       action(id: ID! @eq): Action @find
   }

   extend type Mutation {
       createAction(input: CreateActionInput! @spread): Action! @create
       updateAction(input: UpdateActionInput! @spread): Action! @update
       deleteAction(id: ID!): Action! @delete
   }

   type Action {
       id: ID!
       name: String!
       description: String!
       start: Date!
       end: Date!
       company_id: ID!
       is_active: Boolean!
       created_at: DateTime!
       updated_at: DateTime!
       company: Company @belongsTo
   }

   type ActionConnection {
       data: [Action!]!
       paginatorInfo: PaginatorInfo!
   }

   input CreateActionInput {
       name: String! @rules(apply: ["required", "string", "max:255"])
       description: String! @rules(apply: ["required", "string"])
       start: Date! @rules(apply: ["required", "date"])
       end: Date! @rules(apply: ["required", "date", "after:start"])
       company_id: ID! @rules(apply: ["required", "exists:companies,id"])
       is_active: Boolean! @rules(apply: ["required", "boolean"])
   }

   input UpdateActionInput {
       id: ID! @rules(apply: ["required", "exists:actions,id"])
       name: String @rules(apply: ["string", "max:255"])
       description: String @rules(apply: ["string"])
       start: Date @rules(apply: ["date"])
       end: Date @rules(apply: ["date", "after:start"])
       company_id: ID @rules(apply: ["exists:companies,id"])
       is_active: Boolean @rules(apply: ["boolean"])
   }
   ```

4. Очистите кэш GraphQL:
   ```bash
   php artisan lighthouse:clear-cache
   ```

5. Проверьте схему в GraphQL Playground:
   ```
   http://localhost:8000/graphql-playground
   ```

### 2. Протестируйте API

Выполните тестовый запрос в GraphQL Playground:

```graphql
query {
  actions(first: 10) {
    data {
      id
      name
      description
      start
      end
      is_active
      company {
        id
        name
      }
    }
  }
}
```

Если запрос работает без ошибок, API готов!

### 3. Включите API во фронтенде

#### Файл: `b5-admin/src/routes/(protected)/actions/+page.js`

Раскомментируйте импорт и код:

```javascript
// Было:
// import { refreshActions, getCompaniesForActions } from '$lib/api/actions.js';

// Станет:
import { refreshActions, getCompaniesForActions } from '$lib/api/actions.js';

// Было:
// export async function load() {
//   return {
//     actions: mockActions,
//     companies: mockCompanies
//   };
// }

// Станет:
export async function load() {
  try {
    const [actions, companies] = await Promise.all([
      refreshActions(),
      getCompaniesForActions()
    ]);
    return { actions, companies };
  } catch (error) {
    console.error('Failed to load actions page data:', error);
    return {
      actions: mockActions,
      companies: mockCompanies,
      error: { message: 'Не удалось загрузить данные. Показаны тестовые данные.' }
    };
  }
}
```

#### Файл: `b5-admin/src/routes/(protected)/actions/+page.svelte`

1. Раскомментируйте импорт:
```javascript
// Было:
// import { createAction, refreshActions } from '$lib/api/actions.js';

// Станет:
import { createAction, refreshActions } from '$lib/api/actions.js';
```

2. В функции `handleSaveNewAction` замените моковую реализацию:
```javascript
// Удалите весь блок с "Temporary mock implementation"
// И раскомментируйте:
await retryOperation(
  async () => {
    const newAction = await createAction(actionData);
    await invalidateAll();
    addSuccessToast(`Акция "${actionData.name}" успешно добавлена.`);
  },
  2,
  1000
);
```

3. В функции `refreshData` раскомментируйте:
```javascript
// Было:
// const refreshedActions = await refreshActions();
// actions = refreshedActions;
// allActions = refreshedActions;

// Станет:
const refreshedActions = await refreshActions();
actions = refreshedActions;
allActions = refreshedActions;
```

### 4. Проверьте работу

1. Перезапустите dev-сервер фронтенда:
   ```bash
   cd b5-admin
   npm run dev
   ```

2. Откройте страницу `/actions`

3. Попробуйте добавить новую акцию через кнопку "Добавить акцию"

4. Проверьте, что данные сохраняются и отображаются корректно

## Быстрая проверка готовности API

Выполните в терминале:

```bash
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ actions(first: 1) { data { id name } } }"}'
```

Если получите JSON с данными (или пустой массив) - API работает!

Если получите ошибку `Cannot query field "actions"` - нужно реализовать бэкенд.

## Откат к моковым данным

Если нужно вернуться к моковым данным, просто закомментируйте обратно все раскомментированные строки.

## Поддержка

Все файлы с пометкой `TODO: Uncomment when backend API is ready` содержат закомментированный код для работы с реальным API.
