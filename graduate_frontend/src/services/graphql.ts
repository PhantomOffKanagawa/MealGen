import { ApolloClient, InMemoryCache } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { split, HttpLink } from "@apollo/client/core";
import { getMainDefinition } from "@apollo/client/utilities";
import { v4 as uuidv4 } from "uuid";

// GraphQL endpoint URL, default to http://localhost:4000/graphql if not provided in environment variables
const endpoint =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:4000/graphql";
const ws_endpoint =
  process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT || "ws://localhost:4000/graphql";

// Generate a unique client ID for this browser session
export const CLIENT_ID = uuidv4();

// Create an HTTP Link instance for Apollo Client with headers
const httpLink = new HttpLink({
  uri: endpoint,
  credentials: "include",
});

// Create a WebSocket client instance for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: ws_endpoint,
    connectionParams: async () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
      return { token, clientId: CLIENT_ID };
    },
    on: {
      connected: () => console.log("WebSocket connected"),
      closed: () => console.log("WebSocket disconnected"),
      error: (err) => console.error("WebSocket error:", err),
    },
  }),
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink,
);

const graphqlClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  credentials: "include", // Include cookies in the request
  headers: {}, // Default headers
});

// Function to set the authentication token in the GraphQL client headers and localStorage
export const setAuthToken = (token: string | null) => {
  if (token) {
    // If a token is provided, set the Authorization header with the token
    graphqlClient.setLink(
      split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return (
            definition.kind === "OperationDefinition" &&
            definition.operation === "subscription"
          );
        },
        wsLink,
        new HttpLink({
          uri: endpoint,
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-client-id": CLIENT_ID,
          },
        }),
      ),
    );
    // If running in a browser environment, store the token in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  } else {
    // If no token is provided, remove the Authorization header
    graphqlClient.setLink(
      split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return (
            definition.kind === "OperationDefinition" &&
            definition.operation === "subscription"
          );
        },
        wsLink,
        new HttpLink({
          uri: endpoint,
          credentials: "include",
          headers: {},
        }),
      ),
    );
    // If running in a browser environment, remove the token from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }
};

// Initialize token from localStorage if available
if (typeof window !== "undefined") {
  // When running in a browser environment, check for a token in localStorage
  const token = localStorage.getItem("auth_token");
  if (token) {
    // If a token is found in localStorage, set it in the GraphQL client headers
    setAuthToken(token);
  }
}

export default graphqlClient;
