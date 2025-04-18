const pubsub = require("../utils/pubsub"); // Adjust the path as necessary

customOptions = {};

const wrapMutationAndPublish = (resolver, eventName) => {
  return resolver.wrapResolve((next) => async (rp) => {
    // rp = resolveParams = { source, args, context, info }
    const { context } = rp;

    // Only allow user to get their own data (or dev user)
    const currentUserId = context.user?.id; // Safely access user ID from context
    const accessedUserId =
      rp.args?.userId || rp.args?.filter?.userId || rp.args?.record?.userId;

    // Allow 'dev' user unconditionally, otherwise check ownership
    if (currentUserId !== "dev") {
      // Check if the current user ID matches any potential target user ID using optional chaining
      const isOwner = currentUserId === accessedUserId;

      // If the current user doesn't match any relevant ID, deny access
      if (!isOwner) {
        throw new Error(
          "Unauthorized access: You can only access or modify your own data.",
        );
      }
    }

    // Extract clientId from request headers
    // The exact path to headers might depend on how the context is constructed in your GraphQL server setup.
    // Common paths include context.req.headers or context.headers
    let sourceClientId = rp.context.req.headers["x-client-id"] || null;

    // Call the original resolver
    const payload = await next(rp);

    // After successful mutation, publish the event
    // Ensure payload and record exist, and userId is present for topic targeting
    if (payload && accessedUserId) {
      const topic = `${eventName}.${accessedUserId}`; // Publish the event with the record and the sourceClientId
      pubsub.publish(topic, {
        // The subscription payload depends on the event type
        // TODO: Add more event types as needed (currently doesn't use this info so not needed)
        ...(eventName === "INGREDIENT_UPDATED"
          ? { ingredientUpdated: payload.record }
          : { mealUpdated: payload.record }),
        sourceClientId: sourceClientId, // Pass the originating client's ID
      });
    } else if (payload && payload.record && !accessedUserId) {
      // Log a warning if userId is missing, as the event cannot be targeted correctly
      console.warn(
        `Mutation ${resolver.name} completed, but userId is missing on the record. Cannot publish event.`,
      );
    }

    return payload;
  });
};

module.exports = { wrapMutationAndPublish, customOptions };
