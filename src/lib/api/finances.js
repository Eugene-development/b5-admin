import { gql } from 'graphql-request';
import { GRAPHQL_ENDPOINT } from '$lib/config/api.js';
import { handleApiError } from '$lib/utils/toastStore.js';

// GraphQL queries and mutations

const PARTNER_PAYMENT_STATUSES_QUERY = gql`
	query GetPartnerPaymentStatuses {
		partnerPaymentStatuses {
			id
			code
			name
			description
		}
	}
`;

const ADMIN_BONUSES_QUERY = gql`
	query GetAdminBonuses($filters: AgentBonusFilters) {
		adminBonuses(filters: $filters) {
			id
			agent_id
			contract_id
			order_id
			commission_amount
			accrued_at
			available_at
			paid_at
			source_type
			source_amount
			project_name
			status {
				id
				code
				name
			}
			contract {
				id
				contract_number
				contract_amount
			}
			order {
				id
				order_number
				order_amount
			}
			agent {
				id
				name
				email
			}
		}
	}
`;

const ADMIN_BONUS_STATS_QUERY = gql`
	query GetAdminBonusStats($filters: AgentBonusFilters) {
		adminBonusStats(filters: $filters) {
			total_accrued
			total_available
			total_paid
			total_pending
			contracts_count
			orders_count
		}
	}
`;

const UPDATE_BONUS_STATUS_MUTATION = gql`
	mutation UpdateBonusStatus($bonus_id: ID!, $status_code: String!) {
		updateBonusStatus(bonus_id: $bonus_id, status_code: $status_code) {
			id
			status {
				id
				code
				name
			}
			paid_at
		}
	}
`;

const PAYMENT_STATUSES_QUERY = gql`
	query GetPaymentStatuses {
		paymentStatuses {
			id
			code
			name
			description
		}
	}
`;

const PAYMENT_METHODS_QUERY = gql`
	query GetPaymentMethods {
		paymentMethods {
			id
			code
			name
			description
		}
	}
`;

const BONUS_STATUSES_QUERY = gql`
	query GetBonusStatuses {
		bonusStatuses {
			id
			code
			name
			description
		}
	}
`;

const AVAILABLE_BONUSES_QUERY = gql`
	query GetAvailableBonusesForPayment($agent_id: ID!) {
		availableBonusesForPayment(agent_id: $agent_id) {
			id
			agent_id
			contract_id
			order_id
			commission_amount
			accrued_at
			available_at
			source_type
			source_amount
			project_name
			status {
				id
				code
				name
			}
			contract {
				id
				contract_number
				contract_amount
			}
			order {
				id
				order_number
				order_amount
			}
		}
	}
`;

const AGENT_PAYMENTS_QUERY = gql`
	query GetAgentPaymentsAdmin($agent_id: ID, $filters: AgentPaymentFilters) {
		agentPaymentsAdmin(agent_id: $agent_id, filters: $filters) {
			id
			agent_id
			total_amount
			payment_date
			reference_number
			created_at
			updated_at
			agent {
				id
				name
				email
			}
			status {
				id
				code
				name
			}
			method {
				id
				code
				name
			}
			bonuses {
				id
				commission_amount
				source_type
				project_name
			}
		}
	}
`;

const AGENTS_WITH_BONUSES_QUERY = gql`
	query GetAgentsWithAvailableBonuses {
		agentsWithAvailableBonuses {
			id
			name
			email
			available_bonuses_count
			available_bonuses_total
		}
	}
`;

const CREATE_AGENT_PAYMENT_MUTATION = gql`
	mutation CreateAgentPayment($input: CreateAgentPaymentInput!) {
		createAgentPayment(input: $input) {
			id
			agent_id
			total_amount
			payment_date
			reference_number
			status {
				id
				code
				name
			}
			method {
				id
				code
				name
			}
			bonuses {
				id
				commission_amount
			}
		}
	}
`;

const UPDATE_PAYMENT_STATUS_MUTATION = gql`
	mutation UpdatePaymentStatus($payment_id: ID!, $status_code: String!) {
		updatePaymentStatus(payment_id: $payment_id, status_code: $status_code) {
			id
			status {
				id
				code
				name
			}
		}
	}
`;

const UPDATE_CONTRACT_PARTNER_PAYMENT_STATUS_MUTATION = gql`
	mutation UpdateContractPartnerPaymentStatus($contract_id: ID!, $status_code: String!) {
		updateContractPartnerPaymentStatus(contract_id: $contract_id, status_code: $status_code) {
			id
		}
	}
`;

const UPDATE_ORDER_PARTNER_PAYMENT_STATUS_MUTATION = gql`
	mutation UpdateOrderPartnerPaymentStatus($order_id: ID!, $status_code: String!) {
		updateOrderPartnerPaymentStatus(order_id: $order_id, status_code: $status_code) {
			id
		}
	}
`;

// Helper function to make GraphQL requests
async function makeGraphQLRequest(
	query,
	variables = {},
	operationName = 'GraphQL operation',
	retries = 3,
	customFetch = null
) {
	let lastError;

	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000);

			const fetchFunction =
				customFetch || (typeof window !== 'undefined' ? window.fetch : globalThis.fetch);

			const headers = {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			};

			const response = await fetchFunction(GRAPHQL_ENDPOINT, {
				method: 'POST',
				headers,
				body: JSON.stringify({ query, variables }),
				signal: controller.signal,
				credentials: 'include'
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const result = await response.json();

			if (result.errors && result.errors.length > 0) {
				console.error(`GraphQL errors in ${operationName}:`, result.errors);
				throw new Error(result.errors[0].message || 'GraphQL query failed');
			}

			if (!result.data) {
				throw new Error('No data returned from GraphQL query');
			}

			return result.data;
		} catch (err) {
			lastError = err;
			console.error(`❌ GraphQL Error in ${operationName} (attempt ${attempt}/${retries}):`, {
				error: err.message
			});

			if (err.response?.status === 403) {
				throw err;
			}

			if (attempt === retries) {
				throw err;
			}

			const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError;
}

// API Functions

export async function getPartnerPaymentStatuses(customFetch = null) {
	try {
		const result = await makeGraphQLRequest(
			PARTNER_PAYMENT_STATUSES_QUERY,
			{},
			'getPartnerPaymentStatuses',
			3,
			customFetch
		);
		return result.partnerPaymentStatuses || [];
	} catch (err) {
		handleApiError(err, 'Не удалось загрузить статусы оплаты');
		throw err;
	}
}

export async function getPaymentStatuses(customFetch = null) {
	try {
		const result = await makeGraphQLRequest(
			PAYMENT_STATUSES_QUERY,
			{},
			'getPaymentStatuses',
			3,
			customFetch
		);
		return result.paymentStatuses || [];
	} catch (err) {
		handleApiError(err, 'Не удалось загрузить статусы выплат');
		throw err;
	}
}

export async function getPaymentMethods(customFetch = null) {
	try {
		const result = await makeGraphQLRequest(
			PAYMENT_METHODS_QUERY,
			{},
			'getPaymentMethods',
			3,
			customFetch
		);
		return result.paymentMethods || [];
	} catch (err) {
		handleApiError(err, 'Не удалось загрузить способы выплат');
		throw err;
	}
}

export async function getBonusStatuses(customFetch = null) {
	try {
		const result = await makeGraphQLRequest(
			BONUS_STATUSES_QUERY,
			{},
			'getBonusStatuses',
			3,
			customFetch
		);
		return result.bonusStatuses || [];
	} catch (err) {
		handleApiError(err, 'Не удалось загрузить статусы бонусов');
		throw err;
	}
}

export async function getAvailableBonusesForPayment(agentId, customFetch = null) {
	try {
		const result = await makeGraphQLRequest(
			AVAILABLE_BONUSES_QUERY,
			{ agent_id: agentId },
			'getAvailableBonusesForPayment',
			3,
			customFetch
		);
		return result.availableBonusesForPayment || [];
	} catch (err) {
		handleApiError(err, 'Не удалось загрузить доступные бонусы');
		throw err;
	}
}

export async function getAgentPaymentsAdmin(agentId = null, filters = null, customFetch = null) {
	try {
		const variables = {};
		if (agentId) variables.agent_id = agentId;
		if (filters) variables.filters = filters;

		const result = await makeGraphQLRequest(
			AGENT_PAYMENTS_QUERY,
			variables,
			'getAgentPaymentsAdmin',
			3,
			customFetch
		);
		return result.agentPaymentsAdmin || [];
	} catch (err) {
		handleApiError(err, 'Не удалось загрузить выплаты');
		throw err;
	}
}

export async function getAgentsWithAvailableBonuses(customFetch = null) {
	try {
		const result = await makeGraphQLRequest(
			AGENTS_WITH_BONUSES_QUERY,
			{},
			'getAgentsWithAvailableBonuses',
			3,
			customFetch
		);
		return result.agentsWithAvailableBonuses || [];
	} catch (err) {
		handleApiError(err, 'Не удалось загрузить список агентов');
		throw err;
	}
}

export async function createAgentPayment(input, customFetch = null) {
	try {
		const result = await makeGraphQLRequest(
			CREATE_AGENT_PAYMENT_MUTATION,
			{ input },
			'createAgentPayment',
			3,
			customFetch
		);
		return result.createAgentPayment;
	} catch (err) {
		handleApiError(err, 'Не удалось создать выплату');
		throw err;
	}
}

export async function updatePaymentStatus(paymentId, statusCode, customFetch = null) {
	try {
		const result = await makeGraphQLRequest(
			UPDATE_PAYMENT_STATUS_MUTATION,
			{ payment_id: paymentId, status_code: statusCode },
			'updatePaymentStatus',
			3,
			customFetch
		);
		return result.updatePaymentStatus;
	} catch (err) {
		handleApiError(err, 'Не удалось обновить статус выплаты');
		throw err;
	}
}

export async function updateContractPartnerPaymentStatus(contractId, statusCode, customFetch = null) {
	try {
		const result = await makeGraphQLRequest(
			UPDATE_CONTRACT_PARTNER_PAYMENT_STATUS_MUTATION,
			{ contract_id: contractId, status_code: statusCode },
			'updateContractPartnerPaymentStatus',
			3,
			customFetch
		);
		return result.updateContractPartnerPaymentStatus;
	} catch (err) {
		handleApiError(err, 'Не удалось обновить статус оплаты договора');
		throw err;
	}
}

export async function updateOrderPartnerPaymentStatus(orderId, statusCode, customFetch = null) {
	try {
		const result = await makeGraphQLRequest(
			UPDATE_ORDER_PARTNER_PAYMENT_STATUS_MUTATION,
			{ order_id: orderId, status_code: statusCode },
			'updateOrderPartnerPaymentStatus',
			3,
			customFetch
		);
		return result.updateOrderPartnerPaymentStatus;
	} catch (err) {
		handleApiError(err, 'Не удалось обновить статус оплаты закупки');
		throw err;
	}
}

export async function getAdminBonuses(filters = null, customFetch = null) {
	try {
		const variables = {};
		if (filters) variables.filters = filters;

		const result = await makeGraphQLRequest(
			ADMIN_BONUSES_QUERY,
			variables,
			'getAdminBonuses',
			3,
			customFetch
		);
		return result.adminBonuses || [];
	} catch (err) {
		handleApiError(err, 'Не удалось загрузить бонусы');
		throw err;
	}
}

export async function getAdminBonusStats(filters = null, customFetch = null) {
	try {
		const variables = {};
		if (filters) variables.filters = filters;

		const result = await makeGraphQLRequest(
			ADMIN_BONUS_STATS_QUERY,
			variables,
			'getAdminBonusStats',
			3,
			customFetch
		);
		return result.adminBonusStats || {
			total_accrued: 0,
			total_available: 0,
			total_paid: 0,
			total_pending: 0,
			contracts_count: 0,
			orders_count: 0
		};
	} catch (err) {
		handleApiError(err, 'Не удалось загрузить статистику');
		throw err;
	}
}

export async function updateBonusStatus(bonusId, statusCode, customFetch = null) {
	try {
		const result = await makeGraphQLRequest(
			UPDATE_BONUS_STATUS_MUTATION,
			{ bonus_id: bonusId, status_code: statusCode },
			'updateBonusStatus',
			3,
			customFetch
		);
		return result.updateBonusStatus;
	} catch (err) {
		handleApiError(err, 'Не удалось обновить статус бонуса');
		throw err;
	}
}

// Factory function for server-side fetch support
export function createFinancesApiWithFetch(fetch, cookies) {
	return {
		getPartnerPaymentStatuses: () => getPartnerPaymentStatuses(fetch),
		getPaymentStatuses: () => getPaymentStatuses(fetch),
		getPaymentMethods: () => getPaymentMethods(fetch),
		getBonusStatuses: () => getBonusStatuses(fetch),
		getAvailableBonusesForPayment: (agentId) => getAvailableBonusesForPayment(agentId, fetch),
		getAgentPaymentsAdmin: (agentId, filters) => getAgentPaymentsAdmin(agentId, filters, fetch),
		getAgentsWithAvailableBonuses: () => getAgentsWithAvailableBonuses(fetch),
		createAgentPayment: (input) => createAgentPayment(input, fetch),
		updatePaymentStatus: (paymentId, statusCode) => updatePaymentStatus(paymentId, statusCode, fetch),
		updateContractPartnerPaymentStatus: (contractId, statusCode) =>
			updateContractPartnerPaymentStatus(contractId, statusCode, fetch),
		updateOrderPartnerPaymentStatus: (orderId, statusCode) =>
			updateOrderPartnerPaymentStatus(orderId, statusCode, fetch),
		getAdminBonuses: (filters) => getAdminBonuses(filters, fetch),
		getAdminBonusStats: (filters) => getAdminBonusStats(filters, fetch),
		updateBonusStatus: (bonusId, statusCode) => updateBonusStatus(bonusId, statusCode, fetch)
	};
}
