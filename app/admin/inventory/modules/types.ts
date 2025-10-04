export type ProductForm = {
  name: string
  sku: string
  description: string
  categoryId: string
  price: number
  priceUSD?: number
  priceGBP?: number
  sizes: string
  colorName: string
  colorHex: string // required hex color code
  images: string[]
  // New fields for product grouping
  baseProductId?: string // ID of the base product (for grouping color variations)
  isBaseProduct?: boolean // true if this is the main product, false if it's a color variation
}

export type CategoryForm = {
  name: string
  slug: string
  description: string
  parentCategory?: string
  image: string
}

export type Product = {
  _id: string
  name: string
  sku: string
  description: string
  category: string
  priceNGN: number
  priceUSD?: number
  priceGBP?: number
  sizes: string[]
  colorVariants: Array<{
    colorName: string
    hexCode: string // required hex color code
    images: Array<{ src: string; alt: string }>
  }>
  // New fields for product grouping
  baseProductId?: string // ID of the base product (for grouping color variations)
  isBaseProduct?: boolean // true if this is the main product, false if it's a color variation
}

export type Category = {
  _id: string
  name: string
  slug: string
  description: string
  parentCategory?: string
  image?: string
}


