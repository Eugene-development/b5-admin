// Скопируй этот код в Console браузера на admin.bonus.band
// Это поможет понять что именно не работает

console.log('=== DEBUG: Accept Project ===');

// 1. Проверь что пользователь залогинен
const authData = localStorage.getItem('auth');
if (authData) {
	const auth = JSON.parse(authData);
	console.log('✅ User logged in:', auth.user);
	console.log('User ID:', auth.user?.id);
} else {
	console.error('❌ User not logged in!');
}

// 2. Тест простого GraphQL запроса
console.log('\n--- Test 1: Simple Query ---');
fetch('https://api.bonus.band/graphql', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json'
	},
	credentials: 'include',
	body: JSON.stringify({
		query: '{ __typename }'
	})
})
	.then((r) => {
		console.log('Status:', r.status);
		console.log('CORS Headers:', {
			'Access-Control-Allow-Origin': r.headers.get('Access-Control-Allow-Origin'),
			'Access-Control-Allow-Credentials': r.headers.get('Access-Control-Allow-Credentials')
		});
		return r.json();
	})
	.then((data) => console.log('✅ Simple query works:', data))
	.catch((err) => console.error('❌ Simple query failed:', err));

// 3. Тест updateProject (который работает)
console.log('\n--- Test 2: UpdateProject Mutation (working) ---');

// Найди ID первого проекта на странице
const projectElement = document.querySelector('[data-project-id]');
const testProjectId = projectElement?.getAttribute('data-project-id');

if (testProjectId) {
	console.log('Testing with project ID:', testProjectId);

	fetch('https://api.bonus.band/graphql', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json'
		},
		credentials: 'include',
		body: JSON.stringify({
			query: `
                mutation UpdateProject($input: UpdateProjectInput!) {
                    updateProject(input: $input) {
                        id
                        value
                        status_id
                    }
                }
            `,
			variables: {
				input: {
					id: testProjectId,
					description: 'Test update ' + new Date().toISOString()
				}
			}
		})
	})
		.then((r) => {
			console.log('UpdateProject Status:', r.status);
			return r.json();
		})
		.then((data) => {
			if (data.errors) {
				console.error('❌ UpdateProject errors:', data.errors);
			} else {
				console.log('✅ UpdateProject works:', data.data);
			}
		})
		.catch((err) => console.error('❌ UpdateProject failed:', err));
} else {
	console.warn('⚠️ No project found on page to test');
}

// 4. Тест acceptProject (который НЕ работает)
setTimeout(() => {
	console.log('\n--- Test 3: AcceptProject Mutation (NOT working) ---');

	const authData = localStorage.getItem('auth');
	const auth = JSON.parse(authData);
	const userId = auth?.user?.id;

	if (!testProjectId || !userId) {
		console.error('❌ Missing project ID or user ID');
		return;
	}

	console.log('Testing acceptProject with:', { projectId: testProjectId, userId });

	fetch('https://api.bonus.band/graphql', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json'
		},
		credentials: 'include',
		body: JSON.stringify({
			query: `
                mutation AcceptProject($projectId: ID!, $userId: ID!) {
                    acceptProject(projectId: $projectId, userId: $userId) {
                        id
                        user_id
                        project_id
                        created_at
                    }
                }
            `,
			variables: {
				projectId: testProjectId,
				userId: userId
			}
		})
	})
		.then(async (r) => {
			console.log('AcceptProject Status:', r.status);
			console.log('AcceptProject Headers:', Object.fromEntries(r.headers.entries()));

			const text = await r.text();
			console.log('Raw response:', text);

			try {
				const json = JSON.parse(text);
				if (json.errors) {
					console.error('❌ AcceptProject GraphQL errors:', json.errors);
				} else {
					console.log('✅ AcceptProject works:', json.data);
				}
			} catch (e) {
				console.error('❌ Failed to parse JSON:', e);
			}
		})
		.catch((err) => {
			console.error('❌ AcceptProject network error:', err);
			console.error('Error details:', {
				message: err.message,
				stack: err.stack
			});
		});
}, 2000);

console.log('\n=== Tests started, check results above ===');
