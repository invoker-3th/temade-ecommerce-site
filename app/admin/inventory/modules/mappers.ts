import type { ProductForm } from "./types"

export function productFormToRequestBody(form: ProductForm) {
  return {
    sku: form.sku,
    name: form.name,
    description: form.description,
    category: form.categoryId, // This maps to the category field in the database
    sizes: form.sizes.split(",").map((s) => s.trim()),
    colorVariants: [
      {
        colorName: form.colorName,
        hexCode: form.colorHex, // now required
        images: form.images.map((src) => ({ src, alt: form.name })),
      },
    ],
    priceNGN: form.price,
    priceUSD: form.priceUSD,
    priceGBP: form.priceGBP,
  }
}


