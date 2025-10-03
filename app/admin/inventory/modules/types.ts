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
  colorHex?: string
  images: string[]
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
    hexCode?: string
    images: Array<{ src: string; alt: string }>
  }>
}

export type Category = {
  _id: string
  name: string
  slug: string
  description: string
  parentCategory?: string
  image?: string
}


