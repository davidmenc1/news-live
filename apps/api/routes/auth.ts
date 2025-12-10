import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import type { RegisterPayload, LoginPayload, User } from "../types";
import {
  createUser,
  getUserByEmail,
  emailExists,
  toPublicUser,
  createSession,
  deleteSession,
} from "../services/redis";

const router = Router();

/**
 * POST /auth/register
 * Register a new user account
 */
router.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body as RegisterPayload;

    // Validate required fields
    if (!email || !username || !password) {
      res.status(400).json({ 
        error: "Missing required fields: email, username, password" 
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    // Validate password strength (min 8 characters)
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    // Check if email already exists
    if (await emailExists(email)) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    // Hash password (using Bun's built-in password hashing)
    const passwordHash = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    // Create user
    const now = new Date().toISOString();
    const user: User = {
      id: uuidv4(),
      email,
      username,
      passwordHash,
      createdAt: now,
    };

    await createUser(user);

    // Create session token
    const token = uuidv4();
    await createSession(token, user.id);

    res.status(201).json({
      user: toPublicUser(user),
      token,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

/**
 * POST /auth/login
 * Login with email and password
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as LoginPayload;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ 
        error: "Missing required fields: email, password" 
      });
      return;
    }

    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Verify password
    const isValid = await Bun.password.verify(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Create session token
    const token = uuidv4();
    await createSession(token, user.id);

    res.json({
      user: toPublicUser(user),
      token,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

/**
 * POST /auth/logout
 * Logout and invalidate session
 */
router.post("/logout", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (token) {
      await deleteSession(token);
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ error: "Failed to logout" });
  }
});

/**
 * GET /auth/me
 * Get current authenticated user
 */
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      res.status(401).json({ error: "Missing authorization token" });
      return;
    }

    // Import here to avoid circular dependency
    const { getUserIdFromSession, getUserById } = await import("../services/redis");
    
    // Get user ID from session
    const userId = await getUserIdFromSession(token);
    if (!userId) {
      res.status(401).json({ error: "Invalid or expired session" });
      return;
    }

    // Get user details
    const user = await getUserById(userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    res.json({
      user: toPublicUser(user),
      token,
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
