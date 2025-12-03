import type { Article, CreateArticlePayload, UpdateArticlePayload } from "./types";

// API base URL - uses environment variable or defaults to localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Fetch all articles, optionally filtered by category and/or search query
 */
export async function fetchArticles(category?: string, search?: string): Promise<Article[]> {
  const url = new URL(`${API_URL}/articles`);
  if (category && category !== "All") {
    url.searchParams.set("category", category);
  }
  if (search && search.trim()) {
    url.searchParams.set("search", search.trim());
  }

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch articles");
  }

  return response.json();
}

/**
 * Fetch a single article by ID
 */
export async function fetchArticle(id: string): Promise<Article> {
  const response = await fetch(`${API_URL}/articles/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch article");
  }

  return response.json();
}

/**
 * Create a new article
 */
export async function createArticle(payload: CreateArticlePayload): Promise<Article> {
  const response = await fetch(`${API_URL}/articles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create article");
  }

  return response.json();
}

/**
 * Update an existing article
 */
export async function updateArticle(id: string, payload: UpdateArticlePayload): Promise<Article> {
  const response = await fetch(`${API_URL}/articles/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update article");
  }

  return response.json();
}

