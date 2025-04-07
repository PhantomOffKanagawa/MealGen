const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const mongoose = require('mongoose');

const graphqlSchema = require('./graphql/graphqlSchema');

// Start Apollo Server
async function startServer() {
  await mongoose.connect('mongodb+srv://phantomoffkanagawa:JYU41Jx1NY3Zpvru@graduatecluster.xsi7q3m.mongodb.net/?retryWrites=true&w=majority&appName=GraduateCluster');

  const server = new ApolloServer({ schema: graphqlSchema });
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });

  console.log(`🚀 Server ready at ${url}`);
}

startServer();
