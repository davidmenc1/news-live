import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import type { Article, CreateArticlePayload, UpdateArticlePayload, Category } from "../types";
import {
  getAllArticles,
  getArticleById,
  getArticlesByCategory,
  saveArticle,
  updateArticle,
  publishNewArticle,
} from "../services/redis";

const router = Router();

// Valid categories for validation
const VALID_CATEGORIES: Category[] = ["Politics", "Sport", "Tech"];

/**
 * GET /articles
 * Retrieve all articles, optionally filtered by category and/or search query
 * Query params: ?category=Politics|Sport|Tech&search=query
 */
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;

    let articles: Article[];
    
    if (category && typeof category === "string") {
      if (!VALID_CATEGORIES.includes(category as Category)) {
        res.status(400).json({ 
          error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` 
        });
        return;
      }
      articles = await getArticlesByCategory(category);
    } else {
      articles = await getAllArticles();
    }

    // Filter by search query (case-insensitive title search)
    if (search && typeof search === "string" && search.trim()) {
      const query = search.toLowerCase().trim();
      articles = articles.filter((article) =>
        article.title.toLowerCase().includes(query)
      );
    }

    // Sort by creation date (newest first)
    articles.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ error: "Failed to fetch articles" });
  }
});

/**
 * GET /articles/:id
 * Retrieve a single article by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
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
 * Create a new article
 * Body: { title, content, category, author }
 */
router.post("/", async (req, res) => {
  try {
    const { title, content, category, author } = req.body as CreateArticlePayload;

    // Validate required fields
    if (!title || !content || !category || !author) {
      res.status(400).json({ 
        error: "Missing required fields: title, content, category, author" 
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

    const now = new Date().toISOString();
    const article: Article = {
      id: uuidv4(),
      title,
      content,
      category,
      author,
      createdAt: now,
      updatedAt: now,
    };

    // Save to Redis JSON storage
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
 * Update an existing article
 * Body: { title?, content?, category?, author? }
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body as UpdateArticlePayload;

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

export default router;

