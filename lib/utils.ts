import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Maps old letter sizes to new numeric sizes for backward compatibility
 * Also handles "one-size" -> "One Size" display conversion
 */
export function normalizeSize(size: string | undefined | null): string {
  if (!size) return 'One Size'
  
  const sizeMap: Record<string, string> = {
    'S': '8',
    'M': '10',
    'L': '12',
    'XL': '14',
    'XXL': '16',
    'one-size': 'One Size',
    'One Size': 'One Size',
  }
  
  const trimmed = size.trim()
  if (!trimmed) return 'One Size'
  
  // If it's already a numeric size, return as-is
  if (['8', '10', '12', '14', '16', '18'].includes(trimmed)) {
    return trimmed
  }
  
  // If it's one-size (lowercase), return "One Size" for display
  if (trimmed === 'one-size') {
    return 'One Size'
  }
  
  // Map old sizes to new ones
  return sizeMap[trimmed] || trimmed
}

/**
 * Normalizes an array of sizes
 */
export function normalizeSizes(sizes: string[]): string[] {
  return sizes.map(normalizeSize)
}