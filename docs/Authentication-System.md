# Authentication System

This document explains how user authentication is implemented in MealGen, covering both backend and frontend aspects of the authentication system.

## Authentication Architecture Overview

MealGen uses a JWT (JSON Web Token) based authentication system with the following components:

1. **Backend Authentication**: JWT generation and validation with MongoDB user storage
2. **Frontend Authentication**: React Context API for global auth state management
3. **Protected Routes**: Route protection for authenticated-only content
4. **API Authorization**: Token-based API access control

## User Model

The authentication system is built around the User model:

```javascript
// UserModel.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

## Password Security

Passwords are securely handled using bcrypt for hashing:

> [!TIP]
> Uses UserSchema.pre hook to hash passwords before saving. pre & post hooks are middleware functions that run before or after certain events in Mongoose. They simplify the process of adding custom logic or operations to your models.

```javascript
// Pre-save hook to hash passwords
UserSchema.pre("save", async function (next) {
  // Only hash the password if it's modified
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
```

## JWT Token Generation

JWT tokens are generated for authenticated users:

```javascript
// Generate JWT token
UserSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    jwt_secret,
    { expiresIn: '7d' }
  );
};
```

## GraphQL Authentication Resolvers

Authentication operations are implemented as GraphQL resolvers:

### Register User

```javascript
// UserSchema.js
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
```

### Login User

```javascript
// UserSchema.js
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
```

## Backend Authentication Middleware

Authentication is handled through Apollo Server's context function on the express path for GraphQL:

> [!WARNING]
> The x-dev-token header is used to bypass authentication in development mode, allowing the Apollo Playground to function without a token. This is useful for testing and development purposes, but should be removed or secured in production.

> [!NOTE]
> This function was a crucial part of connecting the GraphQL server to the authentication system. It ensures that every request to the GraphQL endpoint is authenticated, and it provides the user information in the context for use in resolvers.

```javascript
// JWT authentication middleware
const authenticateUser = async (req) => {
  let token;

  // Get token from header or cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Get token from header
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    // Get token from cookie
    token = req.cookies.token;
  }

  if (!token) {
    return null;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, jwt_secret);
    return decoded;
  } catch (error) {
    // If development, allow apollo playground to work without token
    if (node_env === "development") {
      const devToken = req.headers["x-dev-token"];
      if (devToken) {
        return { id: "dev", role: "admin" }; // Allow access to dev user
      }
    }
    console.error("JWT verification error:", error.message);
    return null;
  }
};

// ... Server setup code

  // Apply Apollo middleware with context
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req, res }) => {
        // Get the user from the token
        const user = await authenticateUser(req);

        return {
          user,
          req,
          res,
        };
      },
    })
  );
```

## Frontend Auth Context

Authentication state is managed using React Context:

- `AuthContext.tsx`: Provides authentication state and methods
    - `useAuth`: Custom hook to access authentication context
    - `AuthProvider`: Context provider component
        - user: Current user object
        - loading: Loading state
        - error: Error message
        - login: Function to log in a user
        - register: Function to register a new user
        - logout: Function to log out a user

## Authentication Services

The authentication service layer handles API communication:

- `authService.ts`: Contains functions for login, registration, and logout
    - `login`: Sends login request to the Apollo server and stores token in localStorage
    - `register`: Sends registration request to the Apollo server and stores token in localStorage
    - `logout`: Removes token from localStorage and resets user state
    - `getCurrentUser`: Retrieves the current user from localStorage
    - `updateUser`: Updates the current user's information in localStorage

## Protected Routes

Protected routes ensure that only authenticated users can access certain pages:

> [!NOTE]
> Setting this up to properly display pages with minimal loading or flickering took time. The solution was to use a combination of loading states and token checks to determine if the user is authenticated or not. This way, the page can be displayed without flickering or showing the wrong content. It uses heuristics like assuming the user is logged in if they have a token, and showing the skeleton of the page until it actually checks the token. It also displays the login page instead of a redirect if the user is not logged in and tries to access a protected route. This may not be preferred in all cases, but it works well for this application.

```typescript
// AuthGuard.tsx
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showLoading, setShowLoading] = useState(true);
  // Check if user has token - this will be used for initial routing decisions
  const [hasToken, setHasToken] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    // For other routes, wait until loading is complete
    if (!loading) {
        console.log("User:", user);
      if (user) {
        // User is successfully authenticated
        if (pathname === "/auth") {
          router.replace("/");
        }
        setNeedsLogin(false); // User is authenticated
      } else {
        // User is not authenticated (either no token or invalid token)
        if (pathname !== "/auth" && pathname !== "/") {
            setNeedsLogin(true);
        }
        setShowLoading(false); // Hide loading state after initial check
      }
    }
  }, [loading, user, router, requireAuth]);

  // Show nothing while checking authentication
  if (loading) {
    // ... Loading state element (e.g., Loading State Display)
  }

  // If we require authentication and user is logged in, show the children
  if (!needsLogin && (showLoading && loading) || (!hasToken && showLoading && !user) || (((!user && loading && hasToken) || user) && pathname === "/auth")) {
    return <>{children}</>;
  }

  if (needsLogin) {
    return <AuthPage />;
  }

  // Otherwise show nothing
  return null;
};

export default AuthGuard;
```

## Authentication UI

The authentication page handles both login and registration:

- `AuthPage.tsx`: Contains the login and registration forms
    - `routeColor`: Determines the color for the page based on the route
    - `handleSubmit`: Handles form submission for login or registration
    - `isLogin`: Boolean to determine if the user is logging in or registering
- Uses the `useAuth` hook to access authentication context and methods


## API Integration

All API requests include authentication tokens when available:

> [!NOTE]
> For development, remote access was possible using TailScale. This was a great way to test the API without needing to set up a local server or database. It also allowed for easy debugging and testing of the API endpoints. Having endpoints in .env meant that I could easily switch between local and remote servers without changing the code. This was a great way to ensure that the API was always accessible and working correctly.

> [!TIP]
> The split function is used to route requests to either the HTTP or WebSocket link based on the operation type. This allows for efficient handling of both queries/mutations and subscriptions.

```typescript
// graphql.ts
// GraphQL endpoint URL, default to http://localhost:4000/graphql if not provided in environment variables
const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';
const ws_endpoint = process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT || 'ws://localhost:4000/graphql';

// Generate a unique client ID for this browser session
export const CLIENT_ID = uuidv4();

// Create an HTTP Link instance for Apollo Client with headers
const httpLink = new HttpLink({
    uri: endpoint,
    credentials: 'include',
});

// Create a WebSocket client instance for subscriptions
const wsLink = new GraphQLWsLink(
    createClient({
      url: ws_endpoint,
      connectionParams: async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        return { token, clientId: CLIENT_ID };
      },
      on: {
        connected: () => console.log('WebSocket connected'),
        closed: () => console.log('WebSocket disconnected'),
        error: (err) => console.error('WebSocket error:', err),
      },
    })
  );

const splitLink = split(
    ({ query }) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
        );
    },
    wsLink,
    httpLink
);

const graphqlClient = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
    credentials: 'include', // Include cookies in the request
    headers: {}, // Default headers
});
```

## Security Considerations

The authentication system implements several security best practices:

1. **Password Hashing**: All passwords are hashed using bcrypt before storage
2. **JWT Expiration**: Tokens expire after a specific time period
3. **Private Password Field**: Password is excluded from query results
4. **HTTPS**: Communication will be encrypted using HTTPS in production
5. **Input Validation**: All user inputs are validated before processing
6. **Auth Guards**: Protected routes prevent unauthorized access
7. **Error Handling**: Generic error messages avoid information leakage

## Key Takeaways

The authentication implementation demonstrates several important concepts:

1. **JWT-based Authentication**: Modern token-based auth instead of sessions
2. **React Context API**: Global state management for authentication
3. **Protected Routing**: Route-based access control
4. **GraphQL Authentication**: Implementing auth in a GraphQL API
5. **Password Security**: Proper password handling with hashing
6. **API Security**: Securing API endpoints with tokens
