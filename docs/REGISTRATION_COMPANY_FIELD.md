# Изменение формы регистрации: Поле "Компания"

## Обзор изменений

Поле "Регион" в форме регистрации заменено на обязательное поле "Компания". При регистрации автоматически создаётся компания и связывается с пользователем.

## Изменённые файлы

### Frontend (b5-admin)
- `src/routes/(auth)/register/+page.svelte` - форма регистрации

### Backend (b5-auth-2)
- `app/Http/Controllers/AuthController.php` - метод register()
- `app/Models/Company.php` - новая модель
- `app/Models/CompanyStatus.php` - новая модель
- `app/Models/User.php` - добавлена связь с Company

### Database (b5-db-2)
- `database/seeders/UserStatusSeeder.php` - обновлены slug'и статусов
- `database/migrations/2025_11_30_120000_add_company_id_to_users_table.php`
- `database/migrations/2025_11_30_120001_make_inn_nullable_in_companies_table.php`
- `database/migrations/2025_11_30_120002_make_legal_name_nullable_in_companies_table.php`

## Логика регистрации

1. Пользователь заполняет форму с обязательным полем "Компания"
2. Backend создаёт компанию со статусом "not-defined"
3. Backend создаёт пользователя со статусом "manager"
4. Пользователь связывается с компанией через `company_id`

## Применение миграций

```bash
cd b5-db-2
php artisan migrate
```

## Статусы

### Статусы пользователей (user_statuses)
- not-defined (по умолчанию)
- client
- agent
- designer
- manager (присваивается при регистрации)
- curator
- admin

### Статусы компаний (company_statuses)
- not-defined (по умолчанию, присваивается при регистрации)
- contractors
- suppliers
- delivery
- services
