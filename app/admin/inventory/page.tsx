"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/app/context/AuthContext"
import { baseCategoryImages } from "@/app/data/shopCategories"
import FileUploadZone from "@/app/components/FileUploadZone"

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

type Category = {
  _id: string
  name: string
  slug: string
  description: string
  parentCategory?: string
  image?: string
}

const sizeOptions = [
  { key: "S", label: "Small (S)" },
  { key: "M", label: "Medium (M)" },
  { key: "L", label: "Large (L)" },
  { key: "XL", label: "Extra Large (XL)" },
  { key: "XXL", label: "Double XL (XXL)" },
  { key: "One Size", label: "One Size Fits All" },
] as const;

export default function InventoryManagerPage() {
  const { user, isLoading } = useAuth()
  const categoryFileInput = useRef<HTMLInputElement>(null)
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

  const isAdmin = useMemo(() => {
    if (!user?.email) return false
    const allow = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    return allow.includes(user.email.toLowerCase())
  }, [user?.email])

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

  const handleUploadSuccess = (urls: string[]) => {
    setProductForm(prev => ({
      ...prev,
      images: [...prev.images, ...urls]
    }))
  }

  const handleUploadError = (error: string) => {
    alert(`Upload failed: ${error}`)
  }

  const handleCategoryUploadSuccess = (urls: string[]) => {
    if (urls.length > 0) {
      setCategoryForm(prev => ({
        ...prev,
        image: urls[0]
      }))
    }
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

  async function deleteCloudinaryUrls(urls: string[] | string) {
    const list = Array.isArray(urls) ? urls.filter(Boolean) : [urls].filter(Boolean)
    if (list.length === 0) return { success: false, message: "no urls" }
    try {
      const res = await fetch("/api/admin/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: list }),
      })
      return await res.json()
    } catch (e) {
      console.error("deleteCloudinaryUrls error:", e)
      return { success: false, error: (e as Error).message }
    }
  }

  async function onDeleteProduct(id: string) {
    if (!confirm("Delete product? This will also delete associated images.")) return
    try {
      const product = products.find((p) => p._id === id)
      const imageUrls = product?.colorVariants.flatMap(v => v.images.map(img => img.src)) ?? []
      if (imageUrls.length > 0) {
        await deleteCloudinaryUrls(imageUrls)
      }

      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed deleting product")
      await fetchData()
    } catch (e) {
      console.error("onDeleteProduct error:", e)
      alert((e as Error).message || "Delete failed")
    }
  }

  async function onDeleteCategory(id: string) {
    if (!confirm("Delete category? This will delete the category image if any.")) return
    try {
      const category = categories.find((c) => c._id === id)
      if (category?.image) {
        await deleteCloudinaryUrls([category.image])
      }

      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed deleting category")
      await fetchData()
    } catch (e) {
      console.error("onDeleteCategory error:", e)
      alert((e as Error).message || "Delete failed")
    }
  }

  // call this when removing an image from the product form (either saved or pending)
  async function onRemoveImageFromProduct(imageUrl: string) {
    if (!confirm("Remove this image? It will be deleted from cloud storage.")) return
    try {
      // remove from local UI state first
      setProductForm(prev => ({ ...prev, images: prev.images.filter(s => s !== imageUrl) }))
      // if image is already uploaded to Cloudinary, delete it
      await deleteCloudinaryUrls([imageUrl])
    } catch (e) {
      console.error("onRemoveImageFromProduct error:", e)
      alert("Failed to remove image")
    }
  }

  if (isLoading || loading) {
    return <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center">Loading...</div>
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FFFBEB] flex flex-col items-center justify-center gap-3">
        <p className="text-lg">Access denied</p>
        <Link href="/" className="text-[#CA6F86] underline">Go home</Link>
      </div>
    )
  }

  const staticCategories = Object.keys(baseCategoryImages)

  function onEditProduct(product: Product): void {
    setEditing(product._id)
    setProductForm({
      name: product.name,
      sku: product.sku,
      description: product.description,
      categoryId: product.category,
      price: product.priceNGN,
      priceUSD: product.priceUSD,
      priceGBP: product.priceGBP,
      sizes: product.sizes.join(','),
      colorName: product.colorVariants[0]?.colorName || '',
      colorHex: product.colorVariants[0]?.hexCode,
      images: product.colorVariants[0]?.images.map(img => img.src) || []
    })
  }

  async function onCategoryUpload(file: File): Promise<void> {
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) throw new Error('Upload failed')
      
      const { urls } = await res.json()
      if (urls && urls.length > 0) {
        handleCategoryUploadSuccess(urls)
      }
    } catch (error) {
      console.error('Upload error:', error)
      handleUploadError(error instanceof Error ? error.message : 'Failed to upload image')
    }
  }

  function onEditCategory(category: Category): void {
    setEditing(category._id)
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentCategory: category.parentCategory,
      image: category.image || ""
    })
  }

  return (
    <div className="min-h-screen bg-[#FFFBEB] p-6 md:p-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#16161A]">Inventory Management</h1>
        <Link href="/admin" className="underline font-bold text-[#2C2C2C]">Back to Analytics</Link>
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
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SKU</label>
                <input 
                  className="border p-3 rounded w-full" 
                  placeholder="Product SKU" 
                  value={productForm.sku} 
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
                <input 
                  className="border p-3 rounded w-full" 
                  placeholder="Enter product name" 
                  value={productForm.name} 
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select 
                  className="border p-3 rounded w-full" 
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
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Available Sizes</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                    onClick={() => setProductForm({ ...productForm, sizes: "One Size" })}
                  >
                    One Size
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                    onClick={() => setProductForm({ ...productForm, sizes: sizeOptions.map(s => s.key).join(',') })}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                    onClick={() => setProductForm({ ...productForm, sizes: "" })}
                  >
                    Clear
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {sizeOptions.map((opt) => {
                    const current = (productForm.sizes || "").split(',').map(s => s.trim()).filter(Boolean)
                    const checked = current.includes(opt.key)
                    const toggle = () => {
                      if (productForm.sizes === "One Size") {
                        // moving from One Size to explicit sizes
                        setProductForm({ ...productForm, sizes: opt.key })
                        return
                      }
                      const next = checked
                        ? current.filter(s => s !== opt.key)
                        : Array.from(new Set([...current, opt.key]))
                      setProductForm({ ...productForm, sizes: next.join(',') })
                    }
                    return (
                      <label key={opt.key} className="flex items-center gap-2 text-sm border rounded px-2 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={toggle}
                        />
                        <span>{opt.label}</span>
                      </label>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">Selected sizes: {productForm.sizes || 'None selected'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₦ Naira)</label>
                <input 
                  type="number" 
                  className="border p-3 rounded w-full" 
                  placeholder="e.g., 25000" 
                  value={productForm.price || ""} 
                  onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) || 0 })} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($ Dollar) - Optional</label>
                <input 
                  type="number" 
                  className="border p-3 rounded w-full" 
                  placeholder="e.g., 50" 
                  value={productForm.priceUSD || ""} 
                  onChange={(e) => setProductForm({ ...productForm, priceUSD: Number(e.target.value) || undefined })} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price (£ Pounds) - Optional</label>
                <input 
                  type="number" 
                  className="border p-3 rounded w-full" 
                  placeholder="e.g., 40" 
                  value={productForm.priceGBP || ""} 
                  onChange={(e) => setProductForm({ ...productForm, priceGBP: Number(e.target.value) || undefined })} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Color Name</label>
                <input 
                  className="border p-3 rounded w-full" 
                  placeholder="e.g., Navy Blue, Red" 
                  value={productForm.colorName} 
                  onChange={(e) => setProductForm({ ...productForm, colorName: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Color Hex Code (Optional)</label>
                <input 
                  className="border p-3 rounded w-full" 
                  placeholder="#000000" 
                  value={productForm.colorHex ?? ""} 
                  onChange={(e) => setProductForm({ ...productForm, colorHex: e.target.value })} 
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Description</label>
                <textarea 
                  className="border p-3 rounded w-full" 
                  placeholder="Enter detailed product description" 
                  rows={3}
                  value={productForm.description} 
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} 
                />
              </div>
            </div>
            
            {/* Image Upload Section */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Product Images</label>
              
              {/* Drag and Drop Area */}
              <FileUploadZone
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                maxFiles={5}
              />

              {/* Previews for images already added to the product form */}
              {productForm.images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {productForm.images.map((src) => (
                    <div key={src} className="relative group border rounded overflow-hidden">
                      <div className="relative w-full h-24 bg-gray-100">
                        <Image src={src} alt="preview" fill className="object-cover" />
                      </div>

                      {/* Remove button (visible on hover) */}
                      <button
                        type="button"
                        onClick={() => onRemoveImageFromProduct(src)}
                        className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
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


