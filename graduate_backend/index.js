const express = require("express");
const { ApolloServer } = require("./node_modules/@apollo/server/dist/cjs");
const {
  expressMiddleware,
} = require("./node_modules/@apollo/server/dist/cjs/express4");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const graphqlSchema = require("./graphql/graphqlSchema");
const { ApolloLink } = require("@apollo/client/core");

// Load environment variables
const {
  mongodb_url,
  jwt_secret,
  node_env,
  frontend_url,
  port,
} = require("./utils/env");

// Websocket imports
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/use/ws");
const { execute, subscribe } = require("graphql");
const { createServer } = require("http");

// Create Express app
const app = express();

// Create HTTP server
const httpServer = createServer(app);

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

// Start Apollo Server with Express
async function startServer() {
  await mongoose.connect(mongodb_url);
  console.log(
    `🌿 MongoDB Connected from ${mongodb_url.slice(0, 35)}${mongodb_url.length > 35 ? "..." : ""}`,
  );

  const server = new ApolloServer({
    schema: graphqlSchema,
    introspection: true,
    formatError: (formattedError) => {
      // Custom error formatting
      return {
        message: formattedError.message,
        path: formattedError.path,
        code: formattedError.extensions?.code || "INTERNAL_SERVER_ERROR",
      };
    },
  });

  // Apollo Plugin to remove __typename from variables
  server.addPlugin({
    async requestDidStart(requestContext) {
      if (requestContext.request.variables) {
        const omitTypename = (key, value) =>
          key === "__typename" ? undefined : value;
        requestContext.request.variables = JSON.parse(
          JSON.stringify(requestContext.request.variables),
          omitTypename,
        );
      }

      return {};
    },
  });

  // Add websocket server
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql", // Can share path
  });
  // Import pubsub
  const pubsub = require("./utils/pubsub");

  const serverCleanup = useServer(
    {
      schema: graphqlSchema,
      execute,
      subscribe,
      onConnect: async (ctx) => {
        console.log("Client connected:", ctx.connectionParams);
        return true; // Allow all connections for now
      },
      onDisconnect: async () => {
        console.log("Client disconnected");
      },
      context: async () => {
        // Include pubsub in the context
        return { pubsub };
      },
    },
    wsServer,
  );

  // Start the Apollo Server
  await server.start();

  // Apply middleware
  app.use(
    cors({
      origin: frontend_url || "http://localhost:3000",
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_, res) => {
    res.status(200).json({ status: "ok" });
  });

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
    }),
  );

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({
      error: "Server error",
      message: err.message,
    });
  });

  // Start Express server
  const PORT = port || 4000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(`🕸️  Web sockets ready at ws://localhost:${PORT}/graphql`);
    console.log(`🔒 Authentication enabled`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
