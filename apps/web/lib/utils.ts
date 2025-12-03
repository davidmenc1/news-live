import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Category } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get color classes for a category badge
 */
export function getCategoryColor(category: Category): string {
  switch (category) {
    case "Tech":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
    case "Sport":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
    case "Politics":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
    default:
      return ""
  }
}
