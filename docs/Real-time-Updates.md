# Real-time Updates System

This document explains the implementation of real-time data synchronization in MealGen using GraphQL subscriptions, allowing users to receive instant updates when data changes.

## Overview

The real-time update system enables multiple clients to stay synchronized with the latest data without requiring manual refreshing. When one client makes a change to the data (create, update, or delete operations), other clients are automatically notified of these changes.

The system is particularly useful for:

- Collaborative meal planning scenarios
- Multi-device access to the same account
- Keeping data consistent across different views of the application

## Architecture

The real-time update system uses the following components:

1. **GraphQL Subscriptions**: For real-time communication between server and clients
2. **PubSub Mechanism**: For publishing and subscribing to events
3. **WebSockets**: As the transport layer for subscription data
4. **User-Specific Channels**: To ensure users only receive updates for their own data
5. **Client Identification**: To prevent duplicate updates from self-triggered events

```
╭───────────╮       ╭───────────────╮      ╭───────────╮
│ Client A  │       │ Apollo Server │      │ Client B  │
│ (Browser) │       │ (Node.js)     │      │ (Browser) │
╰───────────╯       ╰───────────────╯      ╰───────────╯
      │                     │                    │      
      │ 1. Mutation Request │                    │      
      │ ──────────────────► │                    │      
      │                     │  2. Database       │      
      │                     │     Update         │      
      │                     │ ─────────┐         │      
      │                     │          │         │      
      │                     │ ◄────────┘         │      
      │ 3. Response         │                    │      
      │ ◄────────────────── │                    │      
      │                     │                    │      
      │                     │                    │      
      │  4. Publish Event   │  4. Publish Event  │      
      │   \/  ◄──────────── │ ─────────────────► │      
      │   /\     Ignored    │                    │      
      │                     │                    │      
      │                     │                    │      
      │                     │                    │      
```

## Backend Implementation

### 1. PubSub Setup

The PubSub system is set up using the GraphQL subscriptions PubSub implementation:

```javascript
// utils/pubsub.js
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();
module.exports = pubsub;
```

### 2. Wrapper for Publishing Events

A wrapper function is created to automatically publish events when mutations occur:

> [!NOTE]
> currentUserId is assumed to be available in the context, and the user ID is passed as an argument to the mutation. accessedUserId is extracted from the mutation or query arguments. As accessedUserId can be in a number of places, we use optional chaining to safely access it.

> [!NOTE]
> Checks user access via `currentUserId` and `accessedUserId` to ensure that users can only access their own data. The `dev` user is allowed to access all data.

> [!NOTE]
> Also passes back the `sourceClientId` to the client so that it can ignore its own updates.

> [!IMPORTANT]
> Hardcodes the return data. Solutions include adding new types or using the `record` field in the payload. This is a temporary solution until a better one is implemented.

```javascript
// customOptions.js
const wrapMutationAndPublish = (resolver, eventName) => {
  return resolver.wrapResolve((next) => async (rp) => {
    // rp = resolveParams = { source, args, context, info }
    const { context } = rp;

    // Only allow user to get their own data (or dev user)
    const currentUserId = context.user?.id; // Safely access user ID from context
    const accessedUserId =
      rp.args?.userId || rp.args?.filter?.userId || rp.args?.record?.userId;

    // Allow 'dev' user unconditionally, otherwise check ownership
    if (currentUserId !== "dev") {
      // Check if the current user ID matches any potential target user ID using optional chaining
      const isOwner = currentUserId === accessedUserId;

      // If the current user doesn't match any relevant ID, deny access
      if (!isOwner) {
        throw new Error(
          "Unauthorized access: You can only access or modify your own data."
        );
      }
    }

    // Extract clientId from request headers
    // The exact path to headers might depend on how the context is constructed in your GraphQL server setup.
    // Common paths include context.req.headers or context.headers
    let sourceClientId = rp.context.req.headers["x-client-id"] || null;

    // Call the original resolver
    const payload = await next(rp);

    // After successful mutation, publish the event
    // Ensure payload and record exist, and userId is present for topic targeting
    if (payload && accessedUserId) {
      const topic = `${eventName}.${accessedUserId}`;      // Publish the event with the record and the sourceClientId
      pubsub.publish(topic, {
        // The subscription payload depends on the event type
        // TODO: Add more event types as needed (currently doesn't use this info so not needed)
        ...(eventName === 'INGREDIENT_UPDATED' 
          ? { ingredientUpdated: payload.record } 
          : { mealUpdated: payload.record }),
        sourceClientId: sourceClientId, // Pass the originating client's ID
      });
    } else if (payload && payload.record && !accessedUserId) {
      // Log a warning if userId is missing, as the event cannot be targeted correctly
      console.warn(
        `Mutation ${resolver.name} completed, but userId is missing on the record. Cannot publish event.`
      );
    }

    return payload;
  });
};
```

### 3. Applying Wrappers to Mutations

The wrapper is applied to all relevant mutations:

> [!TIP]
> This was originally done through middleware on the mongoDB model, but was moved to the GraphQL layer for better control and flexibility. Namely to allow for getting context of headers to return back the clientID. For simpler cases, this can be done in the model layer much easier as it only has to be applied once and then automatically sends the event for all updates or removals regardless of the source.

```javascript
// schemas/IngredientSchema.js
const IngredientMutations = {
    ingredientCreateOne: wrapMutationAndPublish(
        IngredientTC.mongooseResolvers.createOne(),
        'INGREDIENT_UPDATED'
    ),
    ingredientUpdateById: wrapMutationAndPublish(
        IngredientTC.mongooseResolvers.updateById(),
        'INGREDIENT_UPDATED'
    ),
    ingredientRemoveById: wrapMutationAndPublish(
        IngredientTC.mongooseResolvers.removeById(),
        'INGREDIENT_UPDATED'
    ),
    // Batch operations are not wrapped for performance reasons
    ingredientCreateMany: IngredientTC.mongooseResolvers.createMany(),
    ingredientUpdateMany: IngredientTC.mongooseResolvers.updateMany(),
    ingredientRemoveMany: IngredientTC.mongooseResolvers.removeMany(),
};
```

### 4. Defining Subscription Types

For each model, a subscription type is defined to receive updates:

```javascript
// schemas/IngredientSchema.js
// Create a payload type for the subscription
const IngredientUpdatedPayloadTC = schemaComposer.createObjectTC({
    name: 'IngredientUpdatedPayload',
    fields: {
        ingredientUpdated: 'Ingredient',
        sourceClientId: 'String',
    },
});

// Define the subscription
const IngredientSubscriptions = {
    ingredientUpdated: {
        type: IngredientUpdatedPayloadTC,
        args: {
            userId: 'MongoID!'  // User-specific topic
        },
        resolve: payload => {
            return {
                ingredientUpdated: payload.ingredientUpdated,
                sourceClientId: payload.sourceClientId,
            };
        },
        subscribe: (_, { userId }) => {
            // Create a user-specific topic
            const topic = `INGREDIENT_UPDATED.${userId}`;
            return pubsub.asyncIterableIterator(topic);
        },
    },
};
```

### 5. WebSocket Server Configuration

WebSockets are configured in the Apollo Server setup:

> [!NOTE]
> A lot of the imports are pretty finicky due to different versions of packages for different use cases.

> [!TIP]
> As stated previously, when implementing WebSockets, the server must be able to handle both HTTP and WebSocket requests. This is done by creating an HTTP server and passing it to the WebSocket server. Critically app.listen should be called on the HTTP server, not the Express app. This is a common mistake that can lead to confusion and many lost hours of debugging.

```javascript
// index.js
const express = require("express");
const { ApolloServer } = require("./node_modules/@apollo/server/dist/cjs");
const {
  expressMiddleware,
} = require("./node_modules/@apollo/server/dist/cjs/express4");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const graphqlSchema = require("./graphql/graphqlSchema");
const { ApolloLink } = require("@apollo/client/core");

// Create Express app
const app = express();

// Create HTTP server
const httpServer = createServer(app);

// Start Apollo Server with Express
async function startServer() {
  await mongoose.connect(mongodb_url);
  console.log(`🌿 MongoDB Connected from ${mongodb_url.slice(0, 35)}${mongodb_url.length > 35 ? "..." : ""}`);

  const server = new ApolloServer({
    schema: graphqlSchema,
    introspection: true,
    formatError: (formattedError) => {
      // Custom error formatting
      return {
        message: formattedError.message,
        path: formattedError.path,
        code: formattedError.extensions?.code || "INTERNAL_SERVER_ERROR",
      };
    },
  });

    // ...

  // Add websocket server
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql", // Can share path
  });
  // Import pubsub
  const pubsub = require("./utils/pubsub");

  const serverCleanup = useServer(
    {
      schema: graphqlSchema,
      execute,
      subscribe,
      onConnect: async (ctx) => {
        console.log("Client connected:", ctx.connectionParams);
        return true; // Allow all connections for now
      },
      onDisconnect: async () => {
        console.log("Client disconnected");
      },
      context: async () => {
        // Include pubsub in the context
        return { pubsub };
      },
    },
    wsServer
  );

    // ...

  console.log(
    "WebSocket server is ready at ws://localhost:" +
      (process.env.PORT || 4000) +
      "/graphql"
  );

  // Start Express server
  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(`🕸️  Web sockets ready at ws://localhost:${PORT}/graphql`);
    console.log(`🔒 Authentication enabled`);
  });
}
```

## Frontend Implementation

### 1. Apollo Client Configuration

The Apollo Client is configured to support subscriptions:

```typescript
// graphql.ts
// GraphQL endpoint URL, default to http://localhost:4000/graphql if not provided in environment variables
const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';
const ws_endpoint = process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT || 'ws://localhost:4000/graphql';

// Generate a unique client ID for this browser session
export const CLIENT_ID = uuidv4();

// Create an HTTP Link instance for Apollo Client with headers
const httpLink = new HttpLink({
    uri: endpoint,
    credentials: 'include',
});

// Create a WebSocket client instance for subscriptions
const wsLink = new GraphQLWsLink(
    createClient({
      url: ws_endpoint,
      connectionParams: async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        return { token, clientId: CLIENT_ID };
      },
      on: {
        connected: () => console.log('WebSocket connected'),
        closed: () => console.log('WebSocket disconnected'),
        error: (err) => console.error('WebSocket error:', err),
      },
    })
  );

const splitLink = split(
    ({ query }) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
        );
    },
    wsLink,
    httpLink
);

const graphqlClient = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
    credentials: 'include', // Include cookies in the request
    headers: {}, // Default headers
});
```

### 2. Subscription Query Definition

GraphQL subscription queries are defined in service files:

```typescript
// ingredientService.ts
import { gql } from '@apollo/client';

// GraphQL subscription query
export const INGREDIENT_UPDATED = gql`
  subscription IngredientSubscription($userId: MongoID!) {
    ingredientUpdated(userId: $userId) {
      ingredientUpdated {
        _id
        name
        quantity
        unit
        macros {
          calories
          protein
          carbs
          fat
        }
        price
        userId
      }
      sourceClientId
    }
  }
`;
```

### 3. Subscription Hook in Components

Components use the `useSubscription` hook to listen for updates:

```tsx
// ingredients/page.tsx
import { useSubscription } from "@apollo/client";
import { INGREDIENT_UPDATED } from "../../services/ingredientService";

// Component implementation
const IngredientsPage: React.FC = () => {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [updatePending, setUpdatePending] = useState(false);

  // Set up subscription for real-time ingredient updates
  useSubscription(INGREDIENT_UPDATED, {
    client: graphqlClient, // Explicitly provide the client
    skip: !user?._id,      // Skip if no user ID
    variables: { userId: user?._id }, // User-specific channel
    
    // On receiving data from the subscription
    onData: ({ data }) => {
      const { ingredientUpdated } = data.data;
      
      // Ignore updates from this client
      if (ingredientUpdated.sourceClientId === CLIENT_ID) {
        return;
      }
      
      // Show update notification
      setSnackbar({
        open: true,
        message: "Ingredient data updated. Refreshing...",
        severity: "info",
      });
      
      // Fetch the latest data
      setUpdatePending(true);
      fetchIngredients();
    },
  });

  // Function to fetch ingredients
  const fetchIngredients = async () => {
    try {
      const data = await getAllIngredients(graphqlClient, user);
      setIngredients(data || []);
      setUpdatePending(false);
    } catch (err) {
      console.error("Failed to fetch ingredients:", err);
    }
  };

  // Rest of component implementation
  // ...
};
```

### 4. Update Notifications

When real-time updates are received, a notification is shown to the user:

```tsx
// UI component for notifications
<Snackbar
  open={snackbar.open}
  autoHideDuration={6000}
  onClose={handleCloseSnackbar}
  anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
>
  <Alert
    onClose={handleCloseSnackbar}
    severity={snackbar.severity}
    sx={{ width: "100%" }}
  >
    {snackbar.message}
  </Alert>
</Snackbar>
```

## Special Implementation Patterns

### 1. Client Identification

Each client has a unique ID to filter out self-triggered updates:

```typescript
// Generate unique client ID using UUID
export const CLIENT_ID = uuidv4();

// Add to HTTP headers
const httpLink = new HttpLink({
  uri: API_URL,
  headers: {
    'client-id': CLIENT_ID,
  }
});

// Add to WebSocket connection params
const wsLink = new GraphQLWsLink(createClient({
  url: WS_URL,
  connectionParams: () => {
    return {
      'client-id': CLIENT_ID
    };
  }
}));
```

### 2. User-Specific Channels

Subscription topics include user IDs to ensure privacy:

```javascript
// Server-side subscription setup
subscribe: (_, { userId }) => {
  const topic = `INGREDIENT_UPDATED.${userId}`;
  return pubsub.asyncIterableIterator(topic);
}

// Client-side subscription setup
useSubscription(INGREDIENT_UPDATED, {
  variables: { userId: user?._id }
})
```

### 3. Selective Updates

Only primary CRUD operations trigger events, while batch operations are excluded:

```javascript
// Wrapped for real-time updates
ingredientCreateOne: wrapMutationAndPublish(
  IngredientTC.mongooseResolvers.createOne(),
  'INGREDIENT_UPDATED'
),

// Not wrapped for performance reasons
ingredientCreateMany: IngredientTC.mongooseResolvers.createMany(),
```

### 4. Update Pending State

A pending state tracks when updates are being processed:

```tsx
const [updatePending, setUpdatePending] = useState(false);

// When receiving an update
onData: ({ data }) => {
  // Show notification
  setSnackbar({
    open: true,
    message: "Data updated. Refreshing...",
    severity: "info",
  });
  
  // Set pending state
  setUpdatePending(true);
  
  // Fetch latest data
  fetchData().finally(() => {
    setUpdatePending(false);
  });
}

// Pending state used in UI
{updatePending && (
  <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
    <CircularProgress size={24} color="primary" />
  </Box>
)}
```

## Workflow

The full workflow for real-time updates follows these steps:

1. **Client A Mutation**: Client A performs a mutation (create, update, delete)
   ```typescript
   await updateIngredient(graphqlClient, id, userId, updatedIngredient);
   ```

2. **Server Processing**: Server processes the mutation and updates the database
   ```javascript
   // Mutation resolver execution
   const payload = await next(rp);
   ```

3. **Event Publication**: Server publishes an event to a topic specific to the user
   ```javascript
   const topic = `${eventName}.${userId}`;
   pubsub.publish(topic, eventPayload);
   ```

4. **Event Distribution**: Server sends the event to all subscribed clients except the one that triggered it

5. **Client B Reception**: Client B receives the update via its subscription
   ```typescript
   onData: ({ data }) => {
     const { ingredientUpdated } = data.data;
     // Process update
   }
   ```

6. **UI Update**: Client B displays a notification and refreshes data
   ```typescript
   setSnackbar({
     open: true,
     message: "Data updated. Refreshing...",
     severity: "info",
   });
   fetchData();
   ```

## Testing

To test the real-time update system:

1. **Open Two Browsers**: Log in with the same user account in both browsers
2. **Make a Change**: Create, update, or delete an item in one browser
3. **Observe Update**: Verify that the change appears in the second browser without refreshing
4. **Check Notification**: Confirm that a notification appears in the second browser

## Advantages of this Approach

1. **User-Specific Updates**: Users only receive updates for their own data
2. **No Self-Notifications**: Clients don't receive notifications for their own changes
3. **Consistent API Pattern**: Uses the same GraphQL paradigm for all operations
4. **Minimal Code Duplication**: Wrapper functions reduce repetitive code
5. **Performance Optimization**: Batch operations don't trigger updates to avoid overwhelming clients

## Key Takeaways

The real-time update system demonstrates several important concepts:

1. **GraphQL Subscriptions**: Implementation of the subscription operation type
2. **WebSocket Communication**: Real-time bidirectional communication
3. **PubSub Pattern**: Publish-subscribe messaging pattern
4. **User Data Privacy**: Ensuring users only see their own data
5. **Client Identification**: Tracking the source of changes to avoid loops
6. **Optimistic UI Updates**: Improving perceived performance with optimistic updates
