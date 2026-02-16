"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { baseCategoryImages } from "@/app/data/shopCategories"
import FileUploadZone from "@/app/components/FileUploadZone"
import { sizeOptions, type ProductForm, type CategoryForm, type Product, type Category } from "./modules"
import { fetchInventoryLists, createOrUpdateProduct, deleteProduct } from "./modules"

export default function InventoryManagerPage() {
  const categoryFileInput = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  
  const [productForm, setProductForm] = useState<ProductForm>({ 
    name: "", sku: "", description: "", categoryId: "", price: 0, 
    sizes: "8,10,12,14,16,18", colorName: "", colorHex: "#000000", images: [],
    imageSettings: {}
  })
  
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ 
    name: "", slug: "", description: "", image: "" 
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { products, categories } = await fetchInventoryLists()
      setProducts(products)
      setCategories(categories)
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
      await createOrUpdateProduct(editing, productForm)
      alert(`Product ${editing ? 'updated' : 'created'} successfully`)
      setProductForm({ name: "", sku: "", description: "", categoryId: "", price: 0, sizes: "8,10,12,14,16,18", colorName: "", colorHex: "#000000", images: [] })
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

      await deleteProduct(id)
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

  if (loading) {
    return <div className="p-6 md:p-10">Loading...</div>
  }

  const staticCategories = Object.keys(baseCategoryImages)
  
  // Get all available categories (static + dynamic)
  const allCategories = [
    ...staticCategories,
    ...categories.map(c => c.name)
  ].filter((category, index, array) => array.indexOf(category) === index) // Remove duplicates

  function onEditProduct(product: Product): void {
    setEditing(product._id)
    const variant = product.colorVariants?.[0]
    const imgs = variant?.images ?? []
    const normalizedImages = imgs.map((img: { src: string; alt: string } | string) => (typeof img === "string" ? img : img?.src)).filter(Boolean)

    // Extract image settings from existing product
    const imageSettings: Record<string, { showOnUI: boolean; showOnDetails: boolean }> = {}
    variant?.images?.forEach((img) => {
      if (typeof img === 'object' && img.src) {
        imageSettings[img.src] = {
          showOnUI: img.showOnUI ?? true,
          showOnDetails: img.showOnDetails ?? true
        }
      }
    })

    setProductForm({
      name: product.name,
      sku: product.sku,
      description: product.description,
      categoryId: product.category,
      price: product.priceNGN,
      priceUSD: product.priceUSD,
      priceGBP: product.priceGBP,
      sizes: Array.isArray(product.sizes) ? product.sizes.join(",") : String(product.sizes || ""),
      colorName: variant?.colorName || "",
      colorHex: variant?.hexCode || "#000000",
      images: normalizedImages || [],
      imageSettings
    })
  }

  async function onCategoryUpload(file: File): Promise<void> {
    if (!file) return

    const formData = new FormData()
    // server upload expects 'files' entries
    formData.append('files', file)

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      // server returns { urls: [...] } (ensure your upload route does this)
      const urls = data.urls || data.urls?.length ? data.urls : []
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
    <div className="p-6 md:p-10 font-['Work_Sans']">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#16161A]">Inventory Management</h1>
        <Link href="/admin" className="underline font-bold text-[#2C2C2C]">Back to Dashboard</Link>
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

      {/* Instructions */}
      {activeTab === 'products' && (
        <div className="bg-[#FBF7F3] border border-[#E4D9C6] rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold mb-3 text-[#16161A]">Step-by-Step Guide: Adding Products & Managing Images</h2>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <p className="font-semibold mb-2">Step 1: Basic Product Information</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Enter SKU (unique product identifier)</li>
                <li>Enter product name (e.g., &ldquo;Cotton Dress&rdquo;)</li>
                <li>Select category (TOPS, SKIRTS, PANTS, DRESSES, JACKETS, etc.)</li>
                <li>Enter description</li>
                <li>Select available sizes</li>
                <li>Set prices (NGN required, USD and GBP optional)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Step 2: Color Information</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Enter color name (e.g., &ldquo;Navy Blue&rdquo;, &ldquo;Red&rdquo;)</li>
                <li>Select or enter hex color code (e.g., #000080 for navy blue)</li>
                <li>This color will appear as a swatch on the product page</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Step 3: Upload Images</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Click the upload area to select images (up to 5 images)</li>
                <li>Images will appear as thumbnails below the upload area</li>
                <li>You can remove images by hovering and clicking &ldquo;Remove&rdquo;</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Step 4: Configure Image Display Settings</p>
              <p className="mb-2">For each uploaded image, you can control where it appears:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Show on Shop/Collections:</strong> Check this to display the image on product listings (shop page, collections, search results, new arrivals). Uncheck to hide it from these pages.</li>
                <li><strong>Show on Product Details:</strong> Check this to display the image on the product detail page when customers click to view the product. Uncheck to hide it from the detail page.</li>
              </ul>
              <p className="mt-2 font-semibold">Recommended Setup:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Main product image:</strong> Check both boxes - this is the primary image customers see</li>
                <li><strong>Additional angles:</strong> Check only &ldquo;Show on Product Details&rdquo; - these appear when customers view the product</li>
                <li><strong>Hidden images:</strong> Uncheck both boxes if you want to keep images in the system but not display them</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Step 5: Adding Color Variations</p>
              <p className="mb-2">To add more colors of the same product:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Create a new product with the <strong>same product name</strong> (e.g., &ldquo;Cotton Dress&rdquo;)</li>
                <li>Use a <strong>different SKU</strong> (e.g., &ldquo;COTTON-DRESS-RED&rdquo;)</li>
                <li>Enter a <strong>different color name and hex code</strong> (e.g., &ldquo;Red&rdquo;, &ldquo;#FF0000&rdquo;)</li>
                <li>Use the <strong>same category, sizes, and pricing</strong></li>
                <li>Upload images for this color variation</li>
                <li>Configure image display settings for each color</li>
              </ul>
              <p className="mt-2"><strong>Result:</strong> All color variations will appear together on the same product detail page, and customers can select their preferred color using the color swatches.</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
              <p className="font-semibold text-blue-900 mb-1">💡 Pro Tip:</p>
              <p className="text-blue-800">Set one main image to show on shop/collections for each color, and set additional images to only show on product details. This keeps your shop pages clean while giving customers more views when they&rsquo;re interested in a product.</p>
            </div>
          </div>
        </div>
      )}

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
                  {allCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Products will appear in the &ldquo;{productForm.categoryId}&rdquo; category in the shop
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Available Sizes</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                    onClick={() => setProductForm({ ...productForm, sizes: "one-size" })}
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
                      if (productForm.sizes === "one-size") {
                        // moving from one-size to explicit sizes
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Color Hex Code (Required)</label>
                <div className="flex gap-2">
                  <input 
                    type="color"
                    className="w-12 h-12 border rounded cursor-pointer" 
                    value={productForm.colorHex} 
                    onChange={(e) => setProductForm({ ...productForm, colorHex: e.target.value })} 
                  />
                  <input 
                    className="border p-3 rounded flex-1" 
                    placeholder="#000000" 
                    value={productForm.colorHex} 
                    onChange={(e) => setProductForm({ ...productForm, colorHex: e.target.value })} 
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">This color will be displayed as a swatch in the shop</p>
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
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>Image Display Settings:</strong> Select which images appear on product listings (shop, collections) and which appear only on the product detail page.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {productForm.images.map((src) => {
                      const settings = productForm.imageSettings?.[src] || { showOnUI: true, showOnDetails: true }
                      const updateSettings = (field: 'showOnUI' | 'showOnDetails', value: boolean) => {
                        setProductForm(prev => ({
                          ...prev,
                          imageSettings: {
                            ...prev.imageSettings,
                            [src]: {
                              ...settings,
                              [field]: value
                            }
                          }
                        }))
                      }
                      return (
                        <div key={src} className="relative group border-2 rounded-lg overflow-hidden bg-white">
                          <div className="relative w-full h-32 bg-gray-100">
                            <Image src={src} alt="preview" fill className="object-cover" />
                          </div>
                          
                          {/* Image settings checkboxes */}
                          <div className="p-2 space-y-2 bg-white border-t">
                            <label className="flex items-center gap-2 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.showOnUI ?? true}
                                onChange={(e) => updateSettings('showOnUI', e.target.checked)}
                                className="w-4 h-4"
                              />
                              <span className="text-gray-700">Show on Shop/Collections</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.showOnDetails ?? true}
                                onChange={(e) => updateSettings('showOnDetails', e.target.checked)}
                                className="w-4 h-4"
                              />
                              <span className="text-gray-700">Show on Product Details</span>
                            </label>
                          </div>

                          {/* Remove button (visible on hover) */}
                          <button
                            type="button"
                            onClick={() => onRemoveImageFromProduct(src)}
                            className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            Remove
                          </button>
                        </div>
                      )
                    })}
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
                    setProductForm({ name: "", sku: "", description: "", categoryId: "", price: 0, sizes: "8,10,12,14,16,18", colorName: "", colorHex: "#000000", images: [], imageSettings: {} })
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
                        {product.colorVariants?.[0]?.images?.[0] && (
                          <Image
                            src={typeof product.colorVariants[0].images[0] === "string" ? product.colorVariants[0].images[0] : product.colorVariants[0].images[0]?.src}
                            alt={typeof product.colorVariants[0].images[0] === "string" ? product.name : product.colorVariants[0].images[0]?.alt || product.name}
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


