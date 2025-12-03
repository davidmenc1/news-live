"use client";

import { useState, useEffect, useCallback } from "react";
import { ArticleCard } from "@/components/article-card";
import { useFilters } from "@/components/category-context";
import { fetchArticles } from "@/lib/api";
import type { Article } from "@/lib/types";
import { useSocket } from "@/components/socket-provider";

/**
 * Article list with category filtering, search, and real-time updates
 */
export function ArticleList({ initialArticles }: { initialArticles: Article[] }) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [isLoading, setIsLoading] = useState(false);
  const { category, search } = useFilters();
  const { newArticle } = useSocket();

  // Handle filter changes (category and search)
  useEffect(() => {
    const loadArticles = async () => {
      setIsLoading(true);
      try {
        const data = await fetchArticles(
          category === "All" ? undefined : category,
          search
        );
        setArticles(data);
      } catch (error) {
        console.error("Failed to load articles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search queries
    const timeoutId = setTimeout(loadArticles, search ? 300 : 0);
    return () => clearTimeout(timeoutId);
  }, [category, search]);

  // Add new article to the list (with deduplication)
  const addArticle = useCallback((article: Article, currentCategory: string, currentSearch: string) => {
    // Check if article matches current filters
    const matchesCategory = currentCategory === "All" || article.category === currentCategory;
    const matchesSearch = !currentSearch || article.title.toLowerCase().includes(currentSearch.toLowerCase());

    if (matchesCategory && matchesSearch) {
      setArticles((prev) => {
        // Prevent duplicates by checking existing IDs
        if (prev.some((a) => a.id === article.id)) {
          return prev;
        }
        return [article, ...prev];
      });
    }
  }, []);

  // Handle real-time new article updates
  useEffect(() => {
    if (newArticle) {
      addArticle(newArticle, category, search);
    }
  }, [newArticle, category, search, addArticle]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-lg border bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">No articles yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
