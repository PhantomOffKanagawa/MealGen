const { schemaComposer } = require('graphql-compose');

const { UserTC, UserQueries, UserMutations } = require('./schemas/UserSchema');
const { IngredientTC, IngredientQueries, IngredientMutations } = require('./schemas/IngredientSchema');

schemaComposer.Query.addFields({
    ...UserQueries,
    ...IngredientQueries,
});

schemaComposer.Mutation.addFields({
    ...UserMutations,
    ...IngredientMutations,
});

// Add custom queries and mutations for other models similarly
const graphqlSchema = schemaComposer.buildSchema();

// Export the schema
module.exports = graphqlSchema;