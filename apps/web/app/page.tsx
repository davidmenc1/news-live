import { ArticleList } from "@/components/article-list";
import { ArticleDialog } from "@/components/article-dialog";
import { AuthDialog } from "@/components/auth-dialog";
import { CategoryFilter } from "@/components/category-filter-wrapper";
import { SearchInput } from "@/components/search-input";
import { fetchArticles } from "@/lib/api";
import type { Article } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  let articles: Article[] = [];

  try {
    articles = await fetchArticles();
  } catch (error) {
    console.error("Failed to fetch articles:", error);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-semibold">News</h1>
          <div className="flex items-center gap-3">
            <SearchInput />
            <CategoryFilter />
            <AuthDialog />
            <ArticleDialog />
          </div>
        </div>
      </header>

      {/* Article stream */}
      <main className="container mx-auto px-4 py-6">
        <ArticleList initialArticles={articles} />
      </main>
    </div>
  );
}
