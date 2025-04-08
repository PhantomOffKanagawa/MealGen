import { GraphQLClient } from 'graphql-request';

// GraphQL endpoint URL, default to http://localhost:4000/graphql if not provided in environment variables
const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';

// Create a GraphQL client instance with the endpoint and default options
const graphqlClient = new GraphQLClient(endpoint, {
    credentials: 'include', // Include cookies in the request
    headers: {}, // Default headers
});

// Function to set the authentication token in the GraphQL client headers and localStorage
export const setAuthToken = (token: string | null) => {
    if (token) {
        // If a token is provided, set the Authorization header with the token
        graphqlClient.setHeader('Authorization', `Bearer ${token}`);
        // If running in a browser environment, store the token in localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token);
        }
    } else {
        // If no token is provided, remove the Authorization header
        graphqlClient.setHeader('Authorization', '');
        // If running in a browser environment, remove the token from localStorage
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
        }
    }
};

// Initialize token from localStorage if available
if (typeof window !== 'undefined') {
    // When running in a browser environment, check for a token in localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
        // If a token is found in localStorage, set it in the GraphQL client headers
        setAuthToken(token);
    }
}

export default graphqlClient;
