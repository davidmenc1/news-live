/**
 * Shared types for the NewsLive frontend
 */

export type Category = "Politics" | "Sport" | "Tech";

export interface Article {
  id: string;
  title: string;
  content: string;
  category: Category;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticlePayload {
  title: string;
  content: string;
  category: Category;
  author: string;
}

export interface UpdateArticlePayload {
  title?: string;
  content?: string;
  category?: Category;
  author?: string;
}

export const CATEGORIES: Category[] = ["Politics", "Sport", "Tech"];
export const ALL_CATEGORIES = ["All", ...CATEGORIES] as const;

