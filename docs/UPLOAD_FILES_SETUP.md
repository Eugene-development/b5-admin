# Настройка загрузки файлов в Yandex Cloud S3

## Описание

Реализован функционал загрузки файлов (эскизов и коммерческих предложений) для техзаданий в облачное хранилище Yandex Cloud S3.

## Что было сделано

### Backend (b5-api-2)

1. **Миграция базы данных**
   - Добавлены поля в таблицу `technical_specifications`:
     - `sketch_file` - URL файла эскиза
     - `sketch_filename` - оригинальное имя файла эскиза
     - `commercial_proposal` - URL файла КП
     - `cp_filename` - оригинальное имя файла КП

2. **GraphQL схема** (`b5-api-2/graphql/technical_specification.graphql`)
   - Добавлены поля файлов в тип `TechnicalSpecification`
   - Добавлены мутации:
     - `uploadTechnicalSpecificationSketch` - загрузка эскиза
     - `uploadTechnicalSpecificationCP` - загрузка КП

3. **Resolvers**
   - `UploadTechnicalSpecificationSketch.php` - обработчик загрузки эскиза
   - `UploadTechnicalSpecificationCP.php` - обработчик загрузки КП

4. **Модель** (`app/Models/TechnicalSpecification.php`)
   - Добавлены поля файлов в `$fillable`

5. **Конфигурация S3** (`config/filesystems.php`)
   - Настроен endpoint для Yandex Cloud

### Frontend (b5-admin)

1. **API** (`src/lib/api/technicalSpecifications.js`)
   - Добавлены функции:
     - `uploadSketchFile()` - загрузка эскиза
     - `uploadCPFile()` - загрузка КП
   - Обновлены GraphQL запросы с полями файлов

2. **Компоненты**
   - `FileUploadModal.svelte` - модальное окно для загрузки файлов с drag & drop
   - `TzTable.svelte` - обновлена таблица с кнопками "Загрузить" вместо "Нет файла"

3. **Страница** (`src/routes/(protected)/tz/+page.svelte`)
   - Добавлены обработчики загрузки файлов
   - Интеграция с модальным окном

## Настройка Yandex Cloud S3

### 1. Создание бакета в Yandex Cloud

1. Войдите в консоль Yandex Cloud
2. Перейдите в Object Storage
3. Создайте новый бакет
4. Настройте публичный доступ для чтения (если нужно)

### 2. Создание сервисного аккаунта

1. Перейдите в IAM
2. Создайте сервисный аккаунт
3. Назначьте роль `storage.editor`
4. Создайте статический ключ доступа
5. Сохраните:
   - Идентификатор ключа (Access Key ID)
   - Секретный ключ (Secret Access Key)

### 3. Настройка переменных окружения

Добавьте в файл `b5-api-2/.env`:

```env
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_DEFAULT_REGION=ru-central1
AWS_BUCKET=your_bucket_name
AWS_ENDPOINT=https://storage.yandexcloud.net
AWS_USE_PATH_STYLE_ENDPOINT=false
```

### 4. Применение миграций

```bash
cd b5-db-2
php artisan migrate
```

Или если используете отдельную базу данных:

```bash
cd b5-api-2
php artisan migrate
```

## Использование

1. Откройте страницу техзаданий
2. Найдите техзадание без эскиза или КП
3. Нажмите кнопку "Загрузить"
4. Выберите файл или перетащите его в окно
5. Нажмите "Загрузить"

Поддерживаемые форматы:

- PDF, DOC, DOCX
- XLS, XLSX
- PNG, JPG, JPEG

Максимальный размер файла: 10MB

## Структура хранения файлов

Файлы сохраняются в следующей структуре:

```
bucket/
├── technical-specifications/
│   ├── sketches/
│   │   └── [generated-filename]
│   └── commercial-proposals/
│       └── [generated-filename]
```

## Безопасность

- Файлы загружаются через GraphQL с использованием multipart/form-data
- Поддерживается автоматическое удаление старых файлов при загрузке новых
- Все операции логируются

## Troubleshooting

### Ошибка "Unable to locate credentials"

Проверьте, что переменные `AWS_ACCESS_KEY_ID` и `AWS_SECRET_ACCESS_KEY` установлены в `.env`

### Ошибка "The bucket does not exist"

Проверьте, что бакет создан и имя указано правильно в `AWS_BUCKET`

### Ошибка "Access Denied"

Проверьте права доступа сервисного аккаунта (должна быть роль `storage.editor`)

### Файлы не загружаются

1. Проверьте логи Laravel: `storage/logs/laravel.log`
2. Проверьте консоль браузера на наличие ошибок
3. Убедитесь, что размер файла не превышает лимит PHP (`upload_max_filesize`, `post_max_size`)
