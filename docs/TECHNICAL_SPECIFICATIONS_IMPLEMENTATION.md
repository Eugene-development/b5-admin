# Реализация функционала техзаданий (Technical Specifications)

## Обзор

Реализован функционал отображения технических заданий на странице `/tz` в проекте b5-admin с интеграцией с GraphQL API.

## Что было реализовано

### Backend (b5-api-2)

1. **Модель TechnicalSpecification** (`app/Models/TechnicalSpecification.php`)
   - Использует ULID для первичного ключа
   - Связь с проектом через `project_id`
   - Поля: `description`, `comment`, `is_active`, `requires_approval`, `is_approved`
   - Поддержка soft deletes

2. **GraphQL схема** (`graphql/technical_specification.graphql`)
   - Query: `technicalSpecifications`, `technicalSpecification`, `technicalSpecificationsByProject`
   - Mutation: `createTechnicalSpecification`, `updateTechnicalSpecification`, `deleteTechnicalSpecification`
   - Автоматическая загрузка связанных данных проекта и куратора

3. **Миграция базы данных**
   - Таблица `technical_specifications` уже создана в `b5-db-2`
   - Миграция: `2025_10_21_120000_create_technical_specifications_table.php`

### Frontend (b5-admin)

1. **API клиент** (`src/lib/api/technicalSpecifications.js`)
   - Функции для работы с техзаданиями через GraphQL
   - Поддержка server-side и client-side fetch
   - Автоматические повторные попытки при ошибках

2. **Страница техзаданий** (`src/routes/(protected)/tz/`)
   - `+page.js` - загрузка данных с сервера
   - `+page.svelte` - основная страница с таблицей и функционалом

3. **Компоненты**
   - `TzTable.svelte` - таблица техзаданий (desktop и mobile версии)
   - `TzViewModal.svelte` - модальное окно просмотра деталей
   - `TzCreateModal.svelte` - модальное окно создания техзадания с валидацией

## Отображаемые данные

В таблице техзаданий отображается:

1. **Куратор** - имя агента из связанного проекта (`project.agent.name`)
2. **Телефон куратора** - основной телефон агента (`project.agent.phones`)
3. **Проект** - название проекта (`project.value`)
4. **Адрес объекта** - регион проекта (`project.region`)
5. **Описание** - описание техзадания (`description`)
6. **Комментарий** - дополнительный комментарий (`comment`)
7. **Эскиз** - файл эскиза (функционал загрузки будет реализован позже)
8. **Коммерческое предложение** - файл КП (функционал загрузки будет реализован позже)

## Функционал

### Реализовано

- ✅ Отображение списка техзаданий
- ✅ Просмотр деталей техзадания
- ✅ Создание нового техзадания
- ✅ Удаление техзадания
- ✅ Обновление данных
- ✅ Поиск по техзаданиям (локальный)
- ✅ Адаптивный дизайн (desktop, tablet, mobile)
- ✅ Валидация формы создания

### Планируется

- ⏳ Редактирование техзадания
- ⏳ Загрузка файлов (эскиз, КП)
- ⏳ Скачивание файлов

## Структура данных

### GraphQL Query

```graphql
query GetTechnicalSpecifications {
	technicalSpecifications(first: 1000) {
		data {
			id
			project_id
			project {
				id
				value
				region
				contract_name
				agent {
					id
					name
					email
					phones {
						id
						value
						is_primary
					}
				}
			}
			description
			comment
			is_active
			requires_approval
			is_approved
			created_at
			updated_at
		}
	}
}
```

## Тестовые данные

Созданы 3 тестовых техзадания для существующих проектов:

- Проект "Наташа2" - куратор Евгений
- Проект "Серёга" - куратор www
- Проект "счцс" - куратор www

## Запуск

1. Убедитесь, что API запущен: `http://localhost:8000/graphql`
2. Убедитесь, что фронтенд запущен: `http://localhost:5173`
3. Перейдите на страницу техзаданий: `http://localhost:5173/tz`

## Примечания

- Данные о кураторе берутся из связанного проекта через поле `agent`
- Комментарии хранятся в поле `comment` таблицы `technical_specifications`
- Файлы (эскиз, КП) будут реализованы в следующей итерации
- Таблица `comments` существует, но пока не используется для техзаданий
