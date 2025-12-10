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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateArticle } from "@/lib/api";
import { CATEGORIES, type Article, type Category } from "@/lib/types";
import { MarkdownToolbar } from "@/components/markdown-toolbar";
import { MarkdownPreview } from "@/components/markdown-preview";

interface EditArticleDialogProps {
  article: Article;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArticleUpdated: (article: Article) => void;
  trigger: React.ReactNode;
}

/**
 * Dialog for editing existing articles
 */
export function EditArticleDialog({
  article,
  open,
  onOpenChange,
  onArticleUpdated,
  trigger,
}: EditArticleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [formData, setFormData] = useState({
    title: article.title,
    content: article.content,
    category: article.category,
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setFormData({
        title: article.title,
        content: article.content,
        category: article.category,
      });
      setShowPreview(false);
    }
    onOpenChange(newOpen);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content || !formData.category) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedArticle = await updateArticle(article.id, {
        title: formData.title,
        content: formData.content,
        category: formData.category as Category,
      });

      onArticleUpdated(updatedArticle);
    } catch (error) {
      console.error("Error updating article:", error);
      alert(
        error instanceof Error ? error.message : "Failed to update article"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && (
        <div onClick={() => onOpenChange(true)} className="cursor-pointer">
          {trigger}
        </div>
      )}
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Article</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              placeholder="Article title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value as Category })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="edit-category">
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
            <Label htmlFor="edit-content">Content</Label>
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
                id="edit-content"
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
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
