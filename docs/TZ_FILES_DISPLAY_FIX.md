# Исправление отображения файлов в модальном окне просмотра ТЗ

## Дата: 6 декабря 2025

## Проблема

В модальном окне просмотра техзадания (`/tz`) не отображались загруженные файлы (эскизы и коммерческие предложения).

## Причина

После загрузки файла через `FileUploadModal` данные обновлялись в списке `tzList`, но если модальное окно просмотра было открыто, оно продолжало показывать старые данные из `selectedTz`, которые не обновлялись автоматически.

## Исправления

### 1. Frontend (b5-admin)

#### Файл: `src/routes/(protected)/(business-processes)/tz/+page.svelte`

**Изменение 1: Обновление selectedTz после загрузки файла**

```javascript
// Handle file upload
async function handleFileUpload(file) {
    if (!uploadingTz || !uploadType) return;

    isLoading = true;
    try {
        await retryOperation(
            async () => {
                const tzId = uploadingTz.id;
                const fileType = uploadType === 'sketch' ? 'SKETCH' : 'COMMERCIAL_OFFER';
                
                await uploadTzFile(tzId, fileType, file);
                
                if (uploadType === 'sketch') {
                    addSuccessToast('Эскиз успешно загружен');
                } else {
                    addSuccessToast('КП успешно загружено');
                }

                // Reload data to get updated files
                await loadServices();
                
                // ✅ НОВОЕ: Update selectedTz if view modal is open
                if (isViewModalOpen && selectedTz && selectedTz.id === tzId) {
                    const updatedTz = tzList.find(t => t.id === tzId);
                    if (updatedTz) {
                        selectedTz = updatedTz;
                    }
                }
                
                isUploadModalOpen = false;
                uploadingTz = null;
                uploadType = null;
            },
            2,
            1000
        );
    } catch (error) {
        console.error('File upload failed:', error);
        handleApiError(error, 'Не удалось загрузить файл');
    } finally {
        isLoading = false;
    }
}
```

**Изменение 2: Реактивное обновление selectedTz**

```javascript
// ✅ НОВОЕ: Keep selectedTz in sync with tzList updates
$effect(() => {
    if (isViewModalOpen && selectedTz) {
        const updatedTz = tzList.find(t => t.id === selectedTz.id);
        if (updatedTz) {
            selectedTz = updatedTz;
        }
    }
});
```

### 2. Backend (b5-api-2)

#### Файл: `app/GraphQL/Mutations/UploadTzFile.php`

**Изменение: Добавлено логирование и конвертация enum в lowercase**

```php
<?php

namespace App\GraphQL\Mutations;

use App\Services\TzFileUploadService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log; // ✅ НОВОЕ: Добавлен импорт

final class UploadTzFile
{
    protected TzFileUploadService $uploadService;

    public function __construct(TzFileUploadService $uploadService)
    {
        $this->uploadService = $uploadService;
    }

    public function __invoke(mixed $_, array $args)
    {
        // With @spread directive, fields are at the root level of $args
        $tzId = $args['technical_specification_id'];
        $fileType = strtolower($args['file_type']); // ✅ Convert enum to lowercase
        $file = $args['file'];
        $userId = Auth::id();

        // ✅ НОВОЕ: Добавлено логирование для отладки
        Log::info('UploadTzFile mutation called', [
            'tz_id' => $tzId,
            'file_type' => $fileType,
            'user_id' => $userId,
            'file_name' => $file->getClientOriginalName(),
        ]);

        return $this->uploadService->uploadFile($tzId, $fileType, $file, $userId);
    }
}
```

## Как работает решение

1. **Загрузка файла**: Пользователь загружает файл через `FileUploadModal`
2. **Обновление данных**: После успешной загрузки вызывается `loadServices()`, который обновляет `tzList`
3. **Синхронизация selectedTz**: 
   - Сразу после загрузки проверяется, открыто ли модальное окно просмотра
   - Если открыто и показывается то же ТЗ, обновляется `selectedTz` из обновленного `tzList`
4. **Реактивное обновление**: `$effect` следит за изменениями `tzList` и автоматически обновляет `selectedTz`, если модальное окно открыто

## Структура данных

### GraphQL Query возвращает:

```graphql
{
  technicalSpecifications {
    data {
      id
      value
      project_id
      # ... другие поля
      sketches {
        id
        file_type
        file_name
        file_path
        file_size
        mime_type
        uploaded_by
        uploader {
          id
          name
          email
        }
        created_at
        updated_at
      }
      commercialOffers {
        id
        file_type
        file_name
        file_path
        file_size
        mime_type
        uploaded_by
        uploader {
          id
          name
          email
        }
        created_at
        updated_at
      }
    }
  }
}
```

### Модель TechnicalSpecification (Backend):

```php
public function sketches(): HasMany
{
    return $this->files()->where('file_type', 'sketch');
}

public function commercialOffers(): HasMany
{
    return $this->files()->where('file_type', 'commercial_offer');
}
```

## Тестирование

1. Откройте страницу `/tz`
2. Нажмите "Просмотр" на любом техзадании
3. В модальном окне нажмите кнопку загрузки эскиза или КП
4. Загрузите файл
5. После успешной загрузки файл должен сразу отобразиться в модальном окне просмотра
6. Закройте и снова откройте модальное окно - файлы должны отображаться

## Связанные файлы

- `b5-admin/src/routes/(protected)/(business-processes)/tz/+page.svelte` - Страница ТЗ
- `b5-admin/src/lib/components/business-processes/tz/TzViewModal.svelte` - Модальное окно просмотра
- `b5-admin/src/lib/api/technicalSpecifications.js` - API для работы с ТЗ
- `b5-api-2/app/GraphQL/Mutations/UploadTzFile.php` - Resolver для загрузки файлов
- `b5-api-2/app/Models/TechnicalSpecification.php` - Модель ТЗ
- `b5-api-2/app/Services/TzFileUploadService.php` - Сервис загрузки файлов

## Примечания

- Используется Svelte 5 runes (`$state`, `$effect`, `$derived`)
- Файлы хранятся в Yandex Cloud S3
- Поддерживаются два типа файлов: `SKETCH` и `COMMERCIAL_OFFER`
- Максимальный размер файла: 10MB
