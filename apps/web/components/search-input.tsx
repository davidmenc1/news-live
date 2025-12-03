"use client";

import { useFilters } from "@/components/category-context";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

/**
 * Search input for filtering articles by title
 */
export function SearchInput() {
  const { search, setSearch } = useFilters();

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search titles..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-8 w-[180px]"
      />
    </div>
  );
}

