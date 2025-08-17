// import { gql, request } from 'graphql-request';

// export const load = async () => {
// 	const query = gql`
// 		query {
// 			users {
// 				id
// 				city
// 			}
// 		}
// 	`;

// 	const variables = {};

// 	const data = await request(process.env.B5_API_URL, query, variables);
// 	console.log(data);

// 	return {
// 		agents: data.users
// 	};
// };

import { gql, request } from 'graphql-request';

export const load = async () => {
	const query = gql`
		{
			users {
				id
				city
			}
		}
	`;
	const data = await request(import.meta.env.VITE_B5_API_URL, query);

	return {
		agents: data.users
	};
};
