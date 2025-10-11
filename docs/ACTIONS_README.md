# Функционал добавления акций - README

## 📋 Статус

✅ **Фронтенд**: Полностью реализован и работает с моковыми данными  
⏳ **Бэкенд**: Требуется реализация GraphQL API  
🔧 **API функции**: Готовы, но закомментированы до реализации бэкенда

## 🚀 Быстрый старт

### Текущая работа (с моковыми данными)

Страница `/actions` уже работает и позволяет:
- Просматривать список акций
- Добавлять новые акции через модальное окно
- Искать акции по названию, компании, региону
- Просматривать детали акции

**Данные сохраняются только в памяти браузера** и исчезают при перезагрузке страницы.

### Переход на реальный API

1. **Реализуйте бэкенд** (подробно в `ACTIONS_API_BACKEND.md`):
   ```bash
   cd b5-db-2
   php artisan migrate
   # Добавьте GraphQL схему
   php artisan lighthouse:clear-cache
   ```

2. **Включите API** (подробно в `ACTIONS_ENABLE_API.md`):
   - Раскомментируйте импорты в `+page.js` и `+page.svelte`
   - Раскомментируйте вызовы API функций
   - Перезапустите dev-сервер

## 📁 Структура файлов

```
b5-admin/
├── src/
│   ├── lib/
│   │   ├── api/
│   │   │   └── actions.js              # ✅ API функции (готовы)
│   │   └── components/
│   │       └── ActionAddModal.svelte   # ✅ Модальное окно
│   └── routes/(protected)/actions/
│       ├── +page.svelte                # ✅ Страница (моковые данные)
│       └── +page.js                    # ✅ Загрузчик (моковые данные)
└── docs/
    ├── ACTIONS_README.md               # 📖 Этот файл
    ├── ACTION_ADD_FEATURE.md           # 📖 Описание функционала
    ├── ACTIONS_API_BACKEND.md          # 📖 Требования к бэкенду
    └── ACTIONS_ENABLE_API.md           # 📖 Инструкция подключения API

b5-db-2/
└── database/migrations/
    └── 2025_11_10_120000_create_actions_table.php  # ✅ Миграция
```

## 🎯 Что реализовано

### Компонент ActionAddModal
- ✅ Форма с валидацией
- ✅ Выбор компании из списка
- ✅ Выбор дат начала и окончания
- ✅ Чекбокс активности (по умолчанию false)
- ✅ Адаптивный дизайн
- ✅ Доступность (ARIA, клавиатура)

### API функции (готовы к использованию)
- ✅ `createAction()` - создание акции
- ✅ `updateAction()` - обновление акции
- ✅ `deleteAction()` - удаление акции
- ✅ `refreshActions()` - получение списка
- ✅ `getCompaniesForActions()` - получение компаний

### Страница /actions
- ✅ Список акций с поиском
- ✅ Кнопка "Добавить акцию"
- ✅ Модальное окно добавления
- ✅ Обработка ошибок
- ✅ Toast-уведомления

## 🔧 Что нужно сделать

### На бэкенде (b5-api-2)

1. **Запустить миграцию**:
   ```bash
   cd b5-db-2
   php artisan migrate
   ```

2. **Создать модель** `app/Models/Action.php`:
   ```php
   <?php
   namespace App\Models;
   use Illuminate\Database\Eloquent\Model;
   use Illuminate\Database\Eloquent\Concerns\HasUlids;

   class Action extends Model
   {
       use HasUlids;
       
       protected $fillable = [
           'name', 'description', 'start', 'end', 
           'company_id', 'is_active'
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

3. **Добавить GraphQL схему** в `graphql/schema.graphql` (см. `ACTIONS_API_BACKEND.md`)

4. **Очистить кэш**:
   ```bash
   php artisan lighthouse:clear-cache
   ```

### На фронтенде (b5-admin)

После реализации бэкенда:

1. **В файле `+page.js`** раскомментировать:
   ```javascript
   import { refreshActions, getCompaniesForActions } from '$lib/api/actions.js';
   ```

2. **В файле `+page.svelte`** раскомментировать:
   ```javascript
   import { createAction, refreshActions } from '$lib/api/actions.js';
   ```

3. **Раскомментировать вызовы API** в функциях `handleSaveNewAction` и `refreshData`

Подробная инструкция: `ACTIONS_ENABLE_API.md`

## 🧪 Тестирование

### Проверка бэкенда

```bash
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ actions(first: 1) { data { id name } } }"}'
```

Ожидаемый результат: JSON с данными или пустой массив

### Проверка фронтенда

1. Откройте `http://localhost:5173/actions`
2. Нажмите "Добавить акцию"
3. Заполните форму
4. Нажмите "Добавить акцию"
5. Проверьте, что акция появилась в списке

## 📚 Документация

- **ACTION_ADD_FEATURE.md** - Полное описание функционала
- **ACTIONS_API_BACKEND.md** - Требования к бэкенду и примеры кода
- **ACTIONS_ENABLE_API.md** - Пошаговая инструкция подключения API
- **CHANGELOG_ACTIONS.md** - История изменений

## ❓ FAQ

**Q: Почему я вижу ошибку "Cannot query field 'actions'"?**  
A: Бэкенд API еще не реализован. Страница работает с моковыми данными.

**Q: Данные не сохраняются после перезагрузки страницы**  
A: Это нормально для мокового режима. После подключения API данные будут сохраняться в БД.

**Q: Как проверить, что API готов?**  
A: Выполните curl-запрос из раздела "Тестирование". Если нет ошибки - API готов.

**Q: Можно ли использовать функционал сейчас?**  
A: Да! Страница полностью работает с моковыми данными для демонстрации и тестирования UI.

## 🤝 Поддержка

При возникновении проблем:
1. Проверьте консоль браузера (F12)
2. Проверьте логи Laravel (`storage/logs/laravel.log`)
3. Убедитесь, что миграция выполнена
4. Проверьте GraphQL схему в Playground
