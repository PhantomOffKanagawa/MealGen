const { composeMongoose } = require('graphql-compose-mongoose');
const { schemaComposer } = require('graphql-compose');
const customOptions = require('../customOptions');
const Meal = require('../../mongodb/MealModel');

// Convert Mongoose model to GraphQL TypeComposer
const MealTC = composeMongoose(Meal, {
  ...customOptions,
});

// Define custom queries
console.log('Meal Resolvers', MealTC.getResolvers());
const MealQueries = {
    mealById: MealTC.mongooseResolvers.findById(),
    mealByIds: MealTC.mongooseResolvers.findByIds(),
    mealOne: MealTC.mongooseResolvers.findOne(),
    mealMany: MealTC.mongooseResolvers.findMany(),
    mealDataLoader: MealTC.mongooseResolvers.dataLoader(),
    mealDataLoaderMany: MealTC.mongooseResolvers.dataLoaderMany(),
    mealByIdLean: MealTC.mongooseResolvers.findById({ lean: true }),
    mealByIdsLean: MealTC.mongooseResolvers.findByIds({ lean: true }),

    mealCount: MealTC.mongooseResolvers.count(),
    mealConnection: MealTC.mongooseResolvers.connection(),
    mealPagination: MealTC.mongooseResolvers.pagination(),

    mealByUserId: MealTC.mongooseResolvers.findMany({
        filter: {
            userId: 'String!'
        },
        filterTypeNameFix: true
    }),
};


const MealMutations = {
    mealCreateOne: MealTC.mongooseResolvers.createOne(),
    mealCreateMany: MealTC.mongooseResolvers.createMany(),
    mealUpdateById: MealTC.mongooseResolvers.updateById(),
    mealUpdateOne: MealTC.mongooseResolvers.updateOne(),
    mealUpdateMany: MealTC.mongooseResolvers.updateMany(),
    mealRemoveById: MealTC.mongooseResolvers.removeById(),
    mealRemoveOne: MealTC.mongooseResolvers.removeOne(),
    mealRemoveMany: MealTC.mongooseResolvers.removeMany(),
};

module.exports = {
    MealTC,
    MealQueries,
    MealMutations,
};
