/**
 * Shared types for the NewsLive frontend
 */

export type Category = "Politics" | "Sport" | "Tech";

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

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

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreateArticlePayload {
  title: string;
  content: string;
  category: Category;
}

export interface UpdateArticlePayload {
  title?: string;
  content?: string;
  category?: Category;
}

export const CATEGORIES: Category[] = ["Politics", "Sport", "Tech"];
export const ALL_CATEGORIES = ["All", ...CATEGORIES] as const;

