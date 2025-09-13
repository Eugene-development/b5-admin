# LogoutButton Component

A reusable logout button component for the B5 Agent authentication system.

## Features

- ✅ Integrates with the logout function from auth.svelte.js (Requirement 3.1)
- ✅ Implements redirection to login page after logout (Requirement 3.2)  
- ✅ Clears authentication state and tokens (Requirement 3.3)
- ✅ Optional confirmation dialog
- ✅ Multiple visual variants (button/link)
- ✅ Different sizes (small/medium/large)
- ✅ Loading states with spinner
- ✅ Full accessibility compliance
- ✅ Responsive design
- ✅ Only shows when user is authenticated

## Usage

### Basic Usage

```svelte
<script>
  import { LogoutButton } from '$lib';
</script>

<LogoutButton />
```

### With Confirmation Dialog

```svelte
<LogoutButton showConfirmation={true} />
```

### Link Style

```svelte
<LogoutButton variant="link" />
```

### Different Sizes

```svelte
<LogoutButton size="small" />
<LogoutButton size="medium" />
<LogoutButton size="large" />
```

### Custom Redirect

```svelte
<LogoutButton redirectTo="/custom-login" />
```

### Custom CSS Class

```svelte
<LogoutButton className="my-custom-class" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showConfirmation` | `boolean` | `false` | Show confirmation dialog before logout |
| `redirectTo` | `string` | `'/login'` | Page to redirect to after logout |
| `variant` | `'button' \| 'link'` | `'button'` | Visual style variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `className` | `string` | `''` | Additional CSS classes |

## Requirements Fulfilled

This component fulfills the following requirements from the specification:

- **3.1**: Завершение сессии пользователя при нажатии кнопки выхода
- **3.2**: Перенаправление пользователя на страницу входа после выхода  
- **3.3**: Удаление всех токенов аутентификации при выходе из системы

## Accessibility

The component is fully accessible with:
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- High contrast mode support
- Reduced motion support

## Styling

The component includes comprehensive CSS with:
- Responsive design
- Loading states
- Hover and focus effects
- Multiple size variants
- Customizable appearance
- Modal dialog styling