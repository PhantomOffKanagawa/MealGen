const { composeMongoose } = require('graphql-compose-mongoose');
const { schemaComposer } = require('graphql-compose');
const customOptions = require('../customOptions');
const User = require('../../mongodb/UserModel');

// Convert Mongoose model to GraphQL TypeComposer
const UserTC = composeMongoose(User, {
  ...customOptions,
  removeFields: ['password'], // Ensure password is not exposed in GraphQL
});

// Auth Type for login/register responses
const AuthPayloadTC = schemaComposer.createObjectTC({
  name: 'AuthPayload',
  fields: {
    token: 'String!',
    user: UserTC,
  },
});

// Define custom queries
console.log('User Resolvers', UserTC.getResolvers());
const UserQueries = {
  userById: UserTC.mongooseResolvers.findById(),
  userByIds: UserTC.mongooseResolvers.findByIds(),
  userOne: UserTC.mongooseResolvers.findOne(),
  userMany: UserTC.mongooseResolvers.findMany(),
  userDataLoader: UserTC.mongooseResolvers.dataLoader(),
  userDataLoaderMany: UserTC.mongooseResolvers.dataLoaderMany(),
  userByIdLean: UserTC.mongooseResolvers.findById({ lean: true }),
  userByIdsLean: UserTC.mongooseResolvers.findByIds({ lean: true }),
  userOneLean: UserTC.mongooseResolvers.findOne({ lean: true }),
  userManyLean: UserTC.mongooseResolvers.findMany({ lean: true }),
  userDataLoaderLean: UserTC.mongooseResolvers.dataLoader({ lean: true }),
  userDataLoaderManyLean: UserTC.mongooseResolvers.dataLoaderMany({ lean: true }),
  userCount: UserTC.mongooseResolvers.count(),
  userConnection: UserTC.mongooseResolvers.connection(),
  userPagination: UserTC.mongooseResolvers.pagination(),
  
  // Custom query to get the current authenticated user
  me: {
    type: UserTC,
    resolve: async (_, args, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      return await User.findById(context.user.id);
    }
  },
};

const UserMutations = {
  userCreateOne: UserTC.mongooseResolvers.createOne(),
  userCreateMany: UserTC.mongooseResolvers.createMany(),
  userUpdateById: UserTC.mongooseResolvers.updateById(),
  userUpdateOne: UserTC.mongooseResolvers.updateOne(),
  userUpdateMany: UserTC.mongooseResolvers.updateMany(),
  userRemoveById: UserTC.mongooseResolvers.removeById(),
  userRemoveOne: UserTC.mongooseResolvers.removeOne(),
  userRemoveMany: UserTC.mongooseResolvers.removeMany(),
  
  // Register new user
  register: {
    type: AuthPayloadTC,
    args: {
      name: 'String!',
      email: 'String!',
      password: 'String!',
      age: 'Int',
    },
    resolve: async (_, args) => {
      // Check if user already exists
      const existingUser = await User.findOne({ email: args.email });
      if (existingUser) {
        throw new Error('User already exists with this email');
      }
      
      // Create new user
      const user = await User.create(args);
      const token = user.generateAuthToken();
      
      return {
        token,
        user,
      };
    }
  },
  
  // Login user
  login: {
    type: AuthPayloadTC,
    args: {
      email: 'String!',
      password: 'String!',
    },
    resolve: async (_, { email, password }) => {
      // Find user by email
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      // Check password
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }
      
      // Update last login time
      user.lastLogin = Date.now();
      await user.save();
      
      const token = user.generateAuthToken();
      
      return {
        token,
        user,
      };
    }
  },
  
  // Update current user profile
  updateProfile: {
    type: UserTC,
    args: {
      name: 'String',
      age: 'Int',
    },
    resolve: async (_, args, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      
      const updatedUser = await User.findByIdAndUpdate(
        context.user.id,
        { ...args },
        { new: true, runValidators: true }
      );
      
      return updatedUser;
    }
  },
  
  // Change password
  changePassword: {
    type: 'Boolean',
    args: {
      currentPassword: 'String!',
      newPassword: 'String!',
    },
    resolve: async (_, { currentPassword, newPassword }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      
      const user = await User.findById(context.user.id).select('+password');
      
      // Verify current password
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        throw new Error('Current password is incorrect');
      }
      
      // Set new password
      user.password = newPassword;
      await user.save();
      
      return true;
    }
  },
};

module.exports = {
  UserTC,
  UserQueries,
  UserMutations,
  AuthPayloadTC,
};