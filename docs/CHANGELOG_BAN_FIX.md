# Исправление опечатки: bun → ban

## Дата: 14.10.2025

## Описание

Исправлена опечатка в названии поля для бана клиентов и компаний. Поле `bun` переименовано в `ban` во всём проекте b5-admin.

## Изменённые файлы

### API слой

1. **src/lib/api/companies.js**
   - Все GraphQL запросы и мутации обновлены с `bun` на `ban`
   - Функции: `createCompany`, `updateCompany`, `toggleCompanyBan`, `refreshCompanies`

2. **src/lib/api/actions.js**
   - GraphQL запрос для получения компаний обновлён
   - Фильтр активных компаний: `!company.ban` вместо `!company.bun`

### Страницы загрузки данных (+page.js)

3. **src/routes/(protected)/suppliers/+page.js**
   - GraphQL запрос обновлён: `bun` → `ban`
   - Маппинг статуса: `company.ban` вместо `company.bun`

4. **src/routes/(protected)/contractors/+page.js**
   - GraphQL запрос обновлён: `bun` → `ban`
   - Маппинг статуса: `company.ban` вместо `company.bun`

5. **src/routes/(protected)/services/+page.js**
   - GraphQL запрос обновлён: `bun` → `ban`
   - Маппинг статуса: `company.ban` вместо `company.bun`

6. **src/routes/(protected)/delivery/+page.js**
   - GraphQL запрос обновлён: `bun` → `ban`
   - Маппинг статуса: `company.ban` вместо `company.bun`

### Страницы интерфейса (+page.svelte)

7. **src/routes/(protected)/suppliers/+page.svelte**
   - Обновление локального состояния: `updatedCompany.ban`
   - Маппинг при обновлении списка: `company.ban`

8. **src/routes/(protected)/contractors/+page.svelte**
   - Обновление локального состояния: `updatedCompany.ban`
   - Маппинг при обновлении списка: `company.ban`

9. **src/routes/(protected)/services/+page.svelte**
   - Обновление локального состояния: `updatedCompany.ban`
   - Маппинг при обновлении списка: `company.ban`

10. **src/routes/(protected)/delivery/+page.svelte**
    - Обновление локального состояния: `updatedCompany.ban`
    - Маппинг при обновлении списка: `company.ban`

### Страницы пользователей

11. **src/routes/(protected)/clients/+page.svelte**
    - Маппинг статуса пользователя: `user.ban` вместо `user.bun`
    - Обновлены комментарии

12. **src/routes/(protected)/agents/+page.svelte**
    - Маппинг статуса пользователя: `user.ban` вместо `user.bun`
    - Обновлены комментарии: "derived from ban field"

13. **src/routes/(protected)/curators/+page.svelte**
    - Маппинг статуса пользователя: `user.ban` вместо `user.bun`
    - Обновлены комментарии: "derived from ban field"

14. **src/routes/(protected)/designers/+page.svelte**
    - Маппинг статуса пользователя: `user.ban` вместо `user.bun`

15. **src/routes/(protected)/managers/+page.svelte**
    - Маппинг статуса пользователя: `user.ban` вместо `user.bun`

### Компоненты

16. **src/lib/components/CompanyEditModal.svelte**
    - Передача поля `ban` вместо `bun` при обновлении компании

### Документация

17. **docs/ACTIONS_API_ENABLED.md**
    - SQL запрос обновлён: `ban = 0` вместо `bun = 0`
    - GraphQL схема обновлена: поле `ban`

18. **docs/ACTIONS_API_BACKEND.md**
    - GraphQL тип обновлён: `ban: Boolean!` вместо `bun: Boolean!`

## Логика изменений

### Для компаний

```javascript
// Было:
status: company.bun ? 'banned' : company.is_active ? 'active' : 'inactive';

// Стало:
status: company.ban ? 'banned' : company.is_active ? 'active' : 'inactive';
```

### Для пользователей

```javascript
// Было:
status: user.bun ? 'banned' : 'active';

// Стало:
status: user.ban ? 'banned' : 'active';
```

### GraphQL мутации

```graphql
# Было:
mutation UpdateCompany($input: UpdateCompanyInput!) {
	updateCompany(input: $input) {
		bun
	}
}

# Стало:
mutation UpdateCompany($input: UpdateCompanyInput!) {
	updateCompany(input: $input) {
		ban
	}
}
```

## Проверка

- ✅ Все файлы в src/ обновлены
- ✅ Документация обновлена
- ✅ Диагностика не выявила ошибок
- ✅ Логика бана сохранена без изменений

## Примечание

Файл `.prettierignore` содержит упоминание `bun.lock` и `bun.lockb` - это относится к пакетному менеджеру Bun, а не к логике бана, поэтому не требует изменений.

## Следующие шаги

1. Убедиться, что бэкенд (b5-api-2) также использует поле `ban` вместо `bun`
2. Проверить миграции базы данных на наличие правильного названия поля
3. Протестировать функционал бана/разбана для клиентов и компаний
