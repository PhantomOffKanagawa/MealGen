const { schemaComposer } = require('graphql-compose');

const { UserTC, UserQueries, UserMutations } = require('./schemas/UserSchema');

schemaComposer.Query.addFields({
    ...UserQueries,
});

schemaComposer.Mutation.addFields({
    ...UserMutations,
});

// Add custom queries and mutations for other models similarly
const graphqlSchema = schemaComposer.buildSchema();

// Export the schema
module.exports = graphqlSchema;