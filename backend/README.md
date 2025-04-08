# GraphQL Apollo Mongoose Backend Setup

This document outlines the setup and configuration of our GraphQL API using Apollo Server with MongoDB/Mongoose integration.

## Technology Stack

- **GraphQL**: Query language for APIs and runtime for fulfilling those queries
- **Apollo Server**: GraphQL server that works with any GraphQL schema
- **Mongoose**: MongoDB object modeling tool designed to work in an asynchronous environment
- **MongoDB**: NoSQL database used for storing application data

## Setup Process

### 1. Project Initialization

The backend was initialized with Node.js and Express, with the following key dependencies:

```bash
npm install apollo-server-express express graphql mongoose
```

### 2. Database Connection

MongoDB connection is established using Mongoose in the `server.js` file:

```javascript
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
```

### 3. Schema Definition

GraphQL schema is defined using graphql-compose-mongoose to automatically generate GraphQL types from Mongoose models. The schema is combined in the `graphqlSchema.js` file:

### 4. Resolver Implementation

Resolvers are implemented to handle GraphQL queries and mutations, connecting the GraphQL operations to the MongoDB database through Mongoose models. They are semi-manually defined in each `graphql/schema/*` file

### 5. Apollo Server Setup

The Apollo Server is configured and connected to Express:

```javascript
const server = new ApolloServer({
    schema: graphqlSchema
});

// Start the Apollo Server
await server.start();

// Apply middleware
app.use(cors());
app.use(express.json());

// Apply Apollo middleware
app.use('/graphql', expressMiddleware(server));

// Start Express server
app.listen(4000, () => {
    console.log('🚀 Server ready at http://localhost:4000/graphql');
});
```

## Project Structure

```
backend/
├── mongodb/        # Mongoose models
├── graphql/        # GraphQL schema definitions
├── utils/          # Helper utilities
└── server.js       # Main server file
```

## Data Models and Setup

For detailed information about how the data models are structured and how the data is set up in the application, please refer to the [Data Setup Documentation](./docs/data-setup.md).

## Running the Server

```bash
yarn dev
```

The GraphQL playground will be available at: `http://localhost:4000/graphql`
