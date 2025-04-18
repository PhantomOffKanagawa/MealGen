const { composeMongoose } = require("graphql-compose-mongoose");
const { schemaComposer } = require("graphql-compose");
const customOptions = require("../customOptions");
const Meal = require("../../mongodb/MealModel");
const pubsub = require("../../utils/pubsub");
const { wrapMutationAndPublish } = require("../customOptions");

// Convert Mongoose model to GraphQL TypeComposer
const MealTC = composeMongoose(Meal, {
  ...customOptions,
});

// Define custom queries
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
      userId: "String!",
    },
    filterTypeNameFix: true,
  }),
};

const MealMutations = {
  // Wrap single-record mutations to publish events with sourceClientId
  mealCreateOne: wrapMutationAndPublish(
    MealTC.mongooseResolvers.createOne(),
    "MEAL_UPDATED",
  ),
  mealUpdateById: wrapMutationAndPublish(
    MealTC.mongooseResolvers.updateById(),
    "MEAL_UPDATED",
  ),
  mealUpdateOne: wrapMutationAndPublish(
    MealTC.mongooseResolvers.updateOne(),
    "MEAL_UPDATED",
  ),
  mealRemoveById: wrapMutationAndPublish(
    MealTC.mongooseResolvers.removeById(),
    "MEAL_UPDATED", // Publish the removed record state
  ),
  mealRemoveOne: wrapMutationAndPublish(
    MealTC.mongooseResolvers.removeOne(),
    "MEAL_UPDATED", // Publish the removed record state
  ),

  // Keep batch operations unwrapped for simplicity, as they might require different event handling
  mealCreateMany: MealTC.mongooseResolvers.createMany(),
  mealUpdateMany: MealTC.mongooseResolvers.updateMany(),
  mealRemoveMany: MealTC.mongooseResolvers.removeMany(),
};

// Create a type for the subscription payload with sourceClientId
const MealUpdatedPayloadTC = schemaComposer.createObjectTC({
  name: "MealUpdatedPayload",
  fields: {
    mealUpdated: "Meal",
    sourceClientId: "String",
  },
});

const MealSubscriptions = {
  mealUpdated: {
    type: MealUpdatedPayloadTC,
    args: {
      userId: "MongoID!",
    },
    resolve: (payload) => {
      return {
        mealUpdated: payload.mealUpdated,
        sourceClientId: payload.sourceClientId,
      };
    },
    subscribe: (_, { userId }) => {
      // Create a user-specific topic
      const topic = `MEAL_UPDATED.${userId}`;
      return pubsub.asyncIterableIterator(topic);
    },
  },
};

module.exports = {
  MealTC,
  MealQueries,
  MealMutations,
  MealSubscriptions,
};
