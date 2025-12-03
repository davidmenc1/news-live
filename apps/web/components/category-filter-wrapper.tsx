"use client";

import { useCategory } from "@/components/category-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_CATEGORIES } from "@/lib/types";

/**
 * Category filter that syncs with global state
 */
export function CategoryFilter() {
  const { category, setCategory } = useCategory();

  return (
    <Select value={category} onValueChange={setCategory}>
      <SelectTrigger className="w-[130px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ALL_CATEGORIES.map((cat) => (
          <SelectItem key={cat} value={cat}>
            {cat === "All" ? "All" : cat}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

