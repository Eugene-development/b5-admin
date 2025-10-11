# Backend API для акций

## Требования к GraphQL API

Для работы функционала добавления акций необходимо реализовать следующие GraphQL типы и операции на бэкенде.

## GraphQL Schema

### Types

```graphql
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
  company: Company
}

type ActionConnection {
  data: [Action!]!
  paginatorInfo: PaginatorInfo
}

type Company {
  id: ID!
  name: String!
  legal_name: String!
  region: String
  is_active: Boolean!
  bun: Boolean!
}
```

### Input Types

```graphql
input CreateActionInput {
  name: String!
  description: String!
  start: Date!
  end: Date!
  company_id: ID!
  is_active: Boolean!
}

input UpdateActionInput {
  id: ID!
  name: String
  description: String
  start: Date
  end: Date
  company_id: ID
  is_active: Boolean
}
```

### Mutations

```graphql
type Mutation {
  createAction(input: CreateActionInput!): Action!
  updateAction(input: UpdateActionInput!): Action!
  deleteAction(id: ID!): Action!
}
```

### Queries

```graphql
type Query {
  actions(first: Int = 10, page: Int): ActionConnection!
  action(id: ID!): Action
}
```

## Laravel Implementation Example

### Migration
Миграция уже создана: `b5-db-2/database/migrations/2025_11_10_120000_create_actions_table.php`

### Model (app/Models/Action.php)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;

class Action extends Model
{
    use HasUlids;

    protected $fillable = [
        'name',
        'description',
        'start',
        'end',
        'company_id',
        'is_active',
    ];

    protected $casts = [
        'start' => 'date',
        'end' => 'date',
        'is_active' => 'boolean',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
```

### GraphQL Schema (graphql/schema.graphql)

```graphql
extend type Query {
    actions(first: Int = 10, page: Int): ActionConnection! 
        @paginate(defaultCount: 10)
    action(id: ID! @eq): Action @find
}

extend type Mutation {
    createAction(input: CreateActionInput! @spread): Action! 
        @create
    updateAction(input: UpdateActionInput! @spread): Action! 
        @update
    deleteAction(id: ID!): Action! 
        @delete
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

## Валидация

### Правила валидации:
- `name` - обязательное, строка, максимум 255 символов
- `description` - обязательное, текст
- `start` - обязательное, дата
- `end` - обязательное, дата, должна быть позже `start`
- `company_id` - обязательное, должна существовать в таблице companies
- `is_active` - обязательное, boolean

### Пример кастомной валидации (если нужно):

```php
<?php

namespace App\GraphQL\Validators;

use Nuwave\Lighthouse\Validation\Validator;

class CreateActionInputValidator extends Validator
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'start' => ['required', 'date'],
            'end' => ['required', 'date', 'after:start'],
            'company_id' => ['required', 'exists:companies,id'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'end.after' => 'Дата окончания должна быть позже даты начала',
            'company_id.exists' => 'Выбранная компания не существует',
        ];
    }
}
```

## Тестирование

### Пример запроса создания акции:

```graphql
mutation {
  createAction(input: {
    name: "Скидка 20%"
    description: "Специальная акция для постоянных клиентов"
    start: "2025-02-01"
    end: "2025-02-28"
    company_id: "01HQZX1234567890ABCDEFGHIJ"
    is_active: false
  }) {
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
```

### Пример запроса получения акций:

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
        region
      }
    }
  }
}
```

## CORS настройки

Убедитесь, что в `config/cors.php` разрешены запросы с фронтенда:

```php
'paths' => ['api/*', 'graphql', 'sanctum/csrf-cookie'],
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
'supports_credentials' => true,
```
