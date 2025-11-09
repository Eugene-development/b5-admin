# Плавные переходы между страницами

## Обзор

В проекте реализованы плавные переходы между страницами с использованием библиотеки `tailwindcss-animated`.

## Компонент PageTransition

Создан универсальный компонент `PageTransition` для управления анимациями переходов между страницами.

### Расположение

`src/lib/components/PageTransition/index.svelte`

### Использование

```svelte
<script>
	import { PageTransition } from '$lib';
	import { page } from '$app/stores';
</script>

{#key $page.url.pathname}
	<PageTransition type="fade" duration={400}>
		<!-- Ваш контент страницы -->
	</PageTransition>
{/key}
```

### Свойства (Props)

- **type** - Тип анимации (по умолчанию: `'fade'`)
  - `'fade'` - плавное появление/исчезновение
  - `'slide-up'` - выезд снизу вверх
  - `'slide-down'` - выезд сверху вниз
  - `'slide-left'` - выезд справа налево
  - `'slide-right'` - выезд слева направо
  - `'zoom'` - увеличение с появлением

- **duration** - Длительность анимации в миллисекундах (по умолчанию: `300`)
  - Допустимые значения: любое число (например, 150, 300, 500, 1000)

### Примеры использования

#### Базовый fade-эффект

```svelte
<PageTransition type="fade" duration={400}>
	{@render children?.()}
</PageTransition>
```

#### Slide-up эффект

```svelte
<PageTransition type="slide-up" duration={500}>
	<h1>Заголовок страницы</h1>
	<p>Контент страницы...</p>
</PageTransition>
```

#### Zoom эффект с быстрой анимацией

```svelte
<PageTransition type="zoom" duration={200}>
	<div class="content">...</div>
</PageTransition>
```

## Глобальная конфигурация

Переходы настроены на уровне главного layout-файла (`src/routes/+layout.svelte`).

### Текущая конфигурация

- **Тип анимации**: fade (плавное появление)
- **Длительность**: 400ms
- **Триггер**: изменение URL-пути страницы

### Изменение глобальных настроек

Чтобы изменить тип анимации для всех страниц, отредактируйте `src/routes/+layout.svelte`:

```svelte
<PageTransition type="slide-up" duration={500}>
	{@render children?.()}
</PageTransition>
```

## Настройка для отдельных страниц

Если нужно применить особую анимацию для конкретной страницы или группы страниц, создайте вложенный layout:

```svelte
<!-- src/routes/(protected)/+layout.svelte -->
<script>
	import { PageTransition } from '$lib';
	import { page } from '$app/stores';
	let { children } = $props();
</script>

{#key $page.url.pathname}
	<PageTransition type="slide-left" duration={400}>
		{@render children?.()}
	</PageTransition>
{/key}
```

## Техническая реализация

1. **Подключение библиотеки**: `tailwindcss-animated` добавлен как импорт в `src/app.css`

   ```css
   @import 'tailwindcss-animated';
   ```

2. **Отслеживание навигации**: Используется `{#key}` блок Svelte с реактивным значением `$page.url.pathname`

3. **CSS-классы**: Компонент использует классы из `tailwindcss-animated`:
   - `animate-fade`, `animate-fade-up`, etc.
   - `style="animation-duration: {duration}ms"`
   - `animate-ease-in-out`

## Производительность

- Анимации используют CSS transitions, что обеспечивает плавность на GPU
- Короткая длительность (400ms) не замедляет навигацию
- Блок `{#key}` эффективно пересоздает DOM только при изменении роута
- Анимация только при появлении страницы - быстрая и отзывчивая навигация

## Совместимость

- ✅ SvelteKit 2.x
- ✅ Svelte 5.x (использует современный синтаксис runes)
- ✅ Tailwind CSS 4.x
- ✅ tailwindcss-animated 2.x

## Рекомендации

- Используйте короткую длительность (200-400ms) для лучшего UX
- Для мобильных устройств рассмотрите более простые анимации (fade)
- Избегайте сложных анимаций на больших страницах с тяжелым контентом
- Однонаправленная анимация (только появление) обеспечивает быструю навигацию
