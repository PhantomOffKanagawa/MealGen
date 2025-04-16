const { schemaComposer } = require('graphql-compose');
const mongoose = require('mongoose');
const { pubsub } = require('../utils/pubsub');

const { UserTC, UserQueries, UserMutations } = require('./schemas/UserSchema');
const { IngredientTC, IngredientQueries, IngredientMutations, IngredientSubscriptions } = require('./schemas/IngredientSchema');
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

schemaComposer.Subscription.addFields({
    ...IngredientSubscriptions,
});

// Subscription Publisher
(async () => {
    const changeStream = await mongoose.connection.collection('ingredients').watch();
    changeStream.on('added', (change) => {
        const ingredient = change.fullDocument;
        pubsub.publish('INGREDIENT_ADDED', { ingredientAdded: ingredient });
    });
})().catch(console.error);

// Add custom queries and mutations for other models similarly
const graphqlSchema = schemaComposer.buildSchema();

// Export the schema
module.exports = graphqlSchema;