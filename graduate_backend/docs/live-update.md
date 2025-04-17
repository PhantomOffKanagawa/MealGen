# Live Update System Implementation Guide

This document provides a detailed walkthrough of implementing a real-time update system for a GraphQL-based application using subscriptions. The implementation allows users to receive instant updates when data changes, without requiring manual page refreshes.

## Table of Contents

1. [Overview](#overview)
2. [Backend Implementation](#backend-implementation)
   - [Schema Modifications](#schema-modifications)
   - [Subscription Setup](#subscription-setup)
   - [Event Publishing](#event-publishing)
3. [Frontend Implementation](#frontend-implementation)
   - [GraphQL Client Setup](#graphql-client-setup)
   - [Subscription Integration](#subscription-integration)
   - [UI Updates](#ui-updates)
4. [Workflow](#workflow)
5. [Testing](#testing)

## Overview

The live update system enables real-time communication between clients and the server. When one user makes a change (create, update, delete) to a resource, other users viewing the same data will instantly see those changes.

This system is built using:
- GraphQL subscriptions for real-time data updates
- Apollo Client for subscription handling on the frontend
- PubSub mechanism for event broadcasting on the backend
- User-specific topic channels to ensure data privacy

## Backend Implementation

### Schema Modifications

#### 1. Update Schema Definition Files

**File: `graphql/schemas/MealSchema.js`**

Added imports for the subscription functionality:

```javascript
const { composeMongoose } = require('graphql-compose-mongoose');
const { schemaComposer } = require('graphql-compose');
const customOptions = require('../customOptions');
const Meal = require('../../mongodb/MealModel');
const pubsub = require('../../utils/pubsub');
const { wrapMutationAndPublish } = require('../customOptions');
```

#### 2. Wrap Mutations to Publish Events

Modified the mutation resolvers to publish events when data changes:

```javascript
const MealMutations = {
    // Wrap single-record mutations to publish events with sourceClientId
    mealCreateOne: wrapMutationAndPublish(
        MealTC.mongooseResolvers.createOne(),
        'MEAL_UPDATED'
    ),
    mealUpdateById: wrapMutationAndPublish(
        MealTC.mongooseResolvers.updateById(),
        'MEAL_UPDATED'
    ),
    mealUpdateOne: wrapMutationAndPublish(
        MealTC.mongooseResolvers.updateOne(),
        'MEAL_UPDATED'
    ),
    mealRemoveById: wrapMutationAndPublish(
        MealTC.mongooseResolvers.removeById(),
        'MEAL_UPDATED'
    ),
    mealRemoveOne: wrapMutationAndPublish(
        MealTC.mongooseResolvers.removeOne(),
        'MEAL_UPDATED'
    ),
    
    // Keep batch operations unwrapped for simplicity
    mealCreateMany: MealTC.mongooseResolvers.createMany(),
    mealUpdateMany: MealTC.mongooseResolvers.updateMany(),
    mealRemoveMany: MealTC.mongooseResolvers.removeMany(),
};
```

#### 3. Define Subscription Types

Created a payload type and subscription definition:

```javascript
// Create a type for the subscription payload with sourceClientId
const MealUpdatedPayloadTC = schemaComposer.createObjectTC({
    name: 'MealUpdatedPayload',
    fields: {
        mealUpdated: 'Meal',
        sourceClientId: 'String',
    },
});

const MealSubscriptions = {
    mealUpdated: {
        type: MealUpdatedPayloadTC,
        args: {
            userId: 'MongoID!'
        },
        resolve: payload => {
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
```

#### 4. Export Subscription Definitions

Updated the module exports to include subscriptions:

```javascript
module.exports = {
    MealTC,
    MealQueries,
    MealMutations,
    MealSubscriptions,
};
```

### Subscription Setup

#### 1. Update the Main GraphQL Schema

**File: `graphql/graphqlSchema.js`**

Updated imports to include the meal subscriptions:

```javascript
const { MealTC, MealQueries, MealMutations, MealSubscriptions } = require('./schemas/MealSchema');
```

Added meal subscriptions to the schema:

```javascript
schemaComposer.Subscription.addFields({
    ...IngredientSubscriptions,
    ...MealSubscriptions,
});
```

### Event Publishing

#### 1. Create a Dynamic Event Publisher

**File: `graphql/customOptions.js`**

Modified the `wrapMutationAndPublish` function to dynamically handle different event types:

```javascript
// Publish the event with the record and the sourceClientId
pubsub.publish(topic, {
    // The subscription payload depends on the event type
    ...(eventName === 'INGREDIENT_UPDATED' 
        ? { ingredientUpdated: payload.record } 
        : { mealUpdated: payload.record }),
    sourceClientId: sourceClientId, // Pass the originating client's ID
});
```

## Frontend Implementation

### GraphQL Client Setup

#### 1. Update Service Definitions

**File: `src/services/mealService.ts`**

Added imports for Apollo Client:

```typescript
import { gql as graphqlRequestGql } from "graphql-request";
import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { useMutation, gql, useQuery, useSubscription } from "@apollo/client";
```

#### 2. Define Subscription Query

Added a GraphQL subscription query:

```typescript
// GraphQL subscription to listen for updated meals
export const MEAL_UPDATED = gql`
  subscription MealSubscription($userId: MongoID!) {
    mealUpdated(userId: $userId) {
      mealUpdated {
        userId
        name
        ingredients {
          ingredientId
          quantity
        }
        macros {
          calories
          protein
          carbs
          fat
        }
        price
        _id
      }
      sourceClientId
    }
  }
`;
```

### Subscription Integration

#### 1. Integrate Subscription in Component

**File: `src/app/meals/page.tsx`**

Updated imports to include necessary Apollo hooks and subscription query:

```typescript
import { useSubscription, gql } from "@apollo/client";
import { 
  getAllMeals, 
  createMeal, 
  updateMeal, 
  deleteMeal,
  Meal,
  MealIngredient,
  MEAL_UPDATED
} from '../../services/mealService';
```

#### 2. Add Subscription Hook to Component

Added the useSubscription hook to listen for updates:

```typescript
// Set up subscription for real-time meal updates
const { data: subscriptionData } = useSubscription(MEAL_UPDATED, {
  skip: !user?._id,
  variables: { userId: user?._id },
  onData: ({ data }) => {
    const { mealUpdated } = data?.data || {};
    
    if (mealUpdated && mealUpdated.sourceClientId !== CLIENT_ID) {
      console.log('Received meal update from server:', mealUpdated);
      
      // Fetch the latest meals data after receiving an update
      fetchMeals();
      
      setSnackbar({
        open: true,
        message: 'Meal data was updated',
        severity: 'info'
      });
    }
  }
});
```

### UI Updates

#### 1. Enhanced Snackbar Component

Updated the snackbar state to support info messages for subscriptions:

```typescript
const [snackbar, setSnackbar] = useState({
  open: false,
  message: '',
  severity: 'success' as 'success' | 'error' | 'info'
});
```

## Workflow

The workflow for the live updates system follows these steps:

1. **Client Mutation**: A client performs a mutation (create, update, delete) on a resource.
2. **Server Processing**: The server processes the mutation and applies the changes to the database.
3. **Event Publication**: The server publishes an event to a topic specific to the resource type and user ID.
4. **Event Filtering**: The event includes the client ID of the source, allowing other clients to filter out self-triggered events.
5. **Subscription Updates**: Other clients subscribed to the same topic receive the update.
6. **UI Refresh**: The receiving clients update their UI with the new data and show a notification.

## Testing

To test the live update system:

1. Open two browser windows or devices logged in with the same user account.
2. Make changes in one window (create, update, or delete a meal).
3. Observe the changes automatically reflecting in the other window without requiring a manual refresh.
4. Verify that notifications appear when changes are detected.

## Why This Approach?

- **User-Specific Channels**: Using user ID in the topic name ensures users only receive updates for their own data, enhancing security and privacy.
- **Source Client Identification**: Including the source client ID prevents duplicate notifications when a client triggers its own updates.
- **Reusing Structure**: The implementation follows the same pattern as the ingredients system, maintaining consistency across the application.
- **Selective Updates**: Only single-record operations trigger live updates, avoiding potential performance issues with batch operations.

This implementation creates a seamless real-time experience while maintaining the benefits of GraphQL's declarative data fetching model.
