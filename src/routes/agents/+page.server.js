import { gql, request } from 'graphql-request';

export const load = async () => {
	const query = gql`
		{
			users {
				id
				city
				name
				email
				email_verified_at
				created_at
				updated_at
			}
		}
	`;
	try {
		const data = await request(import.meta.env.VITE_B5_API_URL, query);
		
		return {
			agents: data.users || []
		};
	} catch (error) {
		console.error('GraphQL Error:', error);
		return {
			agents: []
		};
	}
};
