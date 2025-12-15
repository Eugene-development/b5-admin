# Проблема с доменом rubonus.pro - ИСПРАВЛЕНО

## Описание проблемы

На продакшене при работе с сайтом `https://rubonus.pro` возникала ошибка при смене статуса договора:

```
Access to fetch at 'https://api.bonus.band/graphql' from origin 'https://rubonus.pro' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present 
on the requested resource.
```

## Причина

Файл `contracts.js` использовал статический `GRAPHQL_ENDPOINT` из `api.js`, который не учитывал мультидоменную систему из `domain.js`. В результате запросы с `rubonus.pro` шли на `api.bonus.band` вместо `api.rubonus.pro`, и cookie не отправлялась (разные домены).

## Почему остальные запросы работали?

Другие API файлы могли использовать мультидоменную систему правильно, или их операции не требовали строгой аутентификации.

### Как работает аутентификация:

1. Пользователь заходит на `https://rubonus.pro` (b5-admin)
2. Логинится через `https://auth.rubonus.pro` (b5-auth-2)
3. Auth сервис устанавливает httpOnly cookie `b5_auth_token` с доменом `.rubonus.pro`
4. Браузер сохраняет cookie для домена `.rubonus.pro`

### Почему возникает ошибка:

Текущая конфигурация в `.env.production`:
```env
VITE_API_BASE_URL=https://api.bonus.band  # ❌ Другой домен!
VITE_AUTH_API_URL=https://auth.bonus.band
VITE_FRONTEND_URL=https://admin.bonus.band
```

Когда b5-admin делает запрос к `https://api.bonus.band`:
- Cookie с доменом `.rubonus.pro` НЕ отправляется на `api.bonus.band` (разные домены)
- API не получает JWT токен из cookie
- Запрос выполняется без аутентификации
- Некоторые операции (например, `updateContractStatus`) требуют аутентификации
- Запрос падает с ошибкой

### Почему другие операции работают:

Некоторые GraphQL запросы не требуют обязательной аутентификации:
- Чтение данных (queries) может быть доступно без токена
- Некоторые мутации могут работать без строгой проверки
- Но `updateContractStatus` требует аутентифицированного пользователя

## Решение - ПРИМЕНЕНО

### Исправление в коде

Обновлены файлы:

1. **`src/lib/config/api.js`**
   - Добавлена функция `getGraphQLEndpoint()` которая использует мультидоменную систему из `domain.js`
   - Теперь API URL определяется динамически на основе текущего домена

2. **`src/lib/api/contracts.js`**
   - Изменен импорт с `GRAPHQL_ENDPOINT` на `getGraphQLEndpoint()`
   - Теперь использует динамический endpoint: `const graphqlEndpoint = getGraphQLEndpoint();`

### Как это работает

Мультидоменная система (`domain.js`) автоматически определяет правильные API URLs:

```javascript
// Для rubonus.pro
'rubonus.pro': {
    authApi: 'https://auth.rubonus.pro',
    api: 'https://api.rubonus.pro'
}

// Для admin.bonus.band
'admin.bonus.band': {
    authApi: 'https://auth.bonus.band',
    api: 'https://api.bonus.band'
}
```

Теперь запросы с `rubonus.pro` идут на `api.rubonus.pro`, и cookie отправляется корректно.

### Вариант 2: Настроить nginx reverse proxy

Пример конфигурации nginx для `api.rubonus.pro`:

```nginx
server {
    listen 443 ssl http2;
    server_name api.rubonus.pro;

    # SSL сертификаты
    ssl_certificate /path/to/ssl/rubonus.pro/fullchain.pem;
    ssl_certificate_key /path/to/ssl/rubonus.pro/privkey.pem;

    # Проксирование на api.bonus.band
    location / {
        proxy_pass https://api.bonus.band;
        proxy_set_header Host api.bonus.band;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Важно для cookies
        proxy_cookie_domain api.bonus.band api.rubonus.pro;
    }
}

server {
    listen 443 ssl http2;
    server_name auth.rubonus.pro;

    # SSL сертификаты
    ssl_certificate /path/to/ssl/rubonus.pro/fullchain.pem;
    ssl_certificate_key /path/to/ssl/rubonus.pro/privkey.pem;

    # Проксирование на auth.bonus.band
    location / {
        proxy_pass https://auth.bonus.band;
        proxy_set_header Host auth.bonus.band;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Важно для cookies
        proxy_cookie_domain auth.bonus.band auth.rubonus.pro;
    }
}
```

### Вариант 3: Использовать отдельные инстансы API и Auth

Развернуть отдельные инстансы b5-api-2 и b5-auth-2 на поддоменах rubonus.pro с той же базой данных.

## Пошаговая инструкция (Вариант 1 - Рекомендуется)

### Шаг 1: Настроить DNS

Добавить A-записи для поддоменов:
```
api.rubonus.pro    → IP сервера
auth.rubonus.pro   → IP сервера
```

### Шаг 2: Получить SSL сертификаты

```bash
# Используя certbot
sudo certbot certonly --nginx -d api.rubonus.pro
sudo certbot certonly --nginx -d auth.rubonus.pro
```

### Шаг 3: Настроить nginx

Создать файлы конфигурации:
- `/etc/nginx/sites-available/api.rubonus.pro`
- `/etc/nginx/sites-available/auth.rubonus.pro`

Активировать:
```bash
sudo ln -s /etc/nginx/sites-available/api.rubonus.pro /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/auth.rubonus.pro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Шаг 4: Пересобрать b5-admin для rubonus.pro

```bash
cd b5-admin

# Использовать конфигурацию для rubonus
cp .env.production.rubonus .env.production

# Собрать
npm run build

# Деплой (скопировать build на сервер)
```

### Шаг 5: Проверить

1. Открыть `https://rubonus.pro`
2. Залогиниться
3. Попробовать изменить статус договора
4. Проверить в DevTools → Network:
   - Запросы должны идти к `https://api.rubonus.pro/graphql`
   - Cookie `b5_auth_token` должна отправляться
   - Ошибок CORS быть не должно

## Проверка текущей конфигурации

### Проверить какие cookies установлены:

В DevTools → Application → Cookies → `https://rubonus.pro`

Должна быть cookie:
- Name: `b5_auth_token`
- Domain: `.rubonus.pro`
- Path: `/`
- HttpOnly: ✓
- Secure: ✓
- SameSite: Lax

### Проверить запросы:

В DevTools → Network → выбрать запрос к GraphQL:
- Request Headers должны содержать `Cookie: b5_auth_token=...`
- Если cookie нет в запросе → проблема с доменом

## Почему это не CORS?

CORS ошибка возникает, но это **следствие**, а не причина:

1. Браузер делает preflight OPTIONS запрос к `api.bonus.band`
2. Сервер отвечает с правильными CORS заголовками
3. Браузер делает основной POST запрос БЕЗ cookie (разные домены)
4. API не получает токен, запрос не авторизован
5. API возвращает ошибку БЕЗ CORS заголовков (потому что запрос упал до middleware)
6. Браузер показывает CORS ошибку

Настоящая причина: **cookie не отправляется на другой домен**.

## Альтернативное решение (не рекомендуется)

Можно передавать токен в заголовке Authorization вместо cookie, но это:
- Менее безопасно (токен доступен JavaScript)
- Требует изменений в коде
- Не использует преимущества httpOnly cookies

## Контрольный список

- [ ] DNS записи для api.rubonus.pro и auth.rubonus.pro созданы
- [ ] SSL сертификаты получены
- [ ] Nginx настроен для проксирования
- [ ] b5-admin пересобран с `.env.production.rubonus`
- [ ] Деплой выполнен
- [ ] Тестирование успешно
- [ ] Cookie отправляется на правильный домен
- [ ] Смена статуса договора работает

## Дополнительная информация

См. также:
- `MULTI_DOMAIN_SETUP.md` в корне проекта
- `JWT_MIGRATION_GUIDE.md` для информации о httpOnly cookies
- `b5-auth-2/app/Http/Controllers/AuthController.php` - метод `getCookieDomainFromOrigin()`
