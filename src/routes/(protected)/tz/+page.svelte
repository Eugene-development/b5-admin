<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import DomainAccessInfo from '$lib/components/DomainAccessInfo.svelte';

	let currentDomain = '';
	let fullUrl = '';

	onMount(() => {
		currentDomain = window.location.hostname;
		fullUrl = window.location.href;
	});
</script>

<svelte:head>
	<title>Техзадания - B5 Admin</title>
	<meta name="description" content="Управление техническими заданиями" />
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-4xl">
		<div class="rounded-lg bg-white p-8 shadow-lg">
			<div class="mb-8 text-center">
				<h1 class="mb-4 text-4xl font-bold text-gray-900">Техзадания</h1>
				<p class="text-lg text-gray-600">Управление техническими заданиями и спецификациями</p>
			</div>

			<div class="grid gap-6 md:grid-cols-2">
				<div class="rounded-lg bg-blue-50 p-6">
					<h2 class="mb-3 text-xl font-semibold text-blue-900">Информация о доступе</h2>
					<div class="space-y-2 text-blue-800">
						<p><strong>Текущий домен:</strong> {currentDomain}</p>
						<p><strong>Полный URL:</strong> {fullUrl}</p>
						<p><strong>Доступ для:</strong> rubonus.info, bonus.band, admin.bonus.band</p>
					</div>
				</div>

				<div class="rounded-lg bg-green-50 p-6">
					<h2 class="mb-3 text-xl font-semibold text-green-900">Функциональность</h2>
					<div class="space-y-2 text-green-800">
						<div class="flex items-center">
							<span class="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
							<span>Создание ТЗ</span>
						</div>
						<div class="flex items-center">
							<span class="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
							<span>Редактирование требований</span>
						</div>
						<div class="flex items-center">
							<span class="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
							<span>Контроль выполнения</span>
						</div>
					</div>
				</div>
			</div>

			<div class="mt-8 rounded-lg bg-gray-50 p-6">
				<h2 class="mb-3 text-xl font-semibold text-gray-900">Описание</h2>
				<p class="text-gray-700">
					Страница предназначена для создания, редактирования и управления техническими заданиями.
					Здесь можно определить требования к проектам, создать спецификации и контролировать их
					выполнение. Доступна для пользователей доменов rubonus.info, bonus.band и
					admin.bonus.band.
				</p>
			</div>

			<div class="mt-8">
				<h2 class="mb-3 text-xl font-semibold text-gray-900">Статус доступа к домену</h2>
				<DomainAccessInfo showDetails={true} />
			</div>

			<div class="mt-8 text-center">
				<p class="text-sm text-gray-500">
					Страница загружена: {new Date().toLocaleString()}
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	:global(body) {
		font-family:
			'Inter',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			sans-serif;
	}
</style>
