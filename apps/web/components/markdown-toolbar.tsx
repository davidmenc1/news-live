"use client";

import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Code,
  Link2,
  Quote,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MarkdownToolbarProps {
  onInsert: (syntax: string) => void;
}

export function MarkdownToolbar({ onInsert }: MarkdownToolbarProps) {
  const tools = [
    {
      icon: Bold,
      label: "Bold",
      syntax: "**bold text**",
      example: "**",
    },
    {
      icon: Italic,
      label: "Italic",
      syntax: "*italic text*",
      example: "*",
    },
    {
      icon: Heading2,
      label: "Heading",
      syntax: "## Heading",
      example: "## ",
    },
    {
      icon: Quote,
      label: "Quote",
      syntax: "> Quote",
      example: "> ",
    },
    {
      icon: List,
      label: "Bullet List",
      syntax: "- Item",
      example: "- ",
    },
    {
      icon: ListOrdered,
      label: "Numbered List",
      syntax: "1. Item",
      example: "1. ",
    },
    {
      icon: Code,
      label: "Code",
      syntax: "`code`",
      example: "`",
    },
    {
      icon: Link2,
      label: "Link",
      syntax: "[text](url)",
      example: "[link](https://example.com)",
    },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1 p-2 bg-muted rounded-md border">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Tooltip key={tool.label}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onInsert(tool.syntax)}
                  className="h-8 w-8 p-0"
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-medium">{tool.label}</p>
                <p className="text-muted-foreground">{tool.example}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
