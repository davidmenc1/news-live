import { createClient } from "redis";
import type { Article, NewArticleMessage, User, PublicUser } from "../types";

// Redis connection URL - uses environment variable or defaults to localhost
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Channel name for publishing new article notifications
export const NEWS_CHANNEL = "news_updates";

// Redis key patterns (Redis-native approach)
const KEYS = {
  // Article keys - each article stored individually
  article: (id: string) => `article:${id}`,
  
  // Sorted set: articles sorted by creation timestamp (newest first)
  articlesByDate: "articles:by_date",
  
  // Sets: articles grouped by category for fast filtering
  articlesByCategory: (category: string) => `articles:category:${category}`,
  
  // User keys
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  usersSet: "users:all",
  
  // Sessions
  session: (token: string) => `session:${token}`,
};

/**
 * Main Redis client for data operations
 */
export const redisClient = createClient({ url: REDIS_URL });

/**
 * Separate Redis client for Pub/Sub subscriber
 */
export const subscriberClient = createClient({ url: REDIS_URL });

/**
 * Initialize Redis connections
 */
export async function connectRedis(): Promise<void> {
  redisClient.on("error", (err) => console.error("Redis Client Error:", err));
  subscriberClient.on("error", (err) => console.error("Redis Subscriber Error:", err));

  await redisClient.connect();
  await subscriberClient.connect();
  
  console.log("Connected to Redis - using Redis-native data structures");
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

/**
 * Create a new user in Redis
 */
export async function createUser(user: User): Promise<void> {
  const pipeline = redisClient.multi();
  
  // Store user document as JSON
  pipeline.json.set(KEYS.user(user.id), "$", user as any);
  
  // Add email lookup (stores user ID)
  pipeline.set(KEYS.userByEmail(user.email), user.id);
  
  // Add to users set
  pipeline.sAdd(KEYS.usersSet, user.id);
  
  await pipeline.exec();
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const user = await redisClient.json.get(KEYS.user(id)) as User | null;
  return user;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const userId = await redisClient.get(KEYS.userByEmail(email));
  if (!userId) return null;
  
  return getUserById(userId);
}

/**
 * Check if email exists
 */
export async function emailExists(email: string): Promise<boolean> {
  return await redisClient.exists(KEYS.userByEmail(email)) > 0;
}

/**
 * Convert User to PublicUser (remove sensitive data)
 */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt,
  };
}

/**
 * Store session token
 */
export async function createSession(token: string, userId: string, ttl: number = 86400): Promise<void> {
  // Store session with 24 hour expiry by default
  await redisClient.setEx(KEYS.session(token), ttl, userId);
}

/**
 * Get user ID from session token
 */
export async function getUserIdFromSession(token: string): Promise<string | null> {
  return await redisClient.get(KEYS.session(token));
}

/**
 * Delete session
 */
export async function deleteSession(token: string): Promise<void> {
  await redisClient.del(KEYS.session(token));
}

// ============================================================================
// ARTICLE OPERATIONS (Redis-native with sorted sets and category sets)
// ============================================================================

/**
 * Save a new article to Redis using native data structures
 */
export async function saveArticle(article: Article): Promise<void> {
  const timestamp = new Date(article.createdAt).getTime();
  const pipeline = redisClient.multi();
  
  // 1. Store article as individual JSON document
  pipeline.json.set(KEYS.article(article.id), "$", article as any);
  
  // 2. Add to sorted set (sorted by timestamp, newest first - use negative timestamp)
  pipeline.zAdd(KEYS.articlesByDate, { score: -timestamp, value: article.id });
  
  // 3. Add to category set
  pipeline.sAdd(KEYS.articlesByCategory(article.category), article.id);
  
  await pipeline.exec();
}

/**
 * Get a single article by ID
 */
export async function getArticleById(id: string): Promise<Article | null> {
  const article = await redisClient.json.get(KEYS.article(id)) as Article | null;
  return article;
}

/**
 * Get all articles sorted by date (newest first) with pagination
 * Uses Redis ZRANGE on sorted set - very efficient!
 */
export async function getAllArticles(offset: number = 0, limit: number = 100): Promise<Article[]> {
  // Get article IDs from sorted set (already sorted by date)
  const articleIds = await redisClient.zRange(KEYS.articlesByDate, offset, offset + limit - 1);
  
  if (articleIds.length === 0) return [];
  
  // Fetch all articles in parallel using pipeline
  const pipeline = redisClient.multi();
  articleIds.forEach(id => {
    pipeline.json.get(KEYS.article(id));
  });
  
  const results = await pipeline.exec();
  return (results
    ?.map(r => r as unknown as Article)
    .filter(Boolean) || []) as Article[];
}

/**
 * Get articles by category, sorted by date (newest first)
 * Uses Redis set intersection for filtering - very efficient!
 */
export async function getArticlesByCategory(category: string, offset: number = 0, limit: number = 100): Promise<Article[]> {
  // Get article IDs from category set
  const articleIds = await redisClient.sMembers(KEYS.articlesByCategory(category));
  
  if (articleIds.length === 0) return [];
  
  // Fetch articles in parallel
  const pipeline = redisClient.multi();
  articleIds.forEach(id => {
    pipeline.json.get(KEYS.article(id));
  });
  
  const results = await pipeline.exec();
  const articles = (results
    ?.map(r => r as unknown as Article)
    .filter(Boolean) || []) as Article[];
  
  // Sort by date in memory (still fast for reasonable set sizes)
  articles.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  return articles.slice(offset, offset + limit);
}

/**
 * Search articles by title (case-insensitive)
 * Note: For production, consider using RediSearch module for better full-text search
 */
export async function searchArticlesByTitle(query: string, offset: number = 0, limit: number = 100): Promise<Article[]> {
  // Get all article IDs
  const articleIds = await redisClient.zRange(KEYS.articlesByDate, 0, -1);
  
  if (articleIds.length === 0) return [];
  
  // Fetch and filter
  const pipeline = redisClient.multi();
  articleIds.forEach(id => {
    pipeline.json.get(KEYS.article(id));
  });
  
  const results = await pipeline.exec();
  const articles = (results
    ?.map(r => r as unknown as Article)
    .filter(Boolean) || []) as Article[];
  
  const lowerQuery = query.toLowerCase();
  return articles
    .filter(article => article.title.toLowerCase().includes(lowerQuery))
    .slice(offset, offset + limit);
}

/**
 * Update an existing article
 */
export async function updateArticle(id: string, updates: Partial<Article>): Promise<Article | null> {
  const existingArticle = await getArticleById(id);
  
  if (!existingArticle) {
    return null;
  }

  const oldCategory = existingArticle.category;
  const updatedArticle: Article = {
    ...existingArticle,
    ...updates,
    id: existingArticle.id,
    authorId: existingArticle.authorId,
    authorName: existingArticle.authorName,
    createdAt: existingArticle.createdAt,
    updatedAt: new Date().toISOString(),
  };

  const pipeline = redisClient.multi();
  
  // Update article document
  pipeline.json.set(KEYS.article(id), "$", updatedArticle as any);
  
  // If category changed, update category sets
  if (updates.category && updates.category !== oldCategory) {
    pipeline.sRem(KEYS.articlesByCategory(oldCategory), id);
    pipeline.sAdd(KEYS.articlesByCategory(updates.category), id);
  }
  
  await pipeline.exec();
  
  return updatedArticle;
}

/**
 * Delete an article
 */
export async function deleteArticle(id: string): Promise<boolean> {
  const article = await getArticleById(id);
  if (!article) return false;
  
  const pipeline = redisClient.multi();
  
  // Remove from all data structures
  pipeline.del(KEYS.article(id));
  pipeline.zRem(KEYS.articlesByDate, id);
  pipeline.sRem(KEYS.articlesByCategory(article.category), id);
  
  await pipeline.exec();
  return true;
}

/**
 * Publish a new article notification to the news_updates channel
 */
export async function publishNewArticle(article: Article): Promise<void> {
  const message: NewArticleMessage = {
    type: "new_article",
    article,
  };
  await redisClient.publish(NEWS_CHANNEL, JSON.stringify(message));
  console.log(`Published new article: ${article.title}`);
}

