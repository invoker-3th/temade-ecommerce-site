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

/**
 * Get the first image that should be displayed on UI (shop, collections, etc.)
 * Respects the showOnUI flag on images
 */
export function getUIImage(
  colorVariants?: Array<{ 
    images: Array<{ src: string; alt: string; showOnUI?: boolean } | string> 
  }>
): { src: string; alt: string } | null {
  if (!colorVariants || colorVariants.length === 0) return null
  
  const variant = colorVariants[0]
  if (!variant?.images || variant.images.length === 0) return null
  
  // Find first image with showOnUI flag (defaults to true if not set)
  const uiImage = variant.images.find(img => {
    if (typeof img === 'string') return true // Legacy format, show it
    return img.showOnUI !== false // Show if explicitly true or undefined
  })
  
  if (uiImage) {
    if (typeof uiImage === 'string') {
      return { src: uiImage, alt: '' }
    }
    return { src: uiImage.src, alt: uiImage.alt || '' }
  }
  
  // Fallback to first image
  const firstImg = variant.images[0]
  if (typeof firstImg === 'string') {
    return { src: firstImg, alt: '' }
  }
  return firstImg ? { src: firstImg.src, alt: firstImg.alt || '' } : null
}

/**
 * Get all images that should be displayed on product detail page
 * Respects the showOnDetails flag on images
 */
export function getDetailImages(
  colorVariants?: Array<{ 
    images: Array<{ src: string; alt: string; showOnDetails?: boolean } | string> 
  }>
): Array<{ src: string; alt: string }> {
  if (!colorVariants || colorVariants.length === 0) return []
  
  const variant = colorVariants[0]
  if (!variant?.images || variant.images.length === 0) return []
  
  return variant.images
    .filter(img => {
      if (typeof img === 'string') return true // Legacy format, show it
      return img.showOnDetails !== false // Show if explicitly true or undefined
    })
    .map(img => {
      if (typeof img === 'string') {
        return { src: img, alt: '' }
      }
      return { src: img.src, alt: img.alt || '' }
    })
}