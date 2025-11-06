# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

B5 Admin - административная панель для управления системой Bonus5. Построено на SvelteKit 2 + Svelte 5 с использованием Tailwind CSS 4. Приложение взаимодействует с теми же backend сервисами что и b5-agent:
- **b5-api-2**: GraphQL API сервер (порт 8000)
- **b5-auth-2**: сервер аутентификации (порт 8001)

**Особенность**: Приложение использует domain-based access control - разные функции доступны на разных доменах.

## Commands

### Development
```bash
npm run dev              # Запуск dev сервера с development конфигурацией
npm run dev:prod         # Запуск dev сервера с production конфигурацией
```

### Build & Preview
```bash
npm run build            # Production сборка
npm run build:dev        # Development сборка для тестирования
npm run preview          # Предварительный просмотр production сборки
```

### Testing & Linting
```bash
npm test                 # Запуск тестов в watch режиме (vitest)
npm run test:run         # Запуск тестов один раз
npm run lint             # Проверка форматирования (prettier)
npm run format           # Форматирование кода (prettier)
```

## Architecture

### Domain-Based Access Control

**Ключевая особенность**: Разные страницы доступны на разных доменах (см. `src/hooks.server.js`):

- **rubonus.info**: /actions, /tz, /projects, /finance, /documentation
- **bonus.band**: /projects, /actions, /contractors, /suppliers, /services, /tz, /bz, /finance, /documentation
- **d.rubonus.info**: /bz, /suppliers
- **admin.bonus.band**: полный доступ ко всем страницам (agents, curators, contractors, suppliers, services, clients, projects, finance, tz, bz, actions, documentation)
- **localhost**: полный доступ для разработки

Общие страницы доступны со всех доменов: /dashboard, /profile, /settings, /login, /register, /email-verify, /health, /

При попытке доступа к странице с неразрешенного домена возвращается 403 Forbidden.

### Routing Structure

- `src/routes/(protected)/` - защищенные страницы, требующие аутентификации и domain access control
  - `/agents` - управление агентами
  - `/curators` - управление кураторами
  - `/contractors` - управление подрядчиками
  - `/suppliers` - управление поставщиками
  - `/services` - управление услугами
  - `/clients` - управление клиентами
  - `/projects` - управление проектами
  - `/finance` - финансы
  - `/tz`, `/bz` - техническая и бизнес документация
  - `/actions` - акции
  - `/documentation` - документация
- `src/routes/(auth)/` - страницы аутентификации (login, register)
- `src/routes/+page.svelte` - главная страница (dashboard)

### Authentication System

Идентична системе в b5-agent:
- Использует **Svelte 5 runes** ($state, $effect, $derived)
- `src/lib/auth/auth.svelte.js` - центральное хранилище состояния аутентификации
- `src/lib/auth/auth-guard.svelte.js` - middleware для защиты маршрутов
- `src/hooks.server.js` - применяет auth middleware + domain access control
- `src/routes/+layout.server.js` - загружает данные пользователя на сервере

### Environment Configuration

Использует те же переменные что и b5-agent:
```
VITE_API_BASE_URL=http://localhost:8000      # GraphQL API (b5-api-2)
VITE_AUTH_API_URL=http://localhost:8001      # Auth API (b5-auth-2)
VITE_FRONTEND_URL=http://localhost:5174      # Frontend URL (другой порт!)
```

### HTTP Client & API Communication

- `src/lib/utils/http-client.js` - централизованный HTTP клиент
- `src/lib/api/` - GraphQL запросы и mutations
- Использует `graphql-request` для GraphQL коммуникации

### State Management

Проект использует **Svelte 5 runes**:
- `$state()` для реактивного состояния
- `$derived()` для вычисляемых значений
- `$effect()` для side effects

### Component Library

- `src/lib/components/` - переиспользуемые UI компоненты
- Использует `clsx` и `tailwind-merge` для динамического управления классами
- Компоненты используют Tailwind CSS 4 с кастомными анимациями через `tailwindcss-animated`

### UI Styling

Стиль аналогичен b5-agent - dark theme с gradient акцентами.

## Key Technologies

- **SvelteKit 2** - фреймворк с SSR
- **Svelte 5** - новые runes ($state, $effect, $derived)
- **Tailwind CSS 4** - utility-first CSS
- **Vitest** - тестирование
- **GraphQL** - через graphql-request
- **Adapter Node** - для production деплоя

## Important Notes

При работе с routing учитывайте domain access control - проверяйте в `src/hooks.server.js` какие домены имеют доступ к создаваемым/изменяемым страницам.
