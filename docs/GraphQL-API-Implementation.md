# GraphQL API Implementation

This document explains how the GraphQL API is implemented in MealGen, covering schema design, resolvers, and advanced features like subscriptions.

## GraphQL Architecture

The GraphQL API in MealGen is built using Apollo Server with a schema-first approach leveraging GraphQL Compose and Mongoose integration. The architecture follows these key principles:

1. **MongoDB Models → GraphQL Types**: Mongoose models are automatically converted to GraphQL types
2. **Standardized Resolvers**: Common CRUD operations are generated automatically
3. **Custom Business Logic**: Added through custom resolvers and field resolvers
4. **Real-time Updates**: Implemented using GraphQL subscriptions

## Schema Composition

The GraphQL schema is composed from individual domain schemas using the `graphql-compose` library:

```javascript
// graphqlSchema.js
const { schemaComposer } = require('graphql-compose');
const mongoose = require('mongoose');
const { pubsub } = require('../utils/pubsub');

// Import schema components
const { UserTC, UserQueries, UserMutations } = require('./schemas/UserSchema');
const { IngredientTC, IngredientQueries, IngredientMutations, IngredientSubscriptions } = require('./schemas/IngredientSchema');
const { MealTC, MealQueries, MealMutations, MealSubscriptions } = require('./schemas/MealSchema');
const { MealPlanTC, MealPlanQueries, MealPlanMutations, MealPlanSubscriptions } = require('./schemas/MealPlanSchema');

// Combine queries
schemaComposer.Query.addFields({
    ...UserQueries,
    ...IngredientQueries,
    ...MealQueries,
    ...MealPlanQueries,
});

// Combine mutations
schemaComposer.Mutation.addFields({
    ...UserMutations,
    ...IngredientMutations,
    ...MealMutations,
    ...MealPlanMutations,
});

// Combine subscriptions
schemaComposer.Subscription.addFields({
    ...IngredientSubscriptions,
    ...MealSubscriptions,
    ...MealPlanSubscriptions,
});

// Build and export the schema
const graphqlSchema = schemaComposer.buildSchema();
module.exports = graphqlSchema;
```

## Domain-Specific Schemas

Each domain (users, ingredients, meals, meal plans) has its own schema file with a consistent structure:

### Structure of Domain Schema Files

```javascript
// Example: IngredientSchema.js structure
const { composeMongoose } = require('graphql-compose-mongoose');
const { schemaComposer } = require('graphql-compose');
const customOptions = require('../customOptions');
const Ingredient = require('../../mongodb/IngredientModel');
const pubsub = require('../../utils/pubsub');
const { wrapMutationAndPublish } = require('../customOptions');

// Create GraphQL type from Mongoose model
const IngredientTC = composeMongoose(Ingredient, customOptions);

// Define queries
const IngredientQueries = {
    // Standard queries
    ingredientById: IngredientTC.mongooseResolvers.findById(),
    ingredientMany: IngredientTC.mongooseResolvers.findMany(),
    // Custom queries
    // ...
};

// Define mutations
const IngredientMutations = {
    // Standard mutations with publication wrapping for real-time updates
    ingredientCreateOne: wrapMutationAndPublish(
        IngredientTC.mongooseResolvers.createOne(),
        'INGREDIENT_UPDATED'
    ),
    // ...
};

// Define subscriptions
const IngredientSubscriptions = {
    ingredientUpdated: {
        type: IngredientUpdatedPayloadTC,
        args: {
            userId: 'MongoID!'
        },
        resolve: payload => {
            return {
                ingredientUpdated: payload.ingredientUpdated,
                sourceClientId: payload.sourceClientId,
            };
        },
        subscribe: (_, { userId }) => {
            const topic = `INGREDIENT_UPDATED.${userId}`;
            return pubsub.asyncIterableIterator(topic);
        },
    },
};

// Export components
module.exports = {
    IngredientTC,
    IngredientQueries,
    IngredientMutations,
    IngredientSubscriptions,
};
```

## Query Types

The GraphQL API provides several types of queries:

### Standard Queries

Generated automatically by GraphQL Compose Mongoose:

```javascript
ingredientById: IngredientTC.mongooseResolvers.findById(),
ingredientByIds: IngredientTC.mongooseResolvers.findByIds(),
ingredientOne: IngredientTC.mongooseResolvers.findOne(),
ingredientMany: IngredientTC.mongooseResolvers.findMany(),
ingredientCount: IngredientTC.mongooseResolvers.count(),
```

### User-Specific Queries

Custom queries for getting current user:

```javascript
  // Custom query to get the current authenticated user
  me: {
    type: UserTC,
    resolve: async (_, args, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      return await User.findById(context.user.id);
    }
  },
```

## Mutation Types

The API includes several types of mutations:

### Standard Mutations

Generated automatically for CRUD operations:

```javascript
ingredientCreateOne: IngredientTC.mongooseResolvers.createOne(),
ingredientCreateMany: IngredientTC.mongooseResolvers.createMany(),
ingredientUpdateById: IngredientTC.mongooseResolvers.updateById(),
ingredientUpdateOne: IngredientTC.mongooseResolvers.updateOne(),
ingredientUpdateMany: IngredientTC.mongooseResolvers.updateMany(),
ingredientRemoveById: IngredientTC.mongooseResolvers.removeById(),
ingredientRemoveOne: IngredientTC.mongooseResolvers.removeOne(),
ingredientRemoveMany: IngredientTC.mongooseResolvers.removeMany(),
```

### Custom Mutations

Custom mutations for specific business logic:

```javascript
// Example: Custom user registration mutation
UserTC.addResolver({
  name: 'register',
  args: {
    name: 'String!',
    email: 'String!',
    password: 'String!',
    age: 'Int',
  },
  type: AuthPayloadTC, // Custom type for auth response
  resolve: async ({ args }) => {
    // Implementation for user registration
    // ...
  }
});

UserMutations.register = UserTC.getResolver('register');
```

### Mutations with Real-time Updates

Mutations wrapped with real-time update publishing:

> [!NOTE]
> The `wrapMutationAndPublish` function is defined in `customOptions.js` and is responsible for publishing events when data changes. Wrapped mutations will send updates to the passed `eventName`.

```javascript
// Wrap mutation resolvers to publish events when data changes
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
```

## Subscription System

The subscription system enables real-time updates using WebSockets:

> [!NOTE]
> The subscription system is built on top of the PubSub pattern, allowing clients to subscribe to specific events and receive updates in real-time. The stack for this is Apollo Server, GraphQL, PubSub, and WebSocket.

### Subscription Definition

```javascript
const IngredientSubscriptions = {
    ingredientUpdated: {
        type: IngredientUpdatedPayloadTC, // Custom payload type
        args: {
            userId: 'MongoID!' // User-specific channel
        },
        resolve: payload => {
            return {
                ingredientUpdated: payload.ingredientUpdated,
                sourceClientId: payload.sourceClientId, // Client identification
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

### Publishing Updates

Updates are published using a PubSub mechanism:

Covered in more detail in [Real-time Update System](./Real-time-Updates.md).

> [!NOTE]
> This function was written to streamline the mutation process and ensure that the correct events are published. It is important to attach them to the graphql schema to ensure the page uuid can be accessed. This page uuid is used to ensure that the client sending the mutation is not the one receiving the update.

```javascript
// customOptions.js - Wrapper function for mutations
// Simplified to show the core functionality
const wrapMutationAndPublish = (resolver, eventName) => {
    return resolver.wrapResolve(next => async rp => {
        // Get client ID from request context
        const sourceClientId = rp.context.clientId || null;
        
        // Execute the original resolver
        const payload = await next(rp);
        
        // Get user ID for user-specific topic
        const userId = payload.record.userId;
        if (!userId) return payload;
        
        // Create topic with user ID for user-specific updates
        const topic = `${eventName}.${userId}`;
        
        // Publish the event with source client ID
        pubsub.publish(topic, {
            ingredientUpdated: payload.record,
            sourceClientId: sourceClientId,
        });
        
        return payload;
    });
};
```

## Authentication and Authorization

### Authentication

JWT-based authentication is implemented in the UserSchema:

```javascript
// UserSchema.js - Login mutation
login: {
  type: AuthPayloadTC,
  args: {
    email: 'String!',
    password: 'String!',
  },
  resolve: async (_, { email, password }) => {
    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login time
    user.lastLogin = Date.now();
    await user.save();
    
    // Generate JWT token
    const token = user.generateAuthToken();
    
    return {
      token,
      user,
    };
  }
}
```

### Authorization

Authorization is handled through middleware in `index.js` that validates JWT tokens:

> [!NOTE]
> This allows a fully-fledged authentication system to be implemented, including user roles and permissions. It is independent of any other authentication system.

```javascript
// index.js - Apollo Server context function
const server = new ApolloServer({
  schema: graphqlSchema,
  context: async ({ req }) => {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1] || '';
    
    // Verify token and get user
    let user = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        user = await User.findById(decoded.id).select('-password');
      } catch (err) {
        console.error('Invalid token:', err.message);
      }
    }
    
    return { user };
  }
});
```

## Apollo Server Configuration

The Apollo Server is configured in `index.js` with WebSocket support for subscriptions:

> [!TIP]
> It is crucial to use the httpServer instance as the listener for the servers. This allows the WebSocket server to listen on the same port as the HTTP server. This definitely didn't eat up a few hours of my life.

```javascript
// index.js
async function startServer() {
  // Create Express app
  const app = express();
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // WebSocketServer for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  // Create GraphQL server
  const server = new ApolloServer({
    schema: graphqlSchema,
    plugins: [
      // Plugin for WebSocket support
      ApolloServerPluginDrainHttpServer({ httpServer }),
    ],
  });

  // Set up WebSocket server
  const serverCleanup = useServer(
    {
      schema: graphqlSchema,
      // Connection handler
      onConnect: async (ctx) => {
        console.log("Client connected:", ctx.connectionParams);
        return true;
      },
      onDisconnect: async () => {
        console.log("Client disconnected");
      },
      // Context for subscription resolvers
      context: async () => {
        return { pubsub };
      },
    },
    wsServer
  );

  // Start server
  await server.start();
  
  // Apply middleware
  app.use(
    cors({
      origin: frontend_url || "http://localhost:3000",
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  
  // Apply Apollo middleware
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => {
        // Authentication context
        // ...
      },
    })
  );
  
  // Start server
  await new Promise((resolve) => httpServer.listen({ port }, resolve));
  console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
}

startServer().catch((err) => {
  console.error("Error starting server:", err);
});
```

## GraphQL Client Integration

On the frontend, GraphQL clients are configured to support queries, mutations, and subscriptions:

> [!WARNING]
> Data persistence is quite difficult ideologically as the options of Cookies, Headers, and LocalStorage are all quite different. I chose to use local storage for the sake of simplicity and ease of use in the development environment. Ideally cookies would be used for production but presented issues in rapid development.

> [!NOTE]
> The frontend's GraphQL handeling was completely redone to use Apollo Client. The previous implementation was using GraphQL more directly. The new implementation uses the Apollo Client, which is a well-supported and widely used library for GraphQL.

> [!IMPORTANT]
> The move to Apollo Client as to support subscriptions caused two problems. Firstly it cached all of its calls which lead to out of data information being grabbed being out of date this meant that you had to pass `fetchPolicy: 'no-cache'` to every query. Secondly the Apollo Client doesn't ignore `__typename` fields which are added by default. This caused issues with the GraphQL server as it was expecting a different type of data. This was solved by adding middleware to the Apollo Client to remove the `__typename` fields from the data before it was sent to the server.

<details>
<summary>Example of fetchPolicy</summary>

```typescript
// Original graphqlClient request
const response = await graphqlClient.request(GET_ALL_INGREDIENTS_QUERY, {
    filter: { userId: user?._id || '' },
});

// Updated graphqlClient request with Apollo Client
const response = await graphqlClient.query({
    query: GET_ALL_INGREDIENTS_QUERY,
    variables: {
    filter: { userId: user?._id || '' },
    },
    fetchPolicy: 'no-cache',
});
```

</details>

<details>
<summary>Example of removing __typename</summary>

```javascript
// Middleware to remove __typename fields from data
// Apollo Plugin to remove __typename from variables
server.addPlugin({
  async requestDidStart(requestContext) {
    if (requestContext.request.variables) {
      const omitTypename = (key, value) =>
        key === "__typename" ? undefined : value;
      requestContext.request.variables = JSON.parse(
        JSON.stringify(requestContext.request.variables),
        omitTypename
      );
    }
    
    return {};
  },
});
```
Thank you [Stack Overflow](https://stackoverflow.com/questions/55259856/how-to-remove-the-typename-field-from-the-graphql-response-which-fails-the-m)
</details>

‎

```typescript
// graphql.ts
import { GraphQLClient } from 'graphql-request';
import { 
  ApolloClient, 
  InMemoryCache, 
  HttpLink, 
  split 
} from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// Unique client ID for filtering self-triggered events
export const CLIENT_ID = uuidv4();

// Base API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql';
const WS_URL = API_URL.replace('http', 'ws');

// GraphQL Request client for simple queries/mutations
const graphqlClient = new GraphQLClient(API_URL, {
  headers: () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});

// Apollo client for subscriptions
const httpLink = new HttpLink({
  uri: API_URL,
  headers: {
    'client-id': CLIENT_ID,
  }
});

const wsLink = new GraphQLWsLink(createClient({
  url: WS_URL,
  connectionParams: () => {
    const token = localStorage.getItem('token');
    return {
      Authorization: token ? `Bearer ${token}` : '',
      'client-id': CLIENT_ID
    };
  }
}));

// Split links for queries/mutations vs subscriptions
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

// Create Apollo client
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache()
});

export default graphqlClient;
```

## Testing GraphQL API

The GraphQL API can be tested using the Apollo Explorer:

- **Apollo Explorer**: A built-in tool for testing GraphQL queries and mutations. It provides an interactive interface to explore the schema and execute operations.
- **Postman**: A popular API testing tool that supports GraphQL queries and mutations. You can set up requests with headers, variables, and body content. This was used for testing the websocket server when initially setting up the server.

> [!TIP]
> The Apollo Explorer was hugely helpful in writing the calls for testing various GraphQL operations and really the main advantage of using Apollo Server. It is a great tool for quickly writing the exact queries and mutations you need to return the data you want. It is also a great tool for testing the subscriptions and seeing the data that is returned.

> [!NOTE]
> While great for queries and mutations as mentioned, Apollo Server was really especially amazing for debugging the subscriptions. It allowed you to see the data that was being sent and received in real-time. It also showed errors in the subscription process in a way that took extra work to show from the client side.

**Subscriptions**: Listen for real-time updates
```graphql
  subscription Subscription($userId: MongoID!) {
    ingredientUpdated(userId: $userId) {
      ingredientUpdated {
        userId
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
        _id
      }
      sourceClientId
    }
  }
```

## Key Takeaways

The GraphQL API implementation demonstrates several important concepts:

1. **Schema-first Development**: Building APIs by defining types and operations
2. **Code Generation**: Automating resolver creation from data models
3. **Real-time Communication**: Implementing subscription-based updates
4. **Authorization**: Securing API access with JWT tokens
5. **API Organization**: Structuring GraphQL code in a maintainable way
6. **Client-Server Integration**: Seamlessly connecting frontend and backend
