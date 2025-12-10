"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createArticle } from "@/lib/api";
import { CATEGORIES, type Category } from "@/lib/types";
import { Plus } from "lucide-react";
import { useAuth } from "./auth-context";
import { MarkdownToolbar } from "./markdown-toolbar";
import { MarkdownPreview } from "./markdown-preview";

/**
 * Dialog for creating new articles (requires authentication)
 */
export function ArticleDialog() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "" as Category | "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content || !formData.category) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createArticle({
        title: formData.title,
        content: formData.content,
        category: formData.category as Category,
      });

      // Reset form and close dialog
      setFormData({ title: "", content: "", category: "" });
      setShowPreview(false);
      setOpen(false);
    } catch (error) {
      console.error("Error creating article:", error);
      alert(
        error instanceof Error ? error.message : "Failed to create article"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInsertMarkdown = (syntax: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    const beforeText = formData.content.substring(0, start);
    const afterText = formData.content.substring(end);

    let newContent = "";

    if (selectedText) {
      // Replace selected text with markdown syntax
      if (syntax.includes("**")) {
        newContent = beforeText + "**" + selectedText + "**" + afterText;
      } else if (syntax.includes("*")) {
        newContent = beforeText + "*" + selectedText + "*" + afterText;
      } else if (syntax.includes("`")) {
        newContent = beforeText + "`" + selectedText + "`" + afterText;
      } else if (syntax.includes("[")) {
        newContent = beforeText + "[" + selectedText + "](url)" + afterText;
      } else {
        newContent = beforeText + syntax + selectedText + afterText;
      }
    } else {
      // Insert syntax at cursor position
      newContent = beforeText + syntax + afterText;
    }

    setFormData({ ...formData, content: newContent });

    // Move cursor after the inserted text
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = beforeText.length + syntax.length;
        textareaRef.current.setSelectionRange(newPosition, newPosition);
        textareaRef.current.focus();
      }
    }, 0);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Write Article
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Write Article</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Article title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value as Category })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <MarkdownToolbar onInsert={handleInsertMarkdown} />
            <div className="flex gap-2">
              <Button
                type="button"
                variant={showPreview ? "outline" : "secondary"}
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant={showPreview ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowPreview(true)}
              >
                Preview
              </Button>
            </div>
            {!showPreview ? (
              <Textarea
                ref={textareaRef}
                id="content"
                placeholder="Write your article using Markdown..."
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                disabled={isSubmitting}
                className="min-h-[250px] font-mono text-sm"
              />
            ) : (
              <div className="min-h-[250px] p-3 border rounded-md bg-muted/50 overflow-y-auto">
                <MarkdownPreview content={formData.content} />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
