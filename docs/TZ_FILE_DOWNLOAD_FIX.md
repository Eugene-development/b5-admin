# Исправление скачивания файлов техзаданий

## Дата: 6 декабря 2025

## Проблема

При попытке скачать файл из модального окна просмотра техзадания возникала ошибка:
```
NoSuchKey - The specified key does not exist
```

Файл не находился в S3 хранилище по сформированному URL.

## Причина

Фронтенд формировал URL вручную, используя только `file_path`:
```javascript
`https://storage.yandexcloud.net/${sketch.file_path}`
```

Но этот URL был неполным - не хватало имени bucket между доменом и путем к файлу.

## Решение

### 1. Добавлено поле `download_url` в GraphQL схему

**Файл:** `b5-api-2/graphql/technical_specification_file.graphql`

```graphql
type TechnicalSpecificationFile {
    id: ID!
    technical_specification_id: ID!
    file_type: TechnicalSpecificationFileType!
    file_name: String!
    file_path: String!
    file_size: Int
    mime_type: String
    uploaded_by: ID
    uploader: User @belongsTo(relation: "uploader")
    download_url: String!  # <-- Добавлено
    created_at: DateTime!
    updated_at: DateTime!
}
```

### 2. Модель уже имела accessor для формирования URL

**Файл:** `b5-api-2/app/Models/TechnicalSpecificationFile.php`

Accessor `getDownloadUrlAttribute()` уже существовал и правильно формирует URL:
```php
public function getDownloadUrlAttribute(): string
{
    $bucket = config('filesystems.disks.yandex.bucket');
    $endpoint = config('filesystems.disks.yandex.endpoint');
    return rtrim($endpoint, '/') . '/' . $bucket . '/' . $this->file_path;
}
```

### 3. Обновлен фронтенд API

**Файл:** `b5-admin/src/lib/api/technicalSpecifications.js`

Добавлено поле `download_url` в GraphQL запросы для `sketches` и `commercialOffers`.

### 4. Обновлено модальное окно

**Файл:** `b5-admin/src/lib/components/business-processes/tz/TzViewModal.svelte`

Изменено использование URL:
```javascript
// Было:
handleFileDownload(
    `https://storage.yandexcloud.net/${sketch.file_path}`,
    sketch.file_name
)

// Стало:
handleFileDownload(
    sketch.download_url,
    sketch.file_name
)
```

## Результат

✅ Файлы скачиваются корректно  
✅ URL формируется на бэкенде с правильным bucket name  
✅ Фронтенд использует готовый URL из API  
✅ Решение работает для эскизов и коммерческих предложений  

## Тестирование

1. Откройте страницу `/tz`
2. Нажмите "Просмотр" на техзадании с загруженными файлами
3. Нажмите кнопку "Скачать" на любом файле
4. Убедитесь, что файл скачивается без ошибок

## Связанные файлы

- `b5-api-2/graphql/technical_specification_file.graphql` - GraphQL схема
- `b5-api-2/app/Models/TechnicalSpecificationFile.php` - модель с accessor
- `b5-admin/src/lib/api/technicalSpecifications.js` - клиентский API
- `b5-admin/src/lib/components/business-processes/tz/TzViewModal.svelte` - модальное окно

## Примечания

- Accessor `getDownloadUrlAttribute()` автоматически доступен в GraphQL благодаря Lighthouse
- URL формируется динамически на основе конфигурации S3 (Yandex Cloud)
- Аналогичный подход используется для файлов проектов (sketches и offers)
