"use client";

import { createContext, useContext, useState } from "react";

interface FilterContextValue {
  category: string;
  setCategory: (category: string) => void;
  search: string;
  setSearch: (search: string) => void;
}

const FilterContext = createContext<FilterContextValue>({
  category: "All",
  setCategory: () => {},
  search: "",
  setSearch: () => {},
});

export function useFilters() {
  return useContext(FilterContext);
}

// Keep old hook name for compatibility
export const useCategory = useFilters;

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  return (
    <FilterContext.Provider value={{ category, setCategory, search, setSearch }}>
      {children}
    </FilterContext.Provider>
  );
}

