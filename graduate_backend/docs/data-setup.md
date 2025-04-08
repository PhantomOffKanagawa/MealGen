# Data Setup and Schema Implementation Guide

This document outlines how to create and implement a new data model with GraphQL in our application using the MongoDB, Mongoose, and GraphQL Compose stack.

## Architecture Overview

Our application uses a three-layer architecture for data handling:

1. **MongoDB Model Layer**: Defines the database schema using Mongoose
2. **GraphQL Schema Layer**: Converts Mongoose models to GraphQL types using graphql-compose-mongoose
3. **GraphQL Schema Composition**: Combines all schemas into a unified GraphQL API

## Step 1: Create a MongoDB/Mongoose Model

First, create a new model file in the `mongodb` directory following this pattern:

```javascript
// Example: mongodb/ProductModel.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['electronics', 'clothing', 'food', 'other']
  },
  inStock: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add any indexes if needed
ProductSchema.index({ name: 'text', description: 'text' });

// Add any instance methods if needed
ProductSchema.methods.isDiscounted = function() {
  return this.price < 50;
};

// Add any static methods if needed
ProductSchema.statics.findByCategory = function(category) {
  return this.find({ category });
};

const Product = mongoose.model('Product', ProductSchema);
module.exports = Product;
```

### Key Components of a Model:

- **Schema Definition**: Define the fields and their types
- **Validation**: Add validators like `required`, `min`, `max`, etc.
- **Indexes**: Improve query performance with `index: true` or `Schema.index()`
- **Methods**: Add instance and static methods for logic

## Step 2: Create a GraphQL Schema

Next, create a new schema file in the `graphql/schemas` directory:

```javascript
// Example: graphql/schemas/ProductSchema.js
const { composeMongoose } = require('graphql-compose-mongoose');
const customOptions = require('../customOptions');
const Product = require('../../mongodb/ProductModel');

// Convert Mongoose model to GraphQL TypeComposer
const ProductTC = composeMongoose(Product, customOptions);

// Define custom queries
const ProductQueries = {
  productById: ProductTC.mongooseResolvers.findById(),
  productByIds: ProductTC.mongooseResolvers.findByIds(),
  productOne: ProductTC.mongooseResolvers.findOne(),
  productMany: ProductTC.mongooseResolvers.findMany(),
  productCount: ProductTC.mongooseResolvers.count(),
  productConnection: ProductTC.mongooseResolvers.connection(),
  productPagination: ProductTC.mongooseResolvers.pagination(),
  
  // Custom query example
  productsByCategory: ProductTC.addResolver({
    name: 'findByCategory',
    args: { category: 'String!' },
    type: [ProductTC],
    resolve: async ({ args }) => {
      return await Product.findByCategory(args.category);
    }
  }).getResolver('findByCategory'),
};

// Define mutations
const ProductMutations = {
  productCreateOne: ProductTC.mongooseResolvers.createOne(),
  productCreateMany: ProductTC.mongooseResolvers.createMany(),
  productUpdateById: ProductTC.mongooseResolvers.updateById(),
  productUpdateOne: ProductTC.mongooseResolvers.updateOne(),
  productUpdateMany: ProductTC.mongooseResolvers.updateMany(),
  productRemoveById: ProductTC.mongooseResolvers.removeById(),
  productRemoveOne: ProductTC.mongooseResolvers.removeOne(),
  productRemoveMany: ProductTC.mongooseResolvers.removeMany(),
  
  // Custom mutation example
  toggleProductStock: ProductTC.addResolver({
    name: 'toggleStock',
    args: { productId: 'MongoID!' },
    type: ProductTC,
    resolve: async ({ args }) => {
      const product = await Product.findById(args.productId);
      product.inStock = !product.inStock;
      return product.save();
    }
  }).getResolver('toggleStock'),
};

module.exports = {
  ProductTC,
  ProductQueries,
  ProductMutations,
};
```

### Key Components of a GraphQL Schema:

- **TypeComposer**: Created with `composeMongoose` to convert the Mongoose model to a GraphQL type
- **Standard Resolvers**: Built-in resolvers like `findById`, `createOne`, etc.
- **Custom Resolvers**: Add custom logic with `addResolver` for specific business requirements

## Step 3: Update the Main GraphQL Schema

Finally, import and add your new schema to the main GraphQL schema in `graphql/graphqlSchema.js`:

```javascript
const { schemaComposer } = require('graphql-compose');

const { UserTC, UserQueries, UserMutations } = require('./schemas/UserSchema');
const { ProductTC, ProductQueries, ProductMutations } = require('./schemas/ProductSchema');

schemaComposer.Query.addFields({
  ...UserQueries,
  ...ProductQueries,
  // Add other queries here
});

schemaComposer.Mutation.addFields({
  ...UserMutations,
  ...ProductMutations,
  // Add other mutations here
});

// Add relationships between types if necessary
UserTC.addFields({
  products: {
    type: [ProductTC],
    resolve: async (user) => {
      return await Product.find({ userId: user._id });
    }
  }
});

ProductTC.addFields({
  user: {
    type: UserTC,
    resolve: async (product) => {
      return await User.findById(product.userId);
    }
  }
});

const graphqlSchema = schemaComposer.buildSchema();
module.exports = graphqlSchema;
```

### Key Steps for Schema Integration:

1. Import the new schema components
2. Add queries and mutations to `schemaComposer`
3. Define relationships between types if needed
4. Build and export the final schema

## Advanced Features

### 1. Field-level Customization

You can customize individual fields in your GraphQL schema:

```javascript
ProductTC.extendField('description', {
  description: 'Product description text',
  deprecationReason: 'Use fullDescription instead',
});

ProductTC.removeField('secretField');
```

### 2. Adding Custom Resolvers

Beyond the standard CRUD operations, you can add custom resolvers:

```javascript
ProductTC.addResolver({
  name: 'searchByKeyword',
  args: { keyword: 'String!' },
  type: [ProductTC],
  resolve: async ({ args }) => {
    return await Product.find({
      $text: { $search: args.keyword }
    });
  }
});
```

### 3. Adding Middleware/Hooks

Add middleware for authentication, validation, or logging:

```javascript
ProductTC.wrapResolver('createOne', {
  beforeResolver: async (next, source, args, context) => {
    // Check permissions
    if (!context.isAuthenticated) throw new Error('Not authenticated');
    return next();
  },
  afterResolver: async (next, source, args, context, info, result) => {
    // Log the operation
    console.log(`Product created: ${result._id}`);
    return next();
  },
});
```

## Testing Your Schema

You can test your GraphQL schema using tools like Apollo Explorer, GraphiQL, or Postman:

```graphql
# Query example
query {
  productById(_id: "60d21b4667d0d8992e610c85") {
    _id
    name
    price
    inStock
  }
}

# Mutation example
mutation {
  productCreateOne(record: {
    name: "New Product",
    description: "Product description",
    price: 99.99,
    category: "electronics"
  }) {
    record {
      _id
      name
    }
  }
}
```

## Complete Implementation Example

Following the pattern in our existing files, creating a new complete data schema requires:

1. A Mongoose model that defines the database structure
2. A GraphQL schema that defines the API interactions
3. Integration with the main GraphQL schema

By following these steps consistently, you can easily extend the application with new data models while maintaining a clean architecture and type safety.
