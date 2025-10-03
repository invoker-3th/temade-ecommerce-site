import type { ProductForm, CategoryForm } from "./types"
import { productFormToRequestBody } from "./mappers"

export async function fetchInventoryLists() {
  const [productsRes, categoriesRes] = await Promise.all([
    fetch('/api/admin/products'),
    fetch('/api/admin/categories')
  ])
  const productsData = productsRes.ok ? await productsRes.json() : []
  const categoriesData = categoriesRes.ok ? await categoriesRes.json() : []
  return {
    products: Array.isArray(productsData) ? productsData : (productsData.items || []),
    categories: Array.isArray(categoriesData) ? categoriesData : (categoriesData.items || []),
  }
}

export async function createOrUpdateProduct(editingId: string | null, form: ProductForm) {
  const url = editingId ? `/api/admin/products/${editingId}` : '/api/admin/products'
  const method = editingId ? 'PUT' : 'POST'
  const body = productFormToRequestBody(form)
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Failed to ${editingId ? 'update' : 'create'} product`)
  return res.json().catch(() => ({}))
}

export async function deleteProduct(id: string) {
  const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed deleting product')
  return res.json().catch(() => ({}))
}

export async function createOrUpdateCategory(editingId: string | null, form: CategoryForm) {
  const url = editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories'
  const method = editingId ? 'PUT' : 'POST'
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: form.name,
      slug: form.slug,
      description: form.description,
      parentCategory: form.parentCategory || undefined,
      image: form.image,
    }),
  })
  if (!res.ok) throw new Error(`Failed to ${editingId ? 'update' : 'create'} category`)
  return res.json().catch(() => ({}))
}


