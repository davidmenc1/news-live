import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn, getCategoryColor } from "@/lib/utils";
import { fetchArticle } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;

  let article;
  try {
    article = await fetchArticle(id);
  } catch (error) {
    console.error("Failed to fetch article:", error);
    notFound();
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

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Badge
          variant="outline"
          className={cn("mb-4", getCategoryColor(article.category))}
        >
          {article.category}
        </Badge>

        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

        <div className="text-sm text-muted-foreground mb-8">
          {article.authorName} · {createdDate}
        </div>

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          {article.content.split("\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </article>
      </main>
    </div>
  );
}
