const { schemaComposer } = require('graphql-compose');

const { UserTC, UserQueries, UserMutations } = require('./schemas/UserSchema');
const { IngredientTC, IngredientQueries, IngredientMutations } = require('./schemas/IngredientSchema');
const { MealTC, MealQueries, MealMutations } = require('./schemas/MealSchema');
const { MealPlanTC, MealPlanQueries, MealPlanMutations } = require('./schemas/MealPlanSchema');

schemaComposer.Query.addFields({
    ...UserQueries,
    ...IngredientQueries,
    ...MealQueries,
    ...MealPlanQueries,
});

schemaComposer.Mutation.addFields({
    ...UserMutations,
    ...IngredientMutations,
    ...MealMutations,
    ...MealPlanMutations,
});

// Add custom queries and mutations for other models similarly
const graphqlSchema = schemaComposer.buildSchema();

// Export the schema
module.exports = graphqlSchema;