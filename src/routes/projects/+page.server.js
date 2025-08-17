import { gql, request } from 'graphql-request';

export const load = async () => {
	const query = gql`
		{
			projects {
				id
				value
				description
				created_at
			}
		}
	`;
	const data = await request(import.meta.env.VITE_B5_API_URL, query);
	console.log(data);

	return {
		projects: data.projects
	};
};
