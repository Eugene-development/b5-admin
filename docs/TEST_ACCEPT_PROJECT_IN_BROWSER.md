# Тест acceptProject в браузере на продакшене

## Шаг 1: Открой admin.bonus.band

1. Открой https://admin.bonus.band
2. Залогинься
3. Открой DevTools (F12)
4. Перейди на вкладку Console

## Шаг 2: Проверь что ты залогинен

```javascript
// Проверь localStorage
console.log('Auth:', localStorage.getItem('auth'));
```

## Шаг 3: Получи ID проекта и пользователя

```javascript
// Перейди на страницу проектов и выполни:
// Это покажет все проекты
console.table(
  document.querySelectorAll('[data-project-id]')
);

// Или найди проект вручную в таблице и скопируй его ID
```

## Шаг 4: Тест CORS и credentials

```javascript
// Тест 1: Простой запрос
fetch('https://api.bonus.band/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    query: '{ __typename }'
  })
})
.then(r => {
  console.log('✅ Status:', r.status);
  console.log('✅ CORS Headers:', {
    'Access-Control-Allow-Origin': r.headers.get('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Credentials': r.headers.get('Access-Control-Allow-Credentials')
  });
  return r.json();
})
.then(data => console.log('✅ Response:', data))
.catch(err => console.error('❌ Error:', err));
```

## Шаг 5: Тест acceptProject мутации

```javascript
// Замени PROJECT_ID и USER_ID на реальные значения
const PROJECT_ID = '01JEX...';  // ID проекта со статусом "Новый проект"
const USER_ID = '01JEX...';     // Твой ID пользователя

const mutation = `
  mutation AcceptProject($projectId: ID!, $userId: ID!) {
    acceptProject(projectId: $projectId, userId: $userId) {
      id
      user_id
      project_id
      created_at
    }
  }
`;

fetch('https://api.bonus.band/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    query: mutation,
    variables: {
      projectId: PROJECT_ID,
      userId: USER_ID
    }
  })
})
.then(async r => {
  console.log('Status:', r.status);
  console.log('Headers:', Object.fromEntries(r.headers.entries()));
  
  const text = await r.text();
  console.log('Raw response:', text);
  
  try {
    const json = JSON.parse(text);
    console.log('Parsed response:', json);
    
    if (json.errors) {
      console.error('❌ GraphQL Errors:', json.errors);
    } else {
      console.log('✅ Success:', json.data);
    }
  } catch (e) {
    console.error('❌ Failed to parse JSON:', e);
  }
})
.catch(err => {
  console.error('❌ Network Error:', err);
});
```

## Шаг 6: Проверь Network tab

1. Открой вкладку Network в DevTools
2. Найди запрос к `/graphql`
3. Проверь:

### Request Headers:
```
Origin: https://admin.bonus.band
Content-Type: application/json
Cookie: (должны быть cookies)
```

### Response Headers:
```
Access-Control-Allow-Origin: https://admin.bonus.band
Access-Control-Allow-Credentials: true
```

### Response:
Если ошибка, посмотри что именно вернул сервер.

## Возможные ошибки и решения

### Ошибка: "Project not found"
- Проверь что PROJECT_ID правильный
- Проверь в базе: `SELECT * FROM projects WHERE id = 'PROJECT_ID'`

### Ошибка: "User not found"
- Проверь что USER_ID правильный
- Проверь в базе: `SELECT * FROM users WHERE id = 'USER_ID'`

### Ошибка: "Curator accepted status not found"
- Проверь в базе: `SELECT * FROM project_statuses WHERE slug = 'curator-processing'`
- Если нет, запусти seeder: `php artisan db:seed --class=ProjectStatusSeeder`

### Ошибка CORS
- Проверь что в ответе есть заголовок `Access-Control-Allow-Origin`
- Если нет, проверь nginx конфигурацию
- Проверь что Laravel CORS middleware активен

### Ошибка: Response is empty or "Unexpected token"
- Возможно nginx возвращает HTML страницу ошибки вместо JSON
- Проверь nginx error.log: `sudo tail -f /var/log/nginx/error.log`
- Проверь PHP-FPM error.log

## Шаг 7: Проверь логи на сервере

```bash
# Laravel logs
tail -f /path/to/b5-api-2/storage/logs/laravel.log | grep AcceptProject

# Nginx error log
sudo tail -f /var/log/nginx/error.log

# PHP-FPM log
sudo tail -f /var/log/php8.2-fpm.log
```
