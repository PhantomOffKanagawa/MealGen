const { composeMongoose } = require('graphql-compose-mongoose');
const { schemaComposer } = require('graphql-compose');
const customOptions = require('../customOptions');
const Ingredient = require('../../mongodb/IngredientModel');
const pubsub = require('../../utils/pubsub');
const { wrapMutationAndPublish } = require('../customOptions');

// Convert Mongoose model to GraphQL TypeComposer
const IngredientTC = composeMongoose(Ingredient, {
  ...customOptions,
});

// Define custom queries
console.log('Ingredient Resolvers', IngredientTC.getResolvers());
const IngredientQueries = {
    ingredientById: IngredientTC.mongooseResolvers.findById(),
    ingredientByIds: IngredientTC.mongooseResolvers.findByIds(),
    ingredientOne: IngredientTC.mongooseResolvers.findOne(),
    ingredientMany: IngredientTC.mongooseResolvers.findMany(),
    ingredientDataLoader: IngredientTC.mongooseResolvers.dataLoader(),
    ingredientDataLoaderMany: IngredientTC.mongooseResolvers.dataLoaderMany(),
    ingredientByIdLean: IngredientTC.mongooseResolvers.findById({ lean: true }),
    ingredientByIdsLean: IngredientTC.mongooseResolvers.findByIds({ lean: true }),

    ingredientCount: IngredientTC.mongooseResolvers.count(),
    ingredientConnection: IngredientTC.mongooseResolvers.connection(),
    ingredientPagination: IngredientTC.mongooseResolvers.pagination(),

    ingredientByUserId: IngredientTC.mongooseResolvers.findMany({
        filter: {
            userId: 'String!'
        },
        filterTypeNameFix: true
    }),
};

const IngredientMutations = {
    // Wrap single-record mutations to publish events with sourceClientId
    ingredientCreateOne: wrapMutationAndPublish(
        IngredientTC.mongooseResolvers.createOne(),
        'INGREDIENT_UPDATED'
    ),
    ingredientUpdateById: wrapMutationAndPublish(
        IngredientTC.mongooseResolvers.updateById(),
        'INGREDIENT_UPDATED'
    ),
    ingredientUpdateOne: wrapMutationAndPublish(
        IngredientTC.mongooseResolvers.updateOne(),
        'INGREDIENT_UPDATED'
    ),
    ingredientRemoveById: wrapMutationAndPublish(
        IngredientTC.mongooseResolvers.removeById(),
        'INGREDIENT_UPDATED' // Publish the removed record state
    ),
    ingredientRemoveOne: wrapMutationAndPublish(
        IngredientTC.mongooseResolvers.removeOne(),
        'INGREDIENT_UPDATED' // Publish the removed record state
    ),

    // Keep batch operations unwrapped for simplicity, as they might require different event handling
    ingredientCreateMany: IngredientTC.mongooseResolvers.createMany(),
    ingredientUpdateMany: IngredientTC.mongooseResolvers.updateMany(),
    ingredientRemoveMany: IngredientTC.mongooseResolvers.removeMany(),
};

// Create a type for the subscription payload with sourceClientId
const IngredientUpdatedPayloadTC = schemaComposer.createObjectTC({
    name: 'IngredientUpdatedPayload',
    fields: {
        ingredientUpdated: 'Ingredient',
        sourceClientId: 'String',
    },
});

const IngredientSubscriptions = {
    ingredientUpdated: {
        type: IngredientUpdatedPayloadTC,
        args: {
            userId: 'MongoID!'
        },
        resolve: payload => {
            return {
                ingredientUpdated: payload.ingredientUpdated,
                sourceClientId: payload.sourceClientId,
            };
        },
        subscribe: (_, { userId }) => {
            // Create a user-specific topic
            const topic = `INGREDIENT_UPDATED.${userId}`;
            return pubsub.asyncIterableIterator(topic);
        },
    },
};

module.exports = {
    IngredientTC,
    IngredientQueries,
    IngredientMutations,
    IngredientSubscriptions,
};