const { composeMongoose } = require('graphql-compose-mongoose');
const { schemaComposer } = require('graphql-compose');
const customOptions = require('../customOptions');
const Ingredient = require('../../mongodb/IngredientModel');
const pubsub = require('../../utils/pubsub');

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
    ingredientCreateOne: IngredientTC.mongooseResolvers.createOne(),
    ingredientCreateMany: IngredientTC.mongooseResolvers.createMany(),
    ingredientUpdateById: IngredientTC.mongooseResolvers.updateById(),
    ingredientUpdateOne: IngredientTC.mongooseResolvers.updateOne(),
    ingredientUpdateMany: IngredientTC.mongooseResolvers.updateMany(),
    ingredientRemoveById: IngredientTC.mongooseResolvers.removeById(),
    ingredientRemoveOne: IngredientTC.mongooseResolvers.removeOne(),
    ingredientRemoveMany: IngredientTC.mongooseResolvers.removeMany(),
};

const IngredientSubscriptions = {
    ingredientUpdated: {
        type: IngredientTC,
        resolve: payload => {
          return payload.ingredientUpdated;
        },
        subscribe: (parent, args, { pubsub }) => pubsub.asyncIterableIterator('INGREDIENT_UPDATED'),
    },
};

module.exports = {
    IngredientTC,
    IngredientQueries,
    IngredientMutations,
    IngredientSubscriptions,
};