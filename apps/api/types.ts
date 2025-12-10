/**
 * Article categories for the news portal
 */
export type Category = "Politics" | "Sport" | "Tech";

/**
 * User entity stored in Redis
 */
export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

/**
 * User data without sensitive information (for responses)
 */
export interface PublicUser {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

/**
 * Article entity stored in Redis as individual documents
 */
export interface Article {
  id: string;
  title: string;
  content: string;
  category: Category;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload for user registration
 */
export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

/**
 * Payload for user login
 */
export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  user: PublicUser;
  token: string;
}

/**
 * Payload for creating a new article
 */
export interface CreateArticlePayload {
  title: string;
  content: string;
  category: Category;
}

/**
 * Payload for updating an existing article
 */
export interface UpdateArticlePayload {
  title?: string;
  content?: string;
  category?: Category;
}

/**
 * Redis Pub/Sub message for new article notifications
 */
export interface NewArticleMessage {
  type: "new_article";
  article: Article;
}

