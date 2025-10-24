# Исправление проблемы с выходом из системы

## Проблема
После нажатия кнопки "Выйти" пользователь не разлогинивался и автоматически перенаправлялся обратно на дашборд при попытке перейти на главную страницу.

## Причина
1. **Cookie не удалялись на клиенте**: После вызова API `/api/logout`, Laravel корректно удалял сессию на сервере, но браузер продолжал отправлять старый cookie `b5_auth_2_session` при последующих запросах.

2. **SvelteKit использовал SPA-навигацию**: Функция `goto()` выполняла клиентскую навигацию без полной перезагрузки страницы, поэтому браузер не получал обновленные cookies от сервера.

3. **`+layout.server.js` проверял cookie**: При каждой загрузке страницы серверный layout проверял наличие cookie и находил старый, что приводило к повторной аутентификации.

4. **Главная страница редиректила**: `+page.svelte` имел `$effect`, который проверял `authState.isAuthenticated` и автоматически перенаправлял на `/dashboard`.

## Решение

### 1. Замена `goto()` на `window.location.href`
Заменили все вызовы `goto()` после logout на `window.location.href`, чтобы принудительно выполнить полную перезагрузку страницы:

**Измененные файлы:**
- `src/routes/(protected)/+layout.svelte`
- `src/routes/(protected)/profile/+page.svelte`
- `src/routes/(auth)/email-verify/+page.svelte`
- `src/routes/access-denied/+page.svelte`

**Было:**
```javascript
await logout();
goto('/login');
```

**Стало:**
```javascript
await logout();
window.location.href = '/login';
```

### 2. Улучшение логики редиректа на главной странице
Добавили проверки в `src/routes/+page.svelte`, чтобы избежать race conditions:

**Было:**
```javascript
$effect(() => {
    if (authState.isAuthenticated) {
        goto('/dashboard');
    }
});
```

**Стало:**
```javascript
let mounted = $state(false);

onMount(() => {
    mounted = true;
});

$effect(() => {
    if (mounted && authState.initialized && authState.isAuthenticated) {
        goto('/dashboard');
    }
});
```

## Результат
Теперь при нажатии кнопки "Выйти":
1. Вызывается API `/api/logout`, который удаляет сессию на сервере
2. Выполняется полная перезагрузка страницы через `window.location.href`
3. Браузер получает обновленные cookies от сервера (без `b5_auth_2_session`)
4. `+layout.server.js` не находит cookie и возвращает `isAuthenticated: false`
5. Пользователь успешно разлогинивается и остается на странице `/login` или `/`

## Тестирование
1. Войдите в систему
2. Нажмите кнопку "Выйти"
3. Убедитесь, что вы разлогинились
4. Попробуйте перейти на главную страницу `/`
5. Убедитесь, что вас не перебрасывает обратно на дашборд
