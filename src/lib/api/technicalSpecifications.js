import { gql, request } from 'graphql-request';
import { handleAuthError } from '$lib/utils/authErrorHandler.js';
import { getGraphQLEndpoint } from '$lib/config/api.js';

// GraphQL queries and mutations
const TECHNICAL_SPECIFICATIONS_QUERY = gql`
	query GetTechnicalSpecifications($first: Int!, $page: Int) {
		technicalSpecifications(first: $first, page: $page) {
			data {
				id
				value
				project_id
				project {
					id
					value
					region
					contract_name
					project_number
					is_incognito
					agent {
						id
						name
						email
						phones {
							id
							value
							is_primary
						}
					}
					curator {
						id
						name
						email
						phones {
							id
							value
							is_primary
						}
					}
					projectUsers {
						id
						user_id
						project_id
						role
						user {
							id
							name
							email
							phones {
								id
								value
								is_primary
							}
						}
					}
					client {
						id
						name
						phones {
							id
							value
							is_primary
						}
					}
					sketches {
						id
						file_url
						file_name
						file_size
						mime_type
						description
						order
						created_at
					}
					offers {
						id
						file_url
						file_name
						file_size
						mime_type
						description
						amount
						valid_until
						order
						created_at
					}
				}
				description
				comment
				is_active
				requires_approval
				is_approved
				files {
					id
					file_type
					file_name
					file_path
					file_size
					mime_type
					uploaded_by
					uploader {
						id
						name
						email
					}
					created_at
					updated_at
				}
				sketches {
					id
					file_type
					file_name
					file_path
					file_size
					mime_type
					uploaded_by
					uploader {
						id
						name
						email
					}
					download_url
					created_at
					updated_at
				}
				commercialOffers {
					id
					file_type
					file_name
					file_path
					file_size
					mime_type
					uploaded_by
					uploader {
						id
						name
						email
					}
					download_url
					created_at
					updated_at
				}
				created_at
				updated_at
			}
			paginatorInfo {
				count
				currentPage
				firstItem
				hasMorePages
				lastItem
				lastPage
				perPage
				total
			}
		}
	}
`;

const CREATE_TECHNICAL_SPECIFICATION_MUTATION = gql`
	mutation CreateTechnicalSpecification($input: CreateTechnicalSpecificationInput!) {
		createTechnicalSpecification(input: $input) {
			id
			value
			project_id
			project {
				id
				value
				region
				contract_name
				agent {
					id
					name
					email
					phones {
						id
						value
						is_primary
					}
				}
			}
			description
			comment
			is_active
			requires_approval
			is_approved
			created_at
			updated_at
		}
	}
`;

const UPDATE_TECHNICAL_SPECIFICATION_MUTATION = gql`
	mutation UpdateTechnicalSpecification($input: UpdateTechnicalSpecificationInput!) {
		updateTechnicalSpecification(input: $input) {
			id
			value
			project_id
			project {
				id
				value
				region
				contract_name
				agent {
					id
					name
					email
					phones {
						id
						value
						is_primary
					}
				}
			}
			description
			comment
			is_active
			requires_approval
			is_approved
			created_at
			updated_at
		}
	}
`;

const DELETE_TECHNICAL_SPECIFICATION_MUTATION = gql`
	mutation DeleteTechnicalSpecification($id: ID!) {
		deleteTechnicalSpecification(id: $id) {
			id
		}
	}
`;

const UPLOAD_SKETCH_MUTATION = gql`
	mutation UploadProjectSketch($project_id: ID!, $file: Upload!) {
		uploadProjectSketch(project_id: $project_id, file: $file) {
			id
			project_id
			file_url
			file_name
			file_size
			mime_type
			description
			order
			created_at
		}
	}
`;

const UPLOAD_OFFER_MUTATION = gql`
	mutation UploadProjectOffer($project_id: ID!, $file: Upload!) {
		uploadProjectOffer(project_id: $project_id, file: $file) {
			id
			project_id
			file_url
			file_name
			file_size
			mime_type
			description
			amount
			valid_until
			order
			created_at
		}
	}
`;

const UPLOAD_TZ_FILE_MUTATION = gql`
	mutation UploadTzFile($input: UploadTzFileInput!) {
		uploadTzFile(input: $input) {
			id
			technical_specification_id
			file_type
			file_name
			file_path
			file_size
			mime_type
			uploaded_by
			uploader {
				id
				name
				email
			}
			created_at
			updated_at
		}
	}
`;

const DELETE_TZ_FILE_MUTATION = gql`
	mutation DeleteTzFile($input: DeleteTzFileInput!) {
		deleteTzFile(input: $input) {
			id
			file_name
		}
	}
`;

// Helper function to make GraphQL requests
async function makeGraphQLRequest(
	query,
	variables = {},
	operationName = 'GraphQL operation',
	retries = 3,
	customFetch = null,
	cookies = null
) {
	let lastError;

	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000);

			const fetchFunction =
				customFetch || (typeof window !== 'undefined' ? window.fetch : globalThis.fetch);

			const graphqlEndpoint = getGraphQLEndpoint();
			
			console.log('🔧 GraphQL Request Debug:', {
				operationName,
				endpoint: graphqlEndpoint,
				variables,
				timestamp: new Date().toISOString()
			});

			const headers = {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			};

			const response = await fetchFunction(graphqlEndpoint, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					query,
					variables
				}),
				signal: controller.signal,
				credentials: 'include'
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const result = await response.json();

			if (result.errors && result.errors.length > 0) {
				throw new Error(result.errors[0].message || 'GraphQL query failed');
			}

			return result.data;
		} catch (err) {
			lastError = err;
			console.error(`❌ GraphQL Error in ${operationName} (attempt ${attempt}/${retries}):`, err);

			if (!customFetch && handleAuthError(err, '/tz')) {
				throw err;
			}

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

// Function to get all technical specifications
export async function getTechnicalSpecifications(
	first = 1000,
	page = 1,
	customFetch = null,
	cookies = null
) {
	try {
		const variables = { first, page };
		const result = await makeGraphQLRequest(
			TECHNICAL_SPECIFICATIONS_QUERY,
			variables,
			'getTechnicalSpecifications',
			3,
			customFetch,
			cookies
		);
		return result.technicalSpecifications?.data || [];
	} catch (err) {
		console.error('Get technical specifications failed:', err);
		throw err;
	}
}

// Function to create a technical specification
export async function createTechnicalSpecification(tzData, customFetch = null, cookies = null) {
	try {
		const result = await makeGraphQLRequest(
			CREATE_TECHNICAL_SPECIFICATION_MUTATION,
			{ input: tzData },
			'createTechnicalSpecification',
			3,
			customFetch,
			cookies
		);
		return result.createTechnicalSpecification;
	} catch (err) {
		console.error('Create technical specification failed:', err);
		throw err;
	}
}

// Function to update a technical specification
export async function updateTechnicalSpecification(tzData, customFetch = null, cookies = null) {
	try {
		const result = await makeGraphQLRequest(
			UPDATE_TECHNICAL_SPECIFICATION_MUTATION,
			{ input: tzData },
			'updateTechnicalSpecification',
			3,
			customFetch,
			cookies
		);
		return result.updateTechnicalSpecification;
	} catch (err) {
		console.error('Update technical specification failed:', err);
		throw err;
	}
}

// Function to delete a technical specification
export async function deleteTechnicalSpecification(tzId, customFetch = null, cookies = null) {
	try {
		const result = await makeGraphQLRequest(
			DELETE_TECHNICAL_SPECIFICATION_MUTATION,
			{ id: tzId },
			'deleteTechnicalSpecification',
			3,
			customFetch,
			cookies
		);
		return result.deleteTechnicalSpecification;
	} catch (err) {
		console.error('Delete technical specification failed:', err);
		throw err;
	}
}

// Function to refresh technical specifications data
export async function refreshTechnicalSpecifications(
	first = 1000,
	page = 1,
	customFetch = null,
	cookies = null
) {
	try {
		const variables = { first, page };
		const result = await makeGraphQLRequest(
			TECHNICAL_SPECIFICATIONS_QUERY,
			variables,
			'refreshTechnicalSpecifications',
			3,
			customFetch,
			cookies
		);
		return result.technicalSpecifications?.data || [];
	} catch (err) {
		console.error('Refresh technical specifications failed:', err);
		throw err;
	}
}

// Function to upload sketch file
export async function uploadSketchFile(projectId, file) {
	try {
		const formData = new FormData();
		formData.append(
			'operations',
			JSON.stringify({
				query: UPLOAD_SKETCH_MUTATION,
				variables: { project_id: projectId, file: null }
			})
		);
		formData.append('map', JSON.stringify({ 0: ['variables.file'] }));
		formData.append('0', file);

		const graphqlEndpoint = getGraphQLEndpoint();
		const response = await fetch(graphqlEndpoint, {
			method: 'POST',
			body: formData,
			credentials: 'include'
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const result = await response.json();

		if (result.errors && result.errors.length > 0) {
			throw new Error(result.errors[0].message || 'Upload failed');
		}

		return result.data.uploadProjectSketch;
	} catch (err) {
		console.error('Upload sketch file failed:', err);
		throw err;
	}
}

// Function to upload offer file
export async function uploadOfferFile(projectId, file) {
	try {
		const formData = new FormData();
		formData.append(
			'operations',
			JSON.stringify({
				query: UPLOAD_OFFER_MUTATION,
				variables: { project_id: projectId, file: null }
			})
		);
		formData.append('map', JSON.stringify({ 0: ['variables.file'] }));
		formData.append('0', file);

		const graphqlEndpoint = getGraphQLEndpoint();
		const response = await fetch(graphqlEndpoint, {
			method: 'POST',
			body: formData,
			credentials: 'include'
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const result = await response.json();

		if (result.errors && result.errors.length > 0) {
			throw new Error(result.errors[0].message || 'Upload failed');
		}

		return result.data.uploadProjectOffer;
	} catch (err) {
		console.error('Upload offer file failed:', err);
		throw err;
	}
}

// Function to upload file to technical specification
export async function uploadTzFile(tzId, fileType, file) {
	try {
		console.log('🔧 Uploading TZ file:', {
			tzId,
			fileType,
			fileName: file.name,
			fileSize: file.size,
			mimeType: file.type
		});

		const formData = new FormData();
		formData.append(
			'operations',
			JSON.stringify({
				query: UPLOAD_TZ_FILE_MUTATION,
				variables: { 
					input: { 
						technical_specification_id: tzId, 
						file_type: fileType, 
						file: null 
					} 
				}
			})
		);
		formData.append('map', JSON.stringify({ 0: ['variables.input.file'] }));
		formData.append('0', file);

		const graphqlEndpoint = getGraphQLEndpoint();
		const response = await fetch(graphqlEndpoint, {
			method: 'POST',
			body: formData,
			credentials: 'include'
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ HTTP Error:', response.status, errorText);
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const result = await response.json();

		if (result.errors && result.errors.length > 0) {
			console.error('❌ GraphQL Error:', result.errors);
			throw new Error(result.errors[0].message || 'Upload failed');
		}

		console.log('✅ Upload successful:', result.data.uploadTzFile);
		return result.data.uploadTzFile;
	} catch (err) {
		console.error('❌ Upload TZ file failed:', err);
		throw err;
	}
}

// Function to delete technical specification file
export async function deleteTzFile(fileId) {
	try {
		const result = await makeGraphQLRequest(
			DELETE_TZ_FILE_MUTATION,
			{ input: { id: fileId } },
			'deleteTzFile',
			3
		);
		return result.deleteTzFile;
	} catch (err) {
		console.error('Delete TZ file failed:', err);
		throw err;
	}
}

/**
 * Factory function to create API client with server-side fetch support
 */
export function createTechnicalSpecificationsApiWithFetch(fetch, cookies) {
	return {
		getTechnicalSpecifications: (first, page) =>
			getTechnicalSpecifications(first, page, fetch, cookies),
		createTechnicalSpecification: (tzData) => createTechnicalSpecification(tzData, fetch, cookies),
		updateTechnicalSpecification: (tzData) => updateTechnicalSpecification(tzData, fetch, cookies),
		deleteTechnicalSpecification: (tzId) => deleteTechnicalSpecification(tzId, fetch, cookies),
		refreshTechnicalSpecifications: (first, page) =>
			refreshTechnicalSpecifications(first, page, fetch, cookies)
	};
}
