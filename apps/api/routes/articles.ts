import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import type { Article, CreateArticlePayload, UpdateArticlePayload, Category } from "../types";
import {
  getAllArticles,
  getArticleById,
  getArticlesByCategory,
  searchArticlesByTitle,
  saveArticle,
  updateArticle,
  deleteArticle,
  publishNewArticle,
} from "../services/redis";
import { requireAuth, optionalAuth } from "../middleware/auth";

const router = Router();

// Valid categories for validation
const VALID_CATEGORIES: Category[] = ["Politics", "Sport", "Tech"];

/**
 * GET /articles
 * Retrieve all articles, optionally filtered by category and/or search query
 * Query params: ?category=Politics|Sport|Tech&search=query
 * Public endpoint (no auth required)
 */
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;

    let articles: Article[];
    
    if (search && typeof search === "string" && search.trim()) {
      // Use Redis-based title search
      articles = await searchArticlesByTitle(search.trim());
    } else if (category && typeof category === "string") {
      // Validate category
      if (!VALID_CATEGORIES.includes(category as Category)) {
        res.status(400).json({ 
          error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` 
        });
        return;
      }
      // Use Redis set-based category filtering (already sorted)
      articles = await getArticlesByCategory(category);
    } else {
      // Use Redis sorted set (already sorted by date, newest first)
      articles = await getAllArticles();
    }

    res.json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ error: "Failed to fetch articles" });
  }
});

/**
 * GET /articles/:id
 * Retrieve a single article by ID
 * Public endpoint (no auth required)
 */
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "Missing article ID" });
      return;
    }
    const article = await getArticleById(id);

    if (!article) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    res.json(article);
  } catch (error) {
    console.error("Error fetching article:", error);
    res.status(500).json({ error: "Failed to fetch article" });
  }
});

/**
 * POST /articles
 * Create a new article (requires authentication)
 * Body: { title, content, category }
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, content, category } = req.body as CreateArticlePayload;

    // Validate required fields
    if (!title || !content || !category) {
      res.status(400).json({ 
        error: "Missing required fields: title, content, category" 
      });
      return;
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ 
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` 
      });
      return;
    }

    // requireAuth middleware ensures userId and user are set
    if (!req.userId || !req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const now = new Date().toISOString();
    const article: Article = {
      id: uuidv4(),
      title,
      content,
      category,
      authorId: req.userId,
      authorName: req.user.username,
      createdAt: now,
      updatedAt: now,
    };

    // Save to Redis using native data structures (sorted sets + category sets)
    await saveArticle(article);

    // Publish to Redis Pub/Sub for real-time notifications
    await publishNewArticle(article);

    res.status(201).json(article);
  } catch (error) {
    console.error("Error creating article:", error);
    res.status(500).json({ error: "Failed to create article" });
  }
});

/**
 * PUT /articles/:id
 * Update an existing article (requires authentication and ownership)
 * Body: { title?, content?, category? }
 */
router.put("/:id", requireAuth, async (req, res) => {
  try {
    // requireAuth middleware ensures userId is set
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = req.userId; // capture for TypeScript
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "Missing article ID" });
      return;
    }

    const updates = req.body as UpdateArticlePayload;

    // Get existing article to check ownership
    const existingArticle = await getArticleById(id);
    if (!existingArticle) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    // Check if user owns the article
    if (existingArticle.authorId !== userId) {
      res.status(403).json({ error: "You can only update your own articles" });
      return;
    }

    // Validate category if provided
    if (updates.category && !VALID_CATEGORIES.includes(updates.category)) {
      res.status(400).json({ 
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` 
      });
      return;
    }

    const updatedArticle = await updateArticle(id, updates);

    if (!updatedArticle) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    res.json(updatedArticle);
  } catch (error) {
    console.error("Error updating article:", error);
    res.status(500).json({ error: "Failed to update article" });
  }
});

/**
 * DELETE /articles/:id
 * Delete an article (requires authentication and ownership)
 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    // requireAuth middleware ensures userId is set
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = req.userId; // capture for TypeScript
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "Missing article ID" });
      return;
    }

    // Get existing article to check ownership
    const existingArticle = await getArticleById(id);
    if (!existingArticle) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    // Check if user owns the article
    if (existingArticle.authorId !== userId) {
      res.status(403).json({ error: "You can only delete your own articles" });
      return;
    }

    await deleteArticle(id);

    res.json({ message: "Article deleted successfully" });
  } catch (error) {
    console.error("Error deleting article:", error);
    res.status(500).json({ error: "Failed to delete article" });
  }
});

export default router;

