import { createClient } from "redis";
import type { Article, NewArticleMessage } from "../types";

// Redis connection URL - uses environment variable or defaults to localhost
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Channel name for publishing new article notifications
export const NEWS_CHANNEL = "news_updates";

// Key prefix for storing articles in Redis JSON
const ARTICLES_KEY = "articles";

/**
 * Main Redis client for data operations (GET, SET, JSON operations)
 */
export const redisClient = createClient({ url: REDIS_URL });

/**
 * Separate Redis client for Pub/Sub subscriber
 * Redis requires a dedicated connection for subscriptions
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
  
  console.log("Connected to Redis");

  // Initialize articles storage if it doesn't exist
  const exists = await redisClient.exists(ARTICLES_KEY);
  if (!exists) {
    await redisClient.json.set(ARTICLES_KEY, "$", []);
    console.log("Initialized articles storage");
  }
}

/**
 * Get all articles from Redis JSON storage
 */
export async function getAllArticles(): Promise<Article[]> {
  const articles = await redisClient.json.get(ARTICLES_KEY) as Article[] | null;
  return articles || [];
}

/**
 * Get a single article by ID
 */
export async function getArticleById(id: string): Promise<Article | null> {
  const articles = await getAllArticles();
  return articles.find((article) => article.id === id) || null;
}

/**
 * Get articles filtered by category
 */
export async function getArticlesByCategory(category: string): Promise<Article[]> {
  const articles = await getAllArticles();
  return articles.filter((article) => article.category === category);
}

/**
 * Save a new article to Redis JSON storage
 */
export async function saveArticle(article: Article): Promise<void> {
  await redisClient.json.arrAppend(ARTICLES_KEY, "$", article as any);
}

/**
 * Update an existing article in Redis JSON storage
 */
export async function updateArticle(id: string, updates: Partial<Article>): Promise<Article | null> {
  const articles = await getAllArticles();
  const index = articles.findIndex((article) => article.id === id);
  
  if (index === -1) {
    return null;
  }

  const existingArticle = articles[index]!;
  const updatedArticle: Article = {
    id: existingArticle.id,
    title: updates.title ?? existingArticle.title,
    content: updates.content ?? existingArticle.content,
    category: updates.category ?? existingArticle.category,
    author: updates.author ?? existingArticle.author,
    createdAt: existingArticle.createdAt,
    updatedAt: new Date().toISOString(),
  };

  articles[index] = updatedArticle;
  await redisClient.json.set(ARTICLES_KEY, "$", articles as any);
  
  return updatedArticle;
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

