import { app } from "@getcronit/pylon";
import { serve } from "@hono/node-server";
import { powerGridResolvers } from "./resolvers/powerGridResolvers.js";
import { schedulerService } from "./services/schedulerService.js";
import { databaseService } from "./services/databaseService.js";

// Graceful shutdown handling
const gracefulShutdown = async () => {
  console.log("Received shutdown signal, cleaning up...");

  try {
    // Stop the scheduler
    schedulerService.stop();

    // Disconnect from database
    await databaseService.disconnect();

    console.log("Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

export const graphql = {
  Query: {
    // Basic hello query
    hello: () => {
      return "Hello from Power Grid Balance Backend!";
    },

    // Power grid balance queries
    ...powerGridResolvers.Query,
  },

  Mutation: {
    // Power grid balance mutations
    ...powerGridResolvers.Mutation,
  },
};

// Start the server
serve(app, (info) => {
  console.log(
    `🔌 Power Grid Balance API running at http://localhost:${info.port}`,
  );
  console.log(
    `📊 GraphQL Playground available at http://localhost:${info.port}/graphql`,
  );

  // Start the scheduler after server is running
  try {
    schedulerService.start();
  } catch (error) {
    console.error("❌ Failed to start scheduler:", error);
  }
});
