import { refreshActions, getCompaniesForActions } from '$lib/api/actions.js';

/** @type {import('./$types').PageLoad} */
export async function load() {
	try {
		const [actionsData, companies] = await Promise.all([
			refreshActions(),
			getCompaniesForActions()
		]);
		
		// Transform actions data to match table format
		const actions = actionsData.map(action => ({
			id: action.id,
			company_name: action.company?.name || 'Не указано',
			action_name: action.name,
			phone: action.company?.phone || '',
			contact_person: action.company?.contact_person || '',
			region: action.company?.region || 'Не указан',
			start_date: action.start,
			end_date: action.end,
			description: action.description,
			comment: action.is_active ? 'Акция активна' : 'Акция неактивна',
			is_active: action.is_active,
			company_id: action.company_id,
			created_at: action.created_at,
			updated_at: action.updated_at,
			// Keep original data for editing
			_original: action
		}));
		
		return { actions, companies };
	} catch (error) {
		console.error('Failed to load actions page data:', error);
		// Return empty arrays on error
		return {
			actions: [],
			companies: [],
			error: { 
				message: 'Не удалось загрузить данные с сервера. Проверьте подключение к API.' 
			}
		};
	}
}