import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn, getCategoryColor } from "@/lib/utils";
import type { Article } from "@/lib/types";

interface ArticleCardProps {
  article: Article;
}

/**
 * Simple article card for the stream
 */
export function ArticleCard({ article }: ArticleCardProps) {
  const formattedDate = new Date(article.createdAt).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const preview = article.content.length > 200
    ? `${article.content.slice(0, 200)}...`
    : article.content;

  return (
    <Link href={`/articles/${article.id}`} className="block group">
      <article className="p-4 rounded-lg border bg-card transition-colors hover:bg-muted/50">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h2 className="font-semibold group-hover:underline">
            {article.title}
          </h2>
          <Badge variant="outline" className={cn("shrink-0 text-xs", getCategoryColor(article.category))}>
            {article.category}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {preview}
        </p>
        <div className="text-xs text-muted-foreground">
          {article.author} · {formattedDate}
        </div>
      </article>
    </Link>
  );
}
