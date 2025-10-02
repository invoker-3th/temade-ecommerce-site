import type { ObjectId } from "mongodb"

export interface ProductImage {
  src: string
  alt: string
}

export interface ProductColorVariant {
  colorName: string // can be hex code as well
  images: ProductImage[]
  price?: number
}

export interface Product {
  _id?: ObjectId
  sku: string
  name: string
  description: string
  categoryId: ObjectId
  subCategoryId?: ObjectId | null
  sizes: string[]
  colorVariants: ProductColorVariant[]
  price: number
  priceUSD?: number
  priceGBP?: number
  priceNGN?: number
  createdAt: Date
  updatedAt: Date
}



