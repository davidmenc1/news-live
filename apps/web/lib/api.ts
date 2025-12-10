import type { 
  Article, 
  CreateArticlePayload, 
  UpdateArticlePayload,
  RegisterPayload,
  LoginPayload,
  AuthResponse,
} from "./types";

// API base URL - uses environment variable or defaults to localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Storage keys
const TOKEN_KEY = "newslive_token";

/**
 * Get auth token from localStorage
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Set auth token in localStorage
 */
export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove auth token from localStorage
 */
export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Get auth headers
 */
function getAuthHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

// ============================================================================
// AUTH API
// ============================================================================

/**
 * Register a new user
 */
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to register");
  }

  const data = await response.json();
  setToken(data.token);
  return data;
}

/**
 * Login with email and password
 */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to login");
  }

  const data = await response.json();
  setToken(data.token);
  return data;
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  const token = getToken();
  
  if (token) {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
  }
  
  removeToken();
}

// ============================================================================
// ARTICLES API
// ============================================================================

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
 * Create a new article (requires authentication)
 */
export async function createArticle(payload: CreateArticlePayload): Promise<Article> {
  const response = await fetch(`${API_URL}/articles`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create article");
  }

  return response.json();
}

/**
 * Update an existing article (requires authentication and ownership)
 */
export async function updateArticle(id: string, payload: UpdateArticlePayload): Promise<Article> {
  const response = await fetch(`${API_URL}/articles/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update article");
  }

  return response.json();
}

/**
 * Delete an article (requires authentication and ownership)
 */
export async function deleteArticle(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/articles/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete article");
  }
}

