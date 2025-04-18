# System Architecture

## Overview

MealGen follows a modern full-stack architecture with clear separation of concerns between frontend and backend systems. This document outlines the high-level architecture of the application and how different components interact with each other.

## Architectural Diagram

```
╭───────────────╮     ╭───────────────╮                    
│ ╭───────────╮ │     │ ╭───────────╮ │    ╭──────────────╮
│ │   View    │ │  ╭───►│  GraphQL  │ │    │   MongoDB    │
│ ╰───────────╯ │  │╭───│  (Apollo) │ │  ╭►│   (Docker)   │
│     ▲   │     │  ││ │ ╰───────────╯ │  │ │              │
│     │   ▼     │  ││ │    │     ▲    │  │ ╰──────────────╯
│ ╭───────────╮ │  ││ │    ▼     │    │ ╭│      (OR)       
│ │  Apollo   │────╯│ │ ╭───────────╮ │ ││ ╭──────────────╮
│ │           │◄────╯ │ │ Mongoose  │ │ ││ │   MongoDB    │
│ ╰───────────╯ │     │ │           │───╯╰►│   (Atlas)    │
│   Frontend    │     │ ╰───────────╯ │    │              │
│   (Next.js)   │     │  Node Backend │    ╰──────────────╯
╰───────────────╯     ╰───────────────╯                    
```

## Key Components

### Frontend (Next.js)

The frontend is built with Next.js and uses React with TypeScript. It follows a component-based architecture with clear separation of:

- **Pages**: Defined in the `app` directory using the Next.js App Router
- **Components**: Reusable UI elements organized by feature/domain
- **Services**: API communication layer that interacts with the GraphQL backend
- **Context**: Global state management using React Context API

### Backend (Node.js + Apollo Server)

The backend is built with Node.js and Apollo Server, providing a GraphQL API with:

- **GraphQL Schema**: Defines the API structure and types
- **Resolvers**: Implement the business logic for GraphQL operations
- **MongoDB Models**: Define the database structure using Mongoose
- **Authentication**: JWT-based authentication system
- **GraphQL Compose**: Defines GraphQL types and resolvers using Mongoose models

### Database (MongoDB)

MongoDB serves as the application's database, storing:

- User accounts and authentication information
- Ingredients with nutritional information
- Meals composed of ingredients
- Meal plans that organize meals and ingredients

Implementation options include:

- **MongoDB Atlas**: Freemium managed cloud database service
- **Docker**: Local MongoDB instance for development and testing

> [!NOTE]
> The configuration of using MongoDB Atlas or Docker is defined in the `.env` file. This was added when my internet went down one day and I needed to run the database locally. MongoDB also does a great job of ensuring you only connect from allowed IPs but this is annoying when working on a laptop between classes.

## Communication Flow

1. **User Interaction**: Users interact with the Next.js frontend
2. **API Requests**: Frontend makes GraphQL queries/mutations to the backend
3. **Authentication**: Backend verifies user authentication and authorization
4. **Data Processing**: Backend processes requests, performs database operations
5. **Response**: Backend returns data to the frontend
6. **Real-time Updates**: GraphQL subscriptions provide real-time data synchronization back to relevant clients

## Key Architectural Decisions

### 1. GraphQL API

GraphQL was a requirement but offered several advantages:

- **Flexible Data Fetching**: Clients can request exactly the data they need
- **Single Endpoint**: Simplified API architecture with a single endpoint
- **Type Safety**: Strong typing of API operations and responses
- **Real-time Capability**: Native support for subscriptions for live updates

### 2. Next.js App Router

The Next.js 15 App Router was a requirement but offered:

- **Server Components**: Improved performance
- **Simplified Routing**: File-based routing system
- **TypeScript Integration**: Strong typing throughout the application

### 3. Schema-First GraphQL Development

Using GraphQL Compose with Mongoose enables:

- **Automatic Schema Generation**: Converting Mongoose models to GraphQL types
- **Consistent Data Layer**: Ensuring consistency between database and API
- **Code Reuse**: Leveraging Mongoose validations in GraphQL
- **Reduced Boilerplate**: Automating resolver creation for common operations

> [!NOTE]
> I somehow thought MongoDB was a requirement as I generally prefer Firebase. Instead using MongoDB allowed me to learn about GraphQL Compose which really simplified the GraphQL API development process. It also meant that I spent more time implementing things we take for granted in Firebase like authentication and real-time updates.

### 4. Real-time Updates with GraphQL Subscriptions

The application uses GraphQL subscriptions to provide real-time updates:

- **User-Specific Channels**: Updates are targeted to specific users
- **Efficient Data Transfer**: Only changed data is sent to clients
- **Consistent API Pattern**: Using the same GraphQL paradigm for all operations
- **WebSocket Support**: Leveraging WebSocket for real-time communication

## Key Takeaways

This architecture demonstrates several important concepts:

1. **Full-Stack JavaScript**: A unified JavaScript ecosystem across all layers
2. **API Design**: Modern GraphQL API implementation
3. **Database Design**: NoSQL database modeling with Mongoose
4. **State Management**: Client-side state management strategies
5. **Real-time Systems**: Implementation of real-time features in web applications
