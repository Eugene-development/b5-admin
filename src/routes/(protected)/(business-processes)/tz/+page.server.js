/**
 * Server-side load function for technical specifications page with httpOnly cookie authentication
 */

import { makeServerGraphQLRequest, categorizeError, getUserFriendlyErrorMessage } from '$lib/api/server.js';

const TZ_QUERY = `
	query GetTechnicalSpecifications($first: Int!, $page: Int) {
		technicalSpecifications(first: $first, page: $page) {
			data {
				id
				value
				project_id
				project {
					id
					project_number
					value
					region
					contract_name
					agent {
						id
						name
						email
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

async function loadTzData(token, fetch, hostname) {
	try {
		console.log('📊 TZ SSR: Starting data load...');
		const data = await makeServerGraphQLRequest(token, TZ_QUERY, { first: 1000, page: 1 }, fetch, hostname);
		const rawTzList = data.technicalSpecifications?.data || [];
		
		// Sort by created_at descending (newest first)
		const tzList = [...rawTzList].sort((a, b) => {
			const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
			const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
			return dateB - dateA;
		});
		
		console.log(`✅ TZ SSR: Loaded ${tzList.length} items`);
		return { tzList, error: null };
	} catch (error) {
		console.error('❌ TZ SSR: Failed:', error.message);
		return { tzList: [], error: { message: getUserFriendlyErrorMessage(categorizeError(error), error.message), canRetry: true } };
	}
}

export async function load({ locals, fetch, url }) {
	if (!locals?.user || !locals?.token) {
		return { tzData: { tzList: [], needsClientLoad: true } };
	}
	const tzData = await loadTzData(locals.token, fetch, url.hostname);
	return { tzData };
}
