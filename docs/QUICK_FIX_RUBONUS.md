# Быстрое исправление для rubonus.pro

## Проблема

Ошибка CORS при смене статуса договора на `https://rubonus.pro`.

**Причина:** Cookie с доменом `.rubonus.pro` не отправляется на `api.bonus.band` (разные домены).

## Быстрое решение

### 1. Настроить nginx reverse proxy

Создать файл `/etc/nginx/sites-available/api.rubonus.pro`:

```nginx
server {
    listen 443 ssl http2;
    server_name api.rubonus.pro;

    ssl_certificate /etc/letsencrypt/live/rubonus.pro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rubonus.pro/privkey.pem;

    location / {
        proxy_pass https://api.bonus.band;
        proxy_set_header Host api.bonus.band;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cookie_domain api.bonus.band api.rubonus.pro;
    }
}
```

Создать файл `/etc/nginx/sites-available/auth.rubonus.pro`:

```nginx
server {
    listen 443 ssl http2;
    server_name auth.rubonus.pro;

    ssl_certificate /etc/letsencrypt/live/rubonus.pro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rubonus.pro/privkey.pem;

    location / {
        proxy_pass https://auth.bonus.band;
        proxy_set_header Host auth.bonus.band;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cookie_domain auth.bonus.band auth.rubonus.pro;
    }
}
```

Активировать:

```bash
sudo ln -s /etc/nginx/sites-available/api.rubonus.pro /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/auth.rubonus.pro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2. Получить SSL сертификаты

```bash
sudo certbot certonly --nginx -d api.rubonus.pro -d auth.rubonus.pro
```

### 3. Пересобрать b5-admin

```bash
cd b5-admin
cp .env.production.rubonus .env.production
npm run build
# Деплой build на сервер
```

### 4. Проверить

Открыть `https://rubonus.pro` и попробовать изменить статус договора.

## Если нет доступа к серверу

Попросить DevOps настроить поддомены `api.rubonus.pro` и `auth.rubonus.pro` как reverse proxy на `api.bonus.band` и `auth.bonus.band`.

Затем пересобрать b5-admin с конфигурацией `.env.production.rubonus`.
