const { schemaComposer } = require('graphql-compose');

const { UserTC, UserQueries, UserMutations } = require('./schemas/UserSchema');
const { IngredientTC, IngredientQueries, IngredientMutations } = require('./schemas/IngredientSchema');
const { MealTC, MealQueries, MealMutations } = require('./schemas/MealSchema');

schemaComposer.Query.addFields({
    ...UserQueries,
    ...IngredientQueries,
    ...MealQueries,
});

schemaComposer.Mutation.addFields({
    ...UserMutations,
    ...IngredientMutations,
    ...MealMutations,
});

// Add custom queries and mutations for other models similarly
const graphqlSchema = schemaComposer.buildSchema();

// Export the schema
module.exports = graphqlSchema;