import type { Server } from "socket.io";
import { subscriberClient, NEWS_CHANNEL } from "./services/redis";
import type { NewArticleMessage } from "./types";

/**
 * Set up Socket.io event handlers and Redis Pub/Sub subscription
 * 
 * This creates the real-time communication bridge:
 * 1. Backend publishes to Redis channel when new article is created
 * 2. This subscriber receives the message from Redis
 * 3. Socket.io broadcasts to all connected frontend clients
 */
export function setupSocketHandlers(io: Server): void {
  // Handle new client connections
  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle client disconnection
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Subscribe to Redis Pub/Sub channel for new article notifications
  subscriberClient.subscribe(NEWS_CHANNEL, (message) => {
    try {
      const data: NewArticleMessage = JSON.parse(message);
      
      if (data.type === "new_article") {
        // Broadcast to all connected clients
        io.emit("new_article", data.article);
        console.log(`Broadcasted new article to ${io.engine.clientsCount} clients`);
      }
    } catch (error) {
      console.error("Error processing Pub/Sub message:", error);
    }
  });

  console.log(`Subscribed to Redis channel: ${NEWS_CHANNEL}`);
}

