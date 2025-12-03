import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { connectRedis } from "./services/redis";
import { setupSocketHandlers } from "./sockets";
import articlesRouter from "./routes/articles";

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 8080;

// Configure CORS for both Express and Socket.io
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

// Initialize Socket.io with CORS configuration
const io = new Server(httpServer, {
  cors: corsOptions,
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "NewsLive API is running" });
});

// API routes
app.use("/articles", articlesRouter);

// Start server
async function start() {
  try {
    // Connect to Redis
    await connectRedis();

    // Set up Socket.io handlers and Redis Pub/Sub subscription
    setupSocketHandlers(io);

    // Start HTTP server
    httpServer.listen(port, () => {
      console.log(`NewsLive API listening on port ${port}`);
      console.log(`WebSocket server ready`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
