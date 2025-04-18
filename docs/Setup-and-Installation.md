# Setup and Installation

This document provides detailed instructions for setting up the MealGen development environment.

## Prerequisites

Before setting up the MealGen application, ensure you have the following installed:

- **Node.js**
- **yarn**
- **MongoDB**
- **Git**

> [!NOTE]
> NPM should also work, but the project is primarily developed with Yarn. \
> If you prefer using NPM, you may need to adjust some commands accordingly.

## Getting the Code

Clone the repository from GitHub:

```bash
git clone https://github.com/PhantomOffKanagawa/graduate_project_v.git
cd graduate_project_v
```

## Backend Setup

### Setting Up the Backend Server

Navigate to the backend directory and install dependencies:

```bash
cd graduate_backend
yarn install
```

### Environment Configuration

Create a `.env` file in the backend directory with the following variables:

> [!IMPORTANT]
> The `.env` file is not included in the repository for security reasons. You need to create it manually.

> [!TIP]
> The `FRONTEND_URL` variable is used for CORS configuration. Ensure it matches the URL of your frontend application. This made development easy as you can quickly change the URL to allow remote connections.

> [!WARNING]
> The `DEVELOPMENT` variable is used to determine if the server is running in development mode. This is important for security reasons, as it allows you to disable certain unsecure features in production such as the skeleton key `x-dev-token` header.

```
BACKEND_PORT=4000
MONGODB_URL=mongodb://localhost:27017/MealGen
JWT_SECRET=your_jwt_secret
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Replace `your_jwt_secret` with a secure random string.

### Database Setup

Ensure MongoDB is running on your system or the url has the relevant information for your cloud solution. The application will create the required collections automatically when it first connects to the database.

### Starting the Backend Server

Start the backend server in development mode:

```bash
yarn dev
```

The GraphQL server will be available at `http://localhost:${BACKEND_PORT}/graphql`.

## Frontend Setup

### Setting Up the Frontend Application

Navigate to the frontend directory and install dependencies:

```bash
cd ../graduate_frontend
yarn install
```

### Environment Configuration

Create a `.env` file in the frontend directory with the following variables:

```
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:4000/graphql
NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT=ws://localhost:4000/graphql
```

### Starting the Frontend Application

Start the frontend application in development mode:

```bash
yarn dev
```

The application will be available at `http://localhost:3000`.

## Full Stack Development

For full stack development, you'll need to run both the backend and frontend servers simultaneously. You can do this by opening two terminal windows, one for each server.

## Environment Setup Tips

### MongoDB Atlas (Optional)

If you prefer using MongoDB Atlas instead of a local MongoDB instance:

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Update the `MONGODB_URL` in your `.env` file

## Troubleshooting Common Issues

### Connection to MongoDB Failed

If you see an error connecting to MongoDB:

1. Ensure MongoDB is running
2. Check that the connection URL is correct
3. Verify network settings if using a remote database

> [!TIP]
> If using Atlas, ensure your IP is whitelisted in the cluster settings \
> If using Docker, ensure the container is running and ports are mapped correctly

### GraphQL Endpoint Not Available

If you can't connect to the GraphQL endpoint:

1. Ensure the backend server is running
2. Check that the port isn't being used by another application
3. Verify the endpoint URL in the frontend configuration
4. Ensure CORS is configured correctly in the backend
5. Check the browser console for CORS errors

> [!NOTE]
> I didn't run into CORS issues with this implementation but if you do, ensure the `FRONTEND_URL` in the backend `.env` file is correct. This is used to configure CORS in the Apollo Server. Alternatively you can manually add another origin to the `cors` array in the Apollo Server configuration.

### Authentication Issues

If you experience authentication problems:

1. Check that the JWT_SECRET is consistent
2. Clear browser cookies and local storage
3. Verify that the user credentials are correct

## Development Tools

### Recommended VS Code Extensions

- **Prettier** - Code formatting
- **Apollo GraphQL** - GraphQL integration
- **MongoDB for VS Code** - Database management

### Browser Extensions

- **Apollo Client Developer Tools** - Debugging GraphQL queries
- **React Developer Tools** - Inspecting React components

## Key Takeaways

Setting up the MealGen project demonstrates several important concepts in modern web development:

1. **Full Stack JavaScript Environment** - Working with Node.js and React
2. **Environment Configuration** - Managing different environments with environment variables
3. **Database Setup** - Configuring MongoDB for a Node.js application
4. **GraphQL Server Configuration** - Setting up Apollo Server
5. **Front-end Framework Setup** - Configuring Next.js 
6. **Development Workflow** - Running multiple servers during development

This setup provides a solid foundation for full-stack JavaScript development with the MERN stack (MongoDB, Express, React, Node.js), enhanced with GraphQL and Next.js.
