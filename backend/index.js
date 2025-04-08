const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const cors = require('cors');
const mongoose = require('mongoose');

const graphqlSchema = require('./graphql/graphqlSchema');

// Create Express app
const app = express();

// Start Apollo Server with Express
async function startServer() {
    await mongoose.connect('');

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
}

startServer();
