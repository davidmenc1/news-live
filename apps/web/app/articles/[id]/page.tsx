"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, getCategoryColor } from "@/lib/utils";
import { fetchArticle, deleteArticle } from "@/lib/api";
import { ArrowLeft, Edit2, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { EditArticleDialog } from "@/components/edit-article-dialog";
import { MarkdownPreview } from "@/components/markdown-preview";
import type { Article } from "@/lib/types";

export default function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [articleId, setArticleId] = useState<string>("");

  useEffect(() => {
    const loadArticle = async () => {
      try {
        const { id } = await params;
        setArticleId(id);
        const data = await fetchArticle(id);
        setArticle(data);
      } catch (error) {
        console.error("Failed to fetch article:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    loadArticle();
  }, [params, router]);

  const isAuthor = user && article && user.id === article.authorId;

  const handleDelete = async () => {
    if (!article || !confirm("Are you sure you want to delete this article?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteArticle(article.id);
      router.push("/");
    } catch (error) {
      console.error("Error deleting article:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete article"
      );
      setIsDeleting(false);
    }
  };

  const handleArticleUpdated = (updatedArticle: Article) => {
    setArticle(updatedArticle);
    setEditOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-14 items-center px-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            Article not found
          </div>
        </main>
      </div>
    );
  }

  const createdDate = new Date(article.createdAt).toLocaleDateString("cs-CZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-start justify-between gap-4 mb-4">
          <Badge
            variant="outline"
            className={cn(getCategoryColor(article.category))}
          >
            {article.category}
          </Badge>
          {isAuthor && (
            <div className="flex gap-2">
              <EditArticleDialog
                article={article}
                open={editOpen}
                onOpenChange={setEditOpen}
                onArticleUpdated={handleArticleUpdated}
                trigger={
                  <Button size="sm" variant="outline" className="gap-2">
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                }
              />
              <Button
                size="sm"
                variant="destructive"
                className="gap-2"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

        <div className="text-sm text-muted-foreground mb-8">
          {article.authorName} · {createdDate}
        </div>

        <MarkdownPreview content={article.content} />
      </main>
    </div>
  );
}
