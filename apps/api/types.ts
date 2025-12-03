/**
 * Article categories for the news portal
 */
export type Category = "Politics" | "Sport" | "Tech";

/**
 * Article entity stored in Redis JSON
 */
export interface Article {
  id: string;
  title: string;
  content: string;
  category: Category;
  author: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload for creating a new article
 */
export interface CreateArticlePayload {
  title: string;
  content: string;
  category: Category;
  author: string;
}

/**
 * Payload for updating an existing article
 */
export interface UpdateArticlePayload {
  title?: string;
  content?: string;
  category?: Category;
  author?: string;
}

/**
 * Redis Pub/Sub message for new article notifications
 */
export interface NewArticleMessage {
  type: "new_article";
  article: Article;
}

