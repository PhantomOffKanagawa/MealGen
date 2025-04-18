# State Management

This document explains how state is managed in the MealGen application.

## Overview

MealGen uses a hybrid approach to state management, combining React's Context API with Apollo Client's cache for GraphQL data. This approach provides a clean, efficient way to handle both application state and server data.

## React Context API

The application uses React Context API for managing application-wide state that isn't tied directly to server data, such as:

- Authentication state
- UI state (modals, alerts, etc.)
- User preferences

### Authentication Context

The primary context in the application is the AuthContext, which manages user authentication state:

```typescript
interface AuthContextType {
    user: User | null; // Current user data, null if not logged in
    loading: boolean; // Indicates if the authentication state is being loaded
    login: (email: string, password: string) => Promise<void>; // Function to log in a user
    register: (name: string, email: string, password: string, age?: number) => Promise<void>; // Function to register a new user
    logout: () => void; // Function to log out the current user
    error: string | null; // Stores any error messages related to authentication
}

// Create the AuthContext with a default value of undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);
```

The AuthContext provides:

- Current user information
- Loading state
- Authentication methods (login, logout, register)

Components can consume this context using the `useAuth` hook:

```typescript
const { user, login, logout } = useAuth();
```

## Apollo Client Cache

For server data management, MealGen relies on Apollo Client's built-in caching system, which provides:

- Automatic caching of query results
- Normalized data storage
- Automatic updates on mutations
- Optimistic UI updates

> [!NOTE]
> This is not always ideal as it is sometimes overly agressive with caching, especially with optimistic updates. It is important to understand how Apollo Client's cache works to avoid unexpected behavior. If you need to bypass the cache for a specific query, you can use the `fetchPolicy` option in your queries.
> For example: `fetchPolicy: 'network-only'` will always fetch data from the server, bypassing the cache.

### Apollo Client Setup

The Apollo Client is configured in `src/services/graphql.ts`:

```typescript
const graphqlClient = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
    credentials: 'include', // Include cookies in the request
    headers: {}, // Default headers
});
```

### Data Fetching and Mutations

Components use a combination of Apollo hooks and Service files to interact with data:

- `useSubscription` - Subscribe to real-time updates
- `getAllIngredients` - Fetch all ingredients (using `graphqlClient.query`)

> [!NOTE]
> The use of both Apollo hooks and Service files is an artifact of the development process. The Service files were initially used for all data fetching, but as the application grew, it became more efficient to use Apollo hooks directly in components for certain operations. \
> Future development would likely favor one approach over the other for consistency.

#### Example:

```typescript
const response = await graphqlClient.query({
    query: GET_ALL_INGREDIENTS_QUERY,
    variables: {
    filter: { userId: user?._id || '' },
    },
    fetchPolicy: 'no-cache',
});

// Set up subscription for real-time ingredient updates
useSubscription(INGREDIENT_UPDATED, {
// Explicitly provide the client instance
client: graphqlClient,
// Need users ID to subscribe to updates
skip: !user?._id,
// Pass the user ID to the subscription
variables: { userId: user?._id },
// On receiving data from the subscription
onData: ({ data }) => {
    // Get the updated ingredient from the subscription data
    const { ingredientUpdated } = data?.data || {};

    // Ensure ingredientUpdated is defined and update wasn't from this window
    if (ingredientUpdated && ingredientUpdated.sourceClientId !== CLIENT_ID) {
    // Log the received update for debugging
    console.log("Received ingredient update from server:", ingredientUpdated);

    // Fetch the latest ingredients data after receiving an update
    fetchIngredients();

    // Show a snackbar notification to the user
    setSnackbar({
        open: true,
        message: "Ingredient data was updated",
        severity: "info",
    });
    }
},
});
```

## Key Takeaways

The state management approach in MealGen demonstrates:

1. **Separation of Concerns** - Using different tools for different state management needs
2. **Context API Best Practices** - How to structure contexts for application-wide state
3. **GraphQL Client-Side Caching** - Leveraging Apollo's powerful cache for data management
4. **Optimistic UI Updates** - Providing instant feedback while waiting for server responses
5. **Real-time Data with GraphQL Subscriptions** - Implementing live updates in a React application

This hybrid approach balances simplicity with power, making the application responsive while keeping the codebase maintainable.
