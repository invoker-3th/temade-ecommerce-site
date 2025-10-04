'use client';

import React, { useState, useEffect } from 'react';
import { use } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, CheckCircle2, XCircle, Heart } from 'lucide-react';
import { useCart } from '@/app/context/CartContext';
import { useWishlist } from '@/app/context/WishlistContext';
import { Work_Sans } from 'next/font/google';

const workSans = Work_Sans({
    subsets: ['latin'],
    weight: ['400', '500', '600'],
});

type ParamsType = {
    productId: string;
};

type Props = {
    params: Promise<ParamsType>;
};

type Product = {
    _id: string;
    name: string;
    sku: string;
    description: string;
    category: string;
    priceNGN: number;
    priceUSD?: number;
    priceGBP?: number;
    sizes: string[];
    colorVariants: Array<{
        colorName: string;
        hexCode: string;
        images: Array<{ src: string; alt: string }>;
    }>;
};

type ProductWithVariations = {
    _id: string;
    name: string;
    sku: string;
    description: string;
    category: string;
    priceNGN: number;
    priceUSD?: number;
    priceGBP?: number;
    sizes: string[];
    colorVariants: Array<{
        colorName: string;
        hexCode: string;
        images: Array<{ src: string; alt: string }>;
    }>;
};

export default function ProductDetailPage({ params }: Props) {
    const { productId } = use(params);
    const { addToCart } = useCart();
    const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();

    const [product, setProduct] = useState<Product | null>(null);
    const [allVariations, setAllVariations] = useState<ProductWithVariations[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(1);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                // First, get the specific product
                const res = await fetch(`/api/admin/products/${productId}`);
                if (res.ok) {
                    const data = await res.json();
                    setProduct(data);
                    
                    // Then, get all variations of the same product name
                    const variationsRes = await fetch(`/api/products/by-name/${encodeURIComponent(data.name)}`);
                    if (variationsRes.ok) {
                        const variations = await variationsRes.json();
                        setAllVariations(variations);
                        
                        // Collect all unique colors from all variations
                        const allColors = variations.flatMap((p: ProductWithVariations) => 
                            p.colorVariants.map(cv => ({ 
                                colorName: cv.colorName, 
                                hexCode: cv.hexCode,
                                images: cv.images 
                            }))
                        );
                        
                        // Remove duplicates based on colorName
                        const uniqueColors = allColors.filter((color: { colorName: string; hexCode: string; images: any[] }, index: number, array: { colorName: string; hexCode: string; images: any[] }[]) => 
                            array.findIndex((c: { colorName: string; hexCode: string; images: any[] }) => c.colorName === color.colorName) === index
                        );
                        
                        console.log('All variations:', variations);
                        console.log('All colors:', allColors);
                        console.log('Unique colors:', uniqueColors);
                        
                        // Set default color and size
                        if (uniqueColors.length > 0) {
                            setSelectedColor(uniqueColors[0].colorName);
                        } else if (data.colorVariants && data.colorVariants.length > 0) {
                            // Fallback to original product colors if no variations found
                            setSelectedColor(data.colorVariants[0].colorName);
                        }
                        if (data.sizes && data.sizes.length > 0) {
                            setSelectedSize(data.sizes[0]);
                        }
                    }
                } else {
                    notFound();
                }
            } catch (error) {
                console.error('Error fetching product:', error);
                notFound();
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    const handleAddToCart = () => {
        if (!product) return;
        
        if (!selectedSize) {
            setNotification({ message: 'Please select a size', type: 'error' });
            return;
        }

        if (!selectedColor) {
            setNotification({ message: 'Please select a color', type: 'error' });
            return;
        }

        const selectedColorVariant = product.colorVariants.find(
            (variant) => variant.colorName === selectedColor
        );

        if (!selectedColorVariant) {
            setNotification({ message: 'Selected color not found', type: 'error' });
            return;
        }

        addToCart({
            id: product._id,
            name: product.name,
            price: product.priceNGN,
            image: selectedColorVariant.images[0]?.src || '',
            size: selectedSize,
            color: selectedColor,
            quantity,
        });

        setNotification({ message: 'Added to cart successfully!', type: 'success' });
    };

    const handleWishlistToggle = () => {
        if (!product) return;
        
        const exists = wishlist.some((w) => w.id === product._id);
        const selectedColorVariant = product.colorVariants.find(
            (variant) => variant.colorName === selectedColor
        );

        if (exists) {
            removeFromWishlist(product._id);
            setNotification({ message: `${product.name} removed from wishlist`, type: 'error' });
        } else {
            addToWishlist({
                id: product._id,
                name: product.name,
                image: selectedColorVariant?.images[0]?.src || '',
                price: product.priceNGN || 0
            });
            setNotification({ message: `${product.name} added to wishlist`, type: 'success' });
        }
    };

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (!product) {
        notFound();
    }

    // Collect all images from all color variations
    const allImages = allVariations
        .flatMap(p => p.colorVariants)
        .flatMap(cv => cv.images);
    
    // Find the selected color variant from all variations
    const selectedColorVariant = allVariations
        .flatMap(p => p.colorVariants)
        .find(variant => variant.colorName === selectedColor);
    
    const mainImage = allImages[selectedImageIndex] || allImages[0];

    return (
        <div className={`px-4 py-8 max-w-7xl mx-auto relative ${workSans.className}`}>
            {/* Breadcrumb */}
            <nav className="text-sm sm:text-base text-gray-600 mb-6">
                <ul className="flex flex-wrap gap-1">
                    <li><Link href="/" className="text-[#CA6F86] hover:underline">Home</Link></li>
                    <li>/</li>
                    <li><Link href="/shop" className="text-[#CA6F86] hover:underline">Shop</Link></li>
                    <li>/</li>
                    <li className="text-gray-500">{product.name}</li>
                </ul>
            </nav>

            {/* Main Section */}
            <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                {/* Images */}
                <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-1/2">
                    {/* Thumbnails - Show all images from all color variations */}
                    {allImages.length > 1 && (
                        <div className="flex w-full gap-3 max-smb:overflow-x-auto lg:flex-col lg:w-1/3">
                            {allImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImageIndex(idx)}
                                    className={`min-w-[5rem] sm:min-w-[7rem] h-28 sm:h-36 rounded-md border-2 transition-all duration-200 bg-cover bg-center ${
                                        selectedImageIndex === idx 
                                            ? 'border-[#CA6F86]' 
                                            : 'border-gray-200 hover:border-[#CA6F86]'
                                    }`}
                                    style={{ backgroundImage: `url(${img.src})` }}
                                    aria-label="Select image variant"
                                />
                            ))}
                        </div>
                    )}

                    {/* Main Image */}
                    <div className="w-full relative aspect-[3/4] max-w-[700px]">
                        {mainImage && (
                            <Image
                                src={mainImage.src}
                                alt={mainImage.alt}
                                fill
                                className="object-cover rounded-lg"
                                sizes="(min-width: 1024px) 50vw, 100vw"
                                priority
                            />
                        )}
                    </div>
                </div>

                {/* Product Info */}
                <div className="w-full lg:w-1/2 space-y-6">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-[#16161A]">{product.name}</h1>
                        <p className="text-sm text-gray-500 mt-2">SKU: {product.sku}</p>

                        <div className="flex items-center gap-2 text-yellow-400 mt-4">
                            {[...Array(4)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400" />
                            ))}
                            <span className="text-sm text-gray-500 ml-2">15 reviews</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <p className="text-3xl font-bold text-[#16161A]">₦{product.priceNGN.toLocaleString()}</p>
                        {product.priceUSD && (
                            <p className="text-lg text-gray-600">${product.priceUSD.toLocaleString()}</p>
                        )}
                        {product.priceGBP && (
                            <p className="text-lg text-gray-600">£{product.priceGBP.toLocaleString()}</p>
                        )}
                    </div>

                    <p className="text-gray-600 leading-relaxed text-[16px]">{product.description}</p>

                    {/* Color Selection */}
                    <div className="space-y-3">
                        <h2 className="font-semibold text-[#16161A]">Color: {selectedColor}</h2>
                        <div className="flex gap-3 flex-wrap">
                            {(allVariations.length > 0 
                                ? allVariations.flatMap(p => p.colorVariants)
                                : product.colorVariants
                            )
                                .filter((variant, index, array) => 
                                    array.findIndex(v => v.colorName === variant.colorName) === index
                                )
                                .map((variant) => (
                                <button
                                    key={variant.colorName}
                                    onClick={() => {
                                        setSelectedColor(variant.colorName);
                                        // Find the first image of this color variant
                                        const colorImages = (allVariations.length > 0 
                                            ? allVariations.flatMap(p => p.colorVariants)
                                            : product.colorVariants
                                        ).find(cv => cv.colorName === variant.colorName)?.images || [];
                                        if (colorImages.length > 0) {
                                            const imageIndex = allImages.findIndex(img => img.src === colorImages[0].src);
                                            if (imageIndex !== -1) {
                                                setSelectedImageIndex(imageIndex);
                                            }
                                        }
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg transition-all ${
                                        selectedColor === variant.colorName
                                            ? 'border-[#CA6F86] bg-[#CA6F86]/10'
                                            : 'border-gray-300 hover:border-[#CA6F86]'
                                    }`}
                                >
                                    <div
                                        className="w-6 h-6 rounded-full border border-gray-300"
                                        style={{ backgroundColor: variant.hexCode }}
                                        title={variant.colorName}
                                    />
                                    <span className="text-sm font-medium">{variant.colorName}</span>
                                </button>
                            ))}
                        </div>
                        {allVariations.length === 0 && (
                            <p className="text-sm text-gray-500">No color variations found</p>
                        )}
                    </div>

                    {/* Size Selection */}
                    <div className="space-y-3">
                        <h2 className="font-semibold text-[#16161A]">Size: {selectedSize}</h2>
                        <div className="flex gap-3 flex-wrap">
                            {product.sizes.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className={`px-4 py-2 border-2 font-semibold rounded-lg text-[16px] transition-all ${
                                        selectedSize === size
                                            ? 'bg-[#CA6F86] text-white border-[#CA6F86]'
                                            : 'text-[#2C2C2C] border-gray-300 hover:border-[#CA6F86]'
                                    }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quantity & Actions */}
                    <div className="flex items-center flex-wrap gap-4">
                        <div className="flex items-center gap-4 border rounded-lg px-4 py-2 text-lg">
                            <button 
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                            >
                                -
                            </button>
                            <span className="min-w-[2rem] text-center">{quantity}</span>
                            <button 
                                onClick={() => setQuantity((q) => q + 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                            >
                                +
                            </button>
                        </div>
                        
                        <button
                            onClick={handleAddToCart}
                            className="bg-[#CA6F86] text-white px-8 py-3 rounded-lg text-base font-medium hover:bg-[#B85A75] transition w-full sm:w-auto"
                        >
                            Add to Cart
                        </button>
                        
                        <button
                            onClick={handleWishlistToggle}
                            className={`p-3 rounded-lg border-2 transition ${
                                wishlist.some((w) => w.id === product._id)
                                    ? 'border-[#CA6F86] bg-[#CA6F86]/10 text-[#CA6F86]'
                                    : 'border-gray-300 hover:border-[#CA6F86] text-gray-600'
                            }`}
                        >
                            <Heart 
                                className={`w-6 h-6 ${
                                    wishlist.some((w) => w.id === product._id) ? 'fill-current' : ''
                                }`}
                            />
                        </button>
                    </div>

                    {/* Product Details */}
                    <div className="border-t pt-6">
                        <div className="space-y-4">
                            <div className="flex justify-between py-3 border-b">
                                <span className="font-semibold text-[#464646]">Category:</span>
                                <span className="text-[#626262]">{product.category}</span>
                            </div>
                            <div className="flex justify-between py-3 border-b">
                                <span className="font-semibold text-[#464646]">Material:</span>
                                <span className="text-[#626262]">100% Cotton</span>
                            </div>
                            <div className="flex justify-between py-3">
                                <span className="font-semibold text-[#464646]">SKU:</span>
                                <span className="text-[#626262]">{product.sku}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 max-w-sm shadow-lg rounded-lg px-5 py-3 text-sm font-medium transition-opacity duration-300 ${
                        notification.type === 'success'
                            ? 'bg-green-100 text-green-800 border border-green-400'
                            : 'bg-red-100 text-red-700 border border-red-400'
                    }`}
                    role="alert"
                >
                    {notification.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <XCircle className="w-5 h-5" />
                    )}
                    <span>{notification.message}</span>
                </div>
            )}
        </div>
    );
}