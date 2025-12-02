# Применение миграций для поля "Компания"

## Шаги для применения изменений

### 1. Применить миграции базы данных

```bash
cd b5-db-2
php artisan migrate
```

Это применит следующие миграции:
- `2025_11_30_120000_add_company_id_to_users_table.php` - добавит поле `company_id` в таблицу `users`
- `2025_11_30_120001_make_inn_nullable_in_companies_table.php` - сделает поле `inn` nullable
- `2025_11_30_120002_make_legal_name_nullable_in_companies_table.php` - сделает поле `legal_name` nullable

### 2. Обновить сидеры (если база пустая)

Если вы работаете с пустой базой данных, выполните:

```bash
cd b5-db-2
php artisan db:seed --class=CompanyStatusSeeder
php artisan db:seed --class=UserStatusSeeder
```

### 3. Очистить кэш GraphQL (b5-api-2)

```bash
cd b5-api-2
php artisan lighthouse:clear-cache
php artisan cache:clear
```

### 4. Перезапустить сервисы

Перезапустите все сервисы для применения изменений:

```bash
# Перезапустить b5-api-2
# Перезапустить b5-auth-2
# Перезапустить b5-admin
```

## Проверка

После применения миграций проверьте:

1. Форма регистрации работает корректно
2. Создаётся компания при регистрации
3. Пользователь связывается с компанией
4. Страницы контрагентов загружаются без ошибок

## Откат изменений (если нужно)

Если нужно откатить миграции:

```bash
cd b5-db-2
php artisan migrate:rollback --step=3
```

Это откатит последние 3 миграции.
