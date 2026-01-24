import type { ObjectId } from "mongodb"

export interface ProductImage {
  src: string
  alt: string
  showOnUI?: boolean // If true, shows on product listings (shop, collections, etc.)
  showOnDetails?: boolean // If true, shows on product detail page
}

export interface ProductColorVariant {
  colorName: string
  hexCode: string // hex color code for display
  images: ProductImage[]
  price?: number
}

export interface Product {
  _id?: ObjectId
  sku: string
  name: string
  description: string
  category: string // Changed from categoryId: ObjectId to category: string
  subCategoryId?: ObjectId | null
  sizes: string[]
  colorVariants: ProductColorVariant[]
  price: number
  priceUSD?: number
  priceGBP?: number
  priceNGN?: number
  // New fields for product grouping
  baseProductId?: string // ID of the base product (for grouping color variations)
  isBaseProduct?: boolean // true if this is the main product, false if it's a color variation
  createdAt: Date
  updatedAt: Date
}



