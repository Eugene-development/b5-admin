# Исправление загрузки файлов техзаданий

## Дата: 6 декабря 2025

## Проблема

При попытке загрузить файл (эскиз или коммерческое предложение) для техзадания возникала ошибка:

```
Upload TZ file failed: Error: Unknown argument "technical_specification_id" on field "uploadTzFile" of type "Mutation".
```

## Причина

Несоответствие между GraphQL схемой на бэкенде и вызовами мутаций на фронтенде:

**Бэкенд (GraphQL схема):**
```graphql
uploadTzFile(input: UploadTzFileInput! @spread): TechnicalSpecificationFile!
```

**Фронтенд (до исправления):**
```graphql
mutation UploadTzFile($technical_specification_id: ID!, $file_type: TechnicalSpecificationFileType!, $file: Upload!) {
  uploadTzFile(technical_specification_id: $technical_specification_id, file_type: $file_type, file: $file) {
    ...
  }
}
```

Директива `@spread` в GraphQL Lighthouse разворачивает поля из `input` объекта, но мутация все равно ожидает получить `input` как единый аргумент.

## Решение

Обновлены GraphQL мутации на фронтенде для использования `input` объекта:

### 1. Мутация uploadTzFile

**Было:**
```javascript
mutation UploadTzFile($technical_specification_id: ID!, $file_type: TechnicalSpecificationFileType!, $file: Upload!) {
  uploadTzFile(technical_specification_id: $technical_specification_id, file_type: $file_type, file: $file) {
    ...
  }
}
```

**Стало:**
```javascript
mutation UploadTzFile($input: UploadTzFileInput!) {
  uploadTzFile(input: $input) {
    ...
  }
}
```

**Вызов функции:**
```javascript
variables: { 
  input: { 
    technical_specification_id: tzId, 
    file_type: fileType, 
    file: null 
  } 
}
```

**Mapping для multipart upload:**
```javascript
formData.append('map', JSON.stringify({ 0: ['variables.input.file'] }));
```

### 2. Мутация deleteTzFile

**Было:**
```javascript
mutation DeleteTzFile($id: ID!) {
  deleteTzFile(id: $id) {
    ...
  }
}
```

**Стало:**
```javascript
mutation DeleteTzFile($input: DeleteTzFileInput!) {
  deleteTzFile(input: $input) {
    ...
  }
}
```

**Вызов функции:**
```javascript
variables: { input: { id: fileId } }
```

## Измененные файлы

- `b5-admin/src/lib/api/technicalSpecifications.js`
  - Обновлена мутация `UPLOAD_TZ_FILE_MUTATION`
  - Обновлена функция `uploadTzFile()`
  - Обновлена мутация `DELETE_TZ_FILE_MUTATION`
  - Обновлена функция `deleteTzFile()`

## Тестирование

После исправления необходимо протестировать:

1. ✅ Загрузка эскиза для техзадания
2. ✅ Загрузка коммерческого предложения для техзадания
3. ✅ Удаление файла техзадания
4. ✅ Отображение загруженных файлов после обновления страницы

## Примечания

- Использование `input` объектов в GraphQL мутациях является best practice
- Директива `@spread` в Lighthouse позволяет использовать поля из input напрямую в resolver, но не меняет сигнатуру мутации
- Для multipart uploads (файлы) важно правильно указывать путь в `map`: `variables.input.file` вместо `variables.file`
