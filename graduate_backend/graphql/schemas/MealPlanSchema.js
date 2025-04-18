const { composeMongoose } = require("graphql-compose-mongoose");
const { schemaComposer } = require("graphql-compose");
const customOptions = require("../customOptions");
const MealPlan = require("../../mongodb/MealPlanModel");
const pubsub = require("../../utils/pubsub");
const { wrapMutationAndPublish } = require("../customOptions");

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
      userId: "String!",
    },
    filterTypeNameFix: true,
  }),
};

const MealPlanMutations = {
  // Wrap single-record mutations to publish events with sourceClientId
  mealPlanCreateOne: wrapMutationAndPublish(
    MealPlanTC.mongooseResolvers.createOne(),
    "MEAL_PLAN_UPDATED",
  ),
  mealPlanUpdateById: wrapMutationAndPublish(
    MealPlanTC.mongooseResolvers.updateById(),
    "MEAL_PLAN_UPDATED",
  ),
  mealPlanUpdateOne: wrapMutationAndPublish(
    MealPlanTC.mongooseResolvers.updateOne(),
    "MEAL_PLAN_UPDATED",
  ),
  mealPlanRemoveById: wrapMutationAndPublish(
    MealPlanTC.mongooseResolvers.removeById(),
    "MEAL_PLAN_UPDATED", // Publish the removed record state
  ),
  mealPlanRemoveOne: wrapMutationAndPublish(
    MealPlanTC.mongooseResolvers.removeOne(),
    "MEAL_PLAN_UPDATED", // Publish the removed record state
  ),

  // Keep batch operations unwrapped for simplicity, as they might require different event handling
  mealPlanCreateMany: MealPlanTC.mongooseResolvers.createMany(),
  mealPlanUpdateMany: MealPlanTC.mongooseResolvers.updateMany(),
  mealPlanRemoveMany: MealPlanTC.mongooseResolvers.removeMany(),
};

// Create a type for the subscription payload with sourceClientId
const MealPlanUpdatedPayloadTC = schemaComposer.createObjectTC({
  name: "MealPlanUpdatedPayload",
  fields: {
    mealPlanUpdated: "MealPlan",
    sourceClientId: "String",
  },
});

const MealPlanSubscriptions = {
  mealPlanUpdated: {
    type: MealPlanUpdatedPayloadTC,
    args: {
      userId: "MongoID!",
    },
    resolve: (payload) => {
      console.log("MealPlanUpdated payload:", payload);
      return {
        mealPlanUpdated: payload.mealUpdated,
        sourceClientId: payload.sourceClientId,
      };
    },
    subscribe: (_, { userId }) => {
      // Create a user-specific topic
      const topic = `MEAL_PLAN_UPDATED.${userId}`;
      return pubsub.asyncIterableIterator(topic);
    },
  },
};

module.exports = {
  MealPlanTC,
  MealPlanQueries,
  MealPlanMutations,
  MealPlanSubscriptions,
};
