const { composeMongoose } = require('graphql-compose-mongoose');
const { schemaComposer } = require('graphql-compose');
const customOptions = require('../customOptions');
const MealPlan = require('../../mongodb/MealPlanModel');

// Convert Mongoose model to GraphQL TypeComposer
const MealPlanTC = composeMongoose(MealPlan, {
  ...customOptions,
});

// Define custom queries
const MealPlanQueries = {
    mealPlanById: MealPlanTC.mongooseResolvers.findById(),
    mealPlanByIds: MealPlanTC.mongooseResolvers.findByIds(),
    mealPlanOne: MealPlanTC.mongooseResolvers.findOne(),
    mealPlanMany: MealPlanTC.mongooseResolvers.findMany(),
    mealPlanDataLoader: MealPlanTC.mongooseResolvers.dataLoader(),
    mealPlanDataLoaderMany: MealPlanTC.mongooseResolvers.dataLoaderMany(),
    mealPlanByIdLean: MealPlanTC.mongooseResolvers.findById({ lean: true }),
    mealPlanByIdsLean: MealPlanTC.mongooseResolvers.findByIds({ lean: true }),

    mealPlanCount: MealPlanTC.mongooseResolvers.count(),
    mealPlanConnection: MealPlanTC.mongooseResolvers.connection(),
    mealPlanPagination: MealPlanTC.mongooseResolvers.pagination(),

    mealPlanByUserId: MealPlanTC.mongooseResolvers.findMany({
        filter: {
            userId: 'String!'
        },
        filterTypeNameFix: true
    }),
};

const MealPlanMutations = {
    mealPlanCreateOne: MealPlanTC.mongooseResolvers.createOne(),
    mealPlanCreateMany: MealPlanTC.mongooseResolvers.createMany(),
    mealPlanUpdateById: MealPlanTC.mongooseResolvers.updateById(),
    mealPlanUpdateOne: MealPlanTC.mongooseResolvers.updateOne(),
    mealPlanUpdateMany: MealPlanTC.mongooseResolvers.updateMany(),
    mealPlanRemoveById: MealPlanTC.mongooseResolvers.removeById(),
    mealPlanRemoveOne: MealPlanTC.mongooseResolvers.removeOne(),
    mealPlanRemoveMany: MealPlanTC.mongooseResolvers.removeMany(),
};

module.exports = {
    MealPlanTC,
    MealPlanQueries,
    MealPlanMutations,
};
