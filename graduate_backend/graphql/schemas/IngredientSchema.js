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


const wrapMutationAndPublish = (resolver, eventName) => {
    return resolver.wrapResolve(next => async (rp) => {
        // rp = resolveParams = { source, args, context, info }
        const { context } = rp;
        console.log(`Context in wrapMutationAndPublish: ${JSON.stringify(rp.args)}`);

        // Only allow user to get their own data (or dev user)
        const currentUserId = context.user?.id; // Safely access user ID from context

        // Allow 'dev' user unconditionally, otherwise check ownership
        if (currentUserId !== 'dev') {
            // Check if the current user ID matches any potential target user ID using optional chaining
            const isOwner = (currentUserId === rp.args?.userId) ||
                    (currentUserId === rp.args?.filter?.userId) ||
                    (currentUserId === rp.args?.record?.userId);

            // If the current user doesn't match any relevant ID, deny access
            if (!isOwner) {
            throw new Error("Unauthorized access: You can only access or modify your own data.");
            }
        }

        // Extract clientId from request headers
        // The exact path to headers might depend on how the context is constructed in your GraphQL server setup.
        // Common paths include context.req.headers or context.headers
        let sourceClientId = rp.context.req.headers['x-client-id'] || null;
        console.log(`Extracted sourceClientId from 'x-client-id' header: ${sourceClientId}`);

        // Call the original resolver
        const payload = await next(rp);

        // After successful mutation, publish the event
        // Ensure payload and record exist, and userId is present for topic targeting
        if (payload && payload.record && payload.record.userId) {
            const topic = `${eventName}.${payload.record.userId}`;
            // Publish the event with the record and the sourceClientId
            pubsub.publish(topic, {
                // The subscription payload expects 'ingredientUpdated'
                ingredientUpdated: payload.record,
                sourceClientId: sourceClientId, // Pass the originating client's ID
            });
        } else if (payload && payload.record && !payload.record.userId) {
            // Log a warning if userId is missing, as the event cannot be targeted correctly
            console.warn(`Mutation ${resolver.name} completed, but userId is missing on the record. Cannot publish event.`);
        }

        return payload;
    });
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