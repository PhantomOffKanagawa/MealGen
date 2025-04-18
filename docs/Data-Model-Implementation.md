# Data Model Implementation

This document explains how data models are implemented in MealGen using MongoDB and Mongoose, and how they're exposed through GraphQL.

## Data Architecture Overview

MealGen follows a three-layer data architecture:

1. **MongoDB Models**: Define the database schema using Mongoose
2. **GraphQL Types**: Convert Mongoose models to GraphQL types using GraphQL Compose
3. **GraphQL Operations**: Define queries, mutations, and subscriptions for data access

This approach ensures consistency between the database and API while minimizing code duplication.

## Core Data Models

### User

Users represent registered accounts in the system with authentication information.

#### MongoDB Schema

```javascript
// UserModel.js
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true,
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please provide a valid email",
    ],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false, // Don't return password by default
  },
  age: {
    type: Number,
    min: 0,
    max: 120,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});
```

#### Key Features

- Password hashing with bcrypt
- JWT token generation for authentication
- Password verification methods

### Ingredient

Ingredients represent food items with nutritional information and cost.

#### MongoDB Schema

```javascript
// IngredientModel.js
const IngredientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  quantity: {
    type: Number,
    min: 0,
  },
  unit: {
    type: String,
    required: true,
    maxlength: 10,
    // enum: ['g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'oz', 'lb']
  },
  macros: {
    calories: {
      type: Number,
      min: 0,
      max: 10000,
      required: true,
    },
    protein: {
      type: Number,
      min: 0,
      max: 500,
      required: true,
    },
    carbs: {
      type: Number,
      min: 0,
      max: 500,
      required: true,
    },
    fat: {
      type: Number,
      min: 0,
      max: 500,
      required: true,
    },
  },
  price: {
    type: Number,
    min: 0,
  },
});
```

#### Key Features

- Nutritional information (calories, protein, carbs, fat)
- Quantity and unit of measurement
- Optional enum for unit types

### Meal

Meals are collections of ingredients with calculated nutritional information.

#### MongoDB Schema

```javascript
// MealModel.js
const MealIngredientSchema = new mongoose.Schema(
  {
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ingredient",
      required: true,
    },
    quantity: {
      type: Number,
      min: 0,
      required: true,
    },
  },
  { _id: false }
);

const MealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  ingredients: [MealIngredientSchema],
  macros: {
    calories: {
      type: Number,
      min: 0,
      max: 10000,
      required: true,
    },
    protein: {
      type: Number,
      min: 0,
      max: 500,
      required: true,
    },
    carbs: {
      type: Number,
      min: 0,
      max: 500,
      required: true,
    },
    fat: {
      type: Number,
      min: 0,
      max: 500,
      required: true,
    },
  },
  price: {
    type: Number,
    min: 0,
  },
});
```

#### Key Features

- Nutritional information (calories, protein, carbs, fat)
- Ingredient references with quantities
- Price calculation based on ingredient prices (on the frontend)

### MealPlan

Meal plans organize ingredients and meals into groups for organized planning.

#### MongoDB Schema

```javascript
// MealPlanModel.js
const MealPlanItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["ingredient", "meal"],
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "type",
    },
    quantity: {
      type: Number,
      min: 0,
      required: true,
    },
    group: {
      type: String,
      default: "General",
    },
  },
  { _id: false }
);

const MealPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  items: [MealPlanItemSchema],
  macros: {
    calories: {
      type: Number,
      min: 0,
      max: 10000,
      default: 0,
    },
    protein: {
      type: Number,
      min: 0,
      max: 500,
      default: 0,
    },
    carbs: {
      type: Number,
      min: 0,
      max: 500,
      default: 0,
    },
    fat: {
      type: Number,
      min: 0,
      max: 500,
      default: 0,
    },
  },
  price: {
    type: Number,
    min: 0,
    default: 0,
  },
});
```

#### Key Features

- Supports both ingredients and meals
- Grouping of items for better organization
- Nutritional information and price calculation (on the frontend)

> [!NOTE]
> Nutritional information can be calculated in middleware for MongoDB but this would only update the database when the meal plan itself is saved. For more relevant timing, it is calculated on the frontend when the meal plan is created or updated.

## Relationships Between Models

The data models in MealGen are related in the following way:

```
User
 ↓
 ├── owns → Ingredients
 │           ↓
 ├── owns → Meals (contain ingredients)
 │           ↓
 └── owns → MealPlans (contain meals and/or ingredients)
```

## Converting to GraphQL Types

The MongoDB models are converted to GraphQL types using the GraphQL Compose library. This creates a bridge between the database schema and the API schema.

> [!TIP]
> GraphQL Compose is a powerful library that simplifies the process of creating GraphQL schemas from existing data models. It saves a lot of time and headache from ensuring parity between 3+ sets of type definitions.

#### Example: Ingredient to GraphQL Type

```javascript
// IngredientSchema.js
const { composeMongoose } = require("graphql-compose-mongoose");
const { schemaComposer } = require("graphql-compose");
const customOptions = require("../customOptions");
const Ingredient = require("../../mongodb/IngredientModel");
const pubsub = require("../../utils/pubsub");
const { wrapMutationAndPublish } = require("../customOptions");

// Create GraphQL type from Mongoose model
const IngredientTC = composeMongoose(Ingredient, customOptions);
```

## Data Validation

Data validation happens at multiple levels:

1. **MongoDB Schema Validation**: Using Mongoose's built-in validators
2. **GraphQL Input Validation**: Using GraphQL type definitions
3. **Application-level Validation**: In resolver functions
4. **Frontend Validation**: Inputs have validation rules

Example of validation in Mongoose schema:

```javascript
quantity: {
    type: Number,
    min: 0,
    required: true,
}
```

## Data Privacy and Security

Data privacy is maintained through several mechanisms:

1. **User-Specific Queries**: Most queries filter by the current user's ID
2. **Authentication Middleware**: Protecting API endpoints
3. **Field-Level Permissions**: Controlling access to specific fields
4. **User Scope Management**: Ensuring users can only access their own data
5. **Role-Based Access Control**: Different roles (user/admin) have different permissions

> [!TIP]
> The most difficult part of setting up security is ensuring that the userId is always set correctly and always accessible. This is done by placing maximal burden on the GraphQL resolvers where context can contain the userId.

## TypeScript Interfaces

On the frontend, TypeScript interfaces ensure type safety when working with the data:

```typescript
// ingredientService.ts
export interface Ingredient {
  _id: string;
  userId: string;
  name: string;
  quantity: number;
  unit: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  price: number;
}
```

## Key Takeaways

The data modeling approach demonstrates several valuable concepts:

1. **NoSQL Data Modeling**: Designing effective schemas for MongoDB
2. **Schema Validation**: Using Mongoose's validation capabilities
3. **GraphQL Type Generation**: Automating GraphQL schema creation
4. **Type Safety**: Ensuring consistent types across backend and frontend
5. **Relational Data in NoSQL**: Managing relationships in a document database
6. **Real-time Data**: Implementing subscriptions for live updates
7. **Data Privacy**: Ensuring user-specific data access and security
8. **Authentication**: Integrating authentication into data access patterns
