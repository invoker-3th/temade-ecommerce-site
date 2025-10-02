"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/app/context/AuthContext"
import { baseCategoryImages } from "@/app/data/shopCategories"

type ProductForm = {
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

type CategoryForm = {
  name: string
  slug: string
  description: string
  parentCategory?: string
  image: string
}

type Product = {
  _id: string
  name: string
  sku: string
  description: string
  category: string
  subCategory?: string
  priceNGN: number
  priceUSD?: number
  priceGBP?: number
  sizes: string[]
  colorVariants: Array<{
    colorName: string
    hexCode?: string
    images: Array<{ src: string; alt: string }>
  }>
  createdAt: string
  updatedAt: string
}

type Category = {
  _id: string
  name: string
  slug: string
  description: string
  parentCategory?: string
  image?: string
  createdAt: string
  updatedAt: string
}

export default function InventoryManagerPage() {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  
  const [productForm, setProductForm] = useState<ProductForm>({ 
    name: "", sku: "", description: "", categoryId: "", price: 0, 
    sizes: "S,M,L,XL", colorName: "", images: [] 
  })
  
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ 
    name: "", slug: "", description: "", image: "" 
  })
  
  const fileInput = useRef<HTMLInputElement>(null)
  const categoryFileInput = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const isAdmin = useMemo(() => {
    if (!user?.email) return false
    const allow = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    return allow.includes(user.email.toLowerCase())
  }, [user?.email])

  // Fetch data on component mount
  useEffect(() => {
    if (isAdmin) {
      fetchData()
    }
  }, [isAdmin])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/categories')
      ])
      
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(Array.isArray(productsData) ? productsData : (productsData.items || []))
      }
      
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(Array.isArray(categoriesData) ? categoriesData : (categoriesData.items || []))
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
    setLoading(false)
  }

  if (isLoading) return <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center">Loading...</div>
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FFFBEB] flex flex-col items-center justify-center gap-3">
        <p className="text-lg">Access denied</p>
        <Link href="/" className="text-[#CA6F86] underline">Go home</Link>
      </div>
    )
  }

  const staticCategories = Object.keys(baseCategoryImages)

  // Image upload functions
  const onUpload = async (file: File) => {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
    const data = await res.json()
    if (res.ok) {
      setProductForm((f) => ({ ...f, images: [...f.images, data.url] }))
    } else {
      alert(data.error || "Upload failed")
    }
  }

  const onCategoryUpload = async (file: File) => {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
    const data = await res.json()
    if (res.ok) {
      setCategoryForm((f) => ({ ...f, image: data.url }))
    } else {
      alert(data.error || "Upload failed")
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        onUpload(file)
      }
    })
  }

  // Product CRUD functions
  const onSubmitProduct = async () => {
    setCreating(true)
    try {
      const body = {
        sku: productForm.sku,
        name: productForm.name,
        description: productForm.description,
        category: productForm.categoryId,
        sizes: productForm.sizes.split(",").map((s) => s.trim()),
        colorVariants: [
          {
            colorName: productForm.colorName,
            hexCode: productForm.colorHex,
            images: productForm.images.map((src) => ({ src, alt: productForm.name })),
          },
        ],
        priceNGN: productForm.price,
        priceUSD: productForm.priceUSD,
        priceGBP: productForm.priceGBP,
      }
      
      const url = editing ? `/api/admin/products/${editing}` : '/api/admin/products'
      const method = editing ? 'PUT' : 'POST'
      
      const res = await fetch(url, { 
        method, 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(body) 
      })
      
      if (!res.ok) throw new Error(`Failed to ${editing ? 'update' : 'create'} product`)
      
      alert(`Product ${editing ? 'updated' : 'created'} successfully`)
      setProductForm({ name: "", sku: "", description: "", categoryId: "", price: 0, sizes: "S,M,L,XL", colorName: "", images: [] })
      setEditing(null)
      fetchData()
    } catch (e) {
      alert((e as Error)?.message || `${editing ? 'Update' : 'Create'} failed`)
    }
    setCreating(false)
  }

  const onEditProduct = (product: Product) => {
    setEditing(product._id)
    setProductForm({
      name: product.name,
      sku: product.sku,
      description: product.description,
      categoryId: product.category,
      price: product.priceNGN,
      priceUSD: product.priceUSD,
      priceGBP: product.priceGBP,
      sizes: product.sizes.join(', '),
      colorName: product.colorVariants[0]?.colorName || '',
      colorHex: product.colorVariants[0]?.hexCode || '',
      images: product.colorVariants[0]?.images.map(img => img.src) || []
    })
  }

  const onDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete product')
      
      alert('Product deleted successfully')
      fetchData()
    } catch (e) {
      alert((e as Error)?.message || 'Delete failed')
    }
  }

  // Category CRUD functions
  const onSubmitCategory = async () => {
    setCreating(true)
    try {
      const body = {
        name: categoryForm.name,
        slug: categoryForm.slug,
        description: categoryForm.description,
        parentCategory: categoryForm.parentCategory || undefined,
        image: categoryForm.image,
      }
      
      const url = editing ? `/api/admin/categories/${editing}` : '/api/admin/categories'
      const method = editing ? 'PUT' : 'POST'
      
      const res = await fetch(url, { 
        method, 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(body) 
      })
      
      if (!res.ok) throw new Error(`Failed to ${editing ? 'update' : 'create'} category`)
      
      alert(`Category ${editing ? 'updated' : 'created'} successfully`)
      setCategoryForm({ name: "", slug: "", description: "", image: "" })
      setEditing(null)
      fetchData()
    } catch (e) {
      alert((e as Error)?.message || `${editing ? 'Update' : 'Create'} failed`)
    }
    setCreating(false)
  }

  const onEditCategory = (category: Category) => {
    setEditing(category._id)
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentCategory: category.parentCategory || '',
      image: category.image || ''
    })
  }

  const onDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete category')
      
      alert('Category deleted successfully')
      fetchData()
    } catch (e) {
      alert((e as Error)?.message || 'Delete failed')
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center">Loading inventory...</div>
  }

  return (
    <div className="min-h-screen bg-[#FFFBEB] p-6 md:p-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-[#16161A]">Inventory Management</h1>
        <Link href="/admin" className="underline text-[#2C2C2C]">Back to Analytics</Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'products' 
              ? 'bg-[#CA6F86] text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'categories' 
              ? 'bg-[#CA6F86] text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Categories ({categories.length})
        </button>
      </div>

      {activeTab === 'products' && (
        <>
          {/* Product Form */}
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? 'Edit Product' : 'Add New Product'}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <input 
                className="border p-3 rounded" 
                placeholder="SKU" 
                value={productForm.sku} 
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} 
              />
              <input 
                className="border p-3 rounded" 
                placeholder="Product Name" 
                value={productForm.name} 
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} 
              />
              
              <select 
                className="border p-3 rounded" 
                value={productForm.categoryId} 
                onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
              >
                <option value="">Select Category</option>
                {staticCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                {categories.map((c) => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
              
              <input 
                className="border p-3 rounded" 
                placeholder="Sizes (comma separated)" 
                value={productForm.sizes} 
                onChange={(e) => setProductForm({ ...productForm, sizes: e.target.value })} 
              />
              
              <input 
                type="number" 
                className="border p-3 rounded" 
                placeholder="Price (NGN)" 
                value={productForm.price} 
                onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} 
              />
              <input 
                type="number" 
                className="border p-3 rounded" 
                placeholder="Price (USD)" 
                value={productForm.priceUSD ?? ""} 
                onChange={(e) => setProductForm({ ...productForm, priceUSD: Number(e.target.value) })} 
              />
              <input 
                type="number" 
                className="border p-3 rounded" 
                placeholder="Price (GBP)" 
                value={productForm.priceGBP ?? ""} 
                onChange={(e) => setProductForm({ ...productForm, priceGBP: Number(e.target.value) })} 
              />
              
              <input 
                className="border p-3 rounded" 
                placeholder="Color Name" 
                value={productForm.colorName} 
                onChange={(e) => setProductForm({ ...productForm, colorName: e.target.value })} 
              />
              <input 
                className="border p-3 rounded" 
                placeholder="#hex (optional)" 
                value={productForm.colorHex ?? ""} 
                onChange={(e) => setProductForm({ ...productForm, colorHex: e.target.value })} 
              />
              
              <textarea 
                className="border p-3 rounded md:col-span-2" 
                placeholder="Product Description" 
                rows={3}
                value={productForm.description} 
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} 
              />
            </div>
            
            {/* Image Upload Section */}
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Product Images</h3>
              
              {/* Drag and Drop Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  dragOver ? 'border-[#CA6F86] bg-pink-50' : 'border-gray-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <p className="text-gray-600 mb-2">Drag and drop images here, or</p>
                <input 
                  ref={fileInput} 
                  type="file" 
                  multiple
                  accept="image/*"
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files) {
                      Array.from(e.target.files).forEach(file => onUpload(file))
                    }
                  }} 
                />
                <button 
                  className="px-4 py-2 bg-[#CA6F86] text-white rounded hover:bg-[#B85A75]" 
                  onClick={() => fileInput.current?.click()} 
                  disabled={creating}
                >
                  Choose Files
                </button>
              </div>
              
              {/* Image Previews */}
              {productForm.images.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Uploaded Images:</p>
                  <div className="flex gap-2 flex-wrap">
                    {productForm.images.map((src, index) => (
                      <div key={src} className="relative w-20 h-20 group">
                        <Image src={src} alt="preview" fill className="object-cover rounded border" />
                        <button
                          onClick={() => setProductForm(f => ({ 
                            ...f, 
                            images: f.images.filter((_, i) => i !== index) 
                          }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex gap-3">
              <button 
                className="px-6 py-2 bg-[#CA6F86] text-white rounded hover:bg-[#B85A75] disabled:opacity-50" 
                onClick={onSubmitProduct} 
                disabled={creating}
              >
                {creating ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
              </button>
              {editing && (
                <button 
                  className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50" 
                  onClick={() => {
                    setEditing(null)
                    setProductForm({ name: "", sku: "", description: "", categoryId: "", price: 0, sizes: "S,M,L,XL", colorName: "", images: [] })
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Products List */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">All Products</h2>
            {products.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No products found. Create your first product above.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex gap-3">
                      <div className="relative w-16 h-16 rounded overflow-hidden bg-gray-100">
                        {product.colorVariants[0]?.images[0] && (
                          <Image 
                            src={product.colorVariants[0].images[0].src} 
                            alt={product.colorVariants[0].images[0].alt} 
                            fill 
                            className="object-cover" 
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{product.name}</h3>
                        <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                        <p className="text-sm text-gray-600">NGN: ₦{product.priceNGN.toLocaleString()}</p>
                        {product.priceUSD && <p className="text-sm text-gray-600">USD: ${product.priceUSD.toLocaleString()}</p>}
                        {product.priceGBP && <p className="text-sm text-gray-600">GBP: £{product.priceGBP.toLocaleString()}</p>}
                        <p className="text-xs text-gray-500 mt-1">Category: {product.category}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button 
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600" 
                        onClick={() => onEditProduct(product)}
                      >
                        Edit
                      </button>
                      <button 
                        className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600" 
                        onClick={() => onDeleteProduct(product._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'categories' && (
        <>
          {/* Category Form */}
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? 'Edit Category' : 'Add New Category'}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <input 
                className="border p-3 rounded" 
                placeholder="Category Name" 
                value={categoryForm.name} 
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} 
              />
              <input 
                className="border p-3 rounded" 
                placeholder="Slug (URL-friendly)" 
                value={categoryForm.slug} 
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} 
              />
              
              <select 
                className="border p-3 rounded" 
                value={categoryForm.parentCategory} 
                onChange={(e) => setCategoryForm({ ...categoryForm, parentCategory: e.target.value })}
              >
                <option value="">No Parent Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
              
              <textarea 
                className="border p-3 rounded md:col-span-2" 
                placeholder="Category Description" 
                rows={3}
                value={categoryForm.description} 
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} 
              />
            </div>
            
            {/* Category Image Upload */}
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Category Image</h3>
              <input 
                ref={categoryFileInput} 
                type="file" 
                accept="image/*"
                className="hidden" 
                onChange={(e) => e.target.files && onCategoryUpload(e.target.files[0])} 
              />
              <button 
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50" 
                onClick={() => categoryFileInput.current?.click()} 
                disabled={creating}
              >
                Upload Category Image
              </button>
              
              {categoryForm.image && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Category Image:</p>
                  <div className="relative w-32 h-32">
                    <Image src={categoryForm.image} alt="category preview" fill className="object-cover rounded border" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex gap-3">
              <button 
                className="px-6 py-2 bg-[#CA6F86] text-white rounded hover:bg-[#B85A75] disabled:opacity-50" 
                onClick={onSubmitCategory} 
                disabled={creating}
              >
                {creating ? 'Saving...' : editing ? 'Update Category' : 'Create Category'}
              </button>
              {editing && (
                <button 
                  className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50" 
                  onClick={() => {
                    setEditing(null)
                    setCategoryForm({ name: "", slug: "", description: "", image: "" })
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Categories List */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">All Categories</h2>
            {categories.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No categories found. Create your first category above.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div key={category._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex gap-3">
                      {category.image && (
                        <div className="relative w-16 h-16 rounded overflow-hidden bg-gray-100">
                          <Image src={category.image} alt={category.name} fill className="object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-sm text-gray-600">Slug: {category.slug}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{category.description}</p>
                        {category.parentCategory && (
                          <p className="text-xs text-gray-400 mt-1">Parent: {category.parentCategory}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button 
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600" 
                        onClick={() => onEditCategory(category)}
                      >
                        Edit
                      </button>
                      <button 
                        className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600" 
                        onClick={() => onDeleteCategory(category._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}


