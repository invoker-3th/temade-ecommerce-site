'use client';

import { Heart, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCurrency, pickPrice } from '../context/CurrencyContext';
import { normalizeSizes, getUIImage } from '@/lib/utils';
import { trackViewItemList } from '@/lib/analytics';

// Matches backend product shape we use
type ApiProduct = {
  _id: string
  name: string
  sku: string
  description: string
  category: string
  priceNGN: number
  priceUSD?: number
  priceGBP?: number
  sizes: string[]
  colorVariants: Array<{ colorName: string; hexCode?: string; images: Array<{ src: string; alt: string }> }>
}

type ColorSwatch = { name: string; hex?: string }

type NewArrivalItem = {
  id: string;
  name: string;
  image: string;
  sizes: string[];
  price: number;
  swatches: ColorSwatch[];
  // Add price properties for different currencies
  priceNGN: number;
  priceUSD?: number;
  priceGBP?: number;
};

type ToastType = 'success' | 'error';

type AnalyticsTopProduct = { id: string; name: string; image: string; quantitySold: number; revenue: number };

function firstImageOf(product: ApiProduct): string {
  const uiImage = getUIImage(product.colorVariants)
  return uiImage?.src || '/placeholder.svg'
}

function toItem(product: ApiProduct, currency: 'NGN' | 'USD' | 'GBP'): NewArrivalItem {
  const price = (pickPrice(product , currency) ?? product.priceNGN ?? 0) as number
  const swatches: ColorSwatch[] = (product.colorVariants || []).map(v => ({ name: v.colorName, hex: v.hexCode }))
  return {
    id: product._id,
    name: product.name,
    image: firstImageOf(product),
    sizes: product.sizes || [],
    price,
    swatches,
    // Include all currency prices
    priceNGN: product.priceNGN,
    priceUSD: product.priceUSD,
    priceGBP: product.priceGBP,
  }
}

export default function NewArrivals() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<ToastType>('success');
  const [emblaRef] = useEmblaCarousel({ dragFree: true, loop: false });
  const [items, setItems] = useState<NewArrivalItem[]>([]);

  const { addToCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { symbol, currency } = useCurrency();
  const listTrackedRef = useRef(false);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Fetch products from backend and build list (top product first, then random per category)
  useEffect(() => {
    const build = async () => {
      try {
        const res = await fetch('/api/admin/products', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const products: ApiProduct[] = Array.isArray(data) ? data : (data.items || [])
        if (!products || products.length === 0) {
          setItems([])
          return
        }

        const byCategory = new Map<string, ApiProduct[]>()
        for (const p of products) {
          const list = byCategory.get(p.category) || []
          list.push(p)
          byCategory.set(p.category, list)
        }

        let topFirst: ApiProduct | undefined
        try {
          const ares = await fetch('/api/admin/analytics', { cache: 'no-store' })
          if (ares.ok) {
            const adata = await ares.json()
            const top: AnalyticsTopProduct[] = adata?.topProducts || []
            const topName = top[0]?.name?.toLowerCase()
            if (topName) {
              topFirst = products.find(p => p.name?.toLowerCase() === topName)
            }
          }
        } catch {}

        const reps: ApiProduct[] = []
        for (const list of byCategory.values()) {
          if (list.length === 0) continue
          const pick = list[Math.floor(Math.random() * list.length)]
          reps.push(pick)
        }

        const seen = new Set<string>()
        const ordered: ApiProduct[] = []
        if (topFirst) {
          ordered.push(topFirst)
          seen.add(topFirst._id)
        }
        for (const r of reps) {
          if (!seen.has(r._id)) {
            ordered.push(r)
            seen.add(r._id)
          }
        }

        const mapped = ordered.map(p => toItem(p, currency))
        setItems(mapped)
      } catch {
        setItems([])
      }
    }
    build()
  }, [currency])

  useEffect(() => {
    if (listTrackedRef.current) return
    if (items.length === 0) return

    trackViewItemList({
      item_list_name: "New Arrivals",
      items: items.slice(0, 20).map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: 1,
        item_variant: item.sizes?.[0] || "",
        item_category: item.swatches?.[0]?.name || "",
      })),
    })
    listTrackedRef.current = true
  }, [items])

  const handleAddToCart = (item: NewArrivalItem) => {
    const defaultSize = item.sizes && item.sizes.length > 0 ? item.sizes[0] : 'one-size'
    const defaultColor = item.swatches && item.swatches.length > 0 ? item.swatches[0].name : 'Default'

    addToCart({
      id: item.id,
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: 1,
      size: defaultSize,
      color: defaultColor,
      priceNGN: item.priceNGN,
      priceUSD: item.priceUSD,
      priceGBP: item.priceGBP,
    });

    setToastType('success');
    setToastMessage(`Added ${item.name} to cart`);
  };

  const toggleWishlist = (item: NewArrivalItem) => {
    const exists = wishlist.some((w) => w.id === item.id);
    if (exists) {
      removeFromWishlist(item.id);
      setToastType('error');
      setToastMessage(`${item.name} removed from wishlist`);
    } else {
      addToWishlist({ 
        id: item.id, 
        name: item.name, 
        image: item.image, 
        price: item.price,
      });
      setToastType('success');
      setToastMessage(`${item.name} added to wishlist`);
    }
  };

  function Toast({ message, type }: { message: string; type: ToastType }) {
    return (
      <div
        className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 max-w-xs border shadow-lg rounded-lg px-5 py-3 text-sm font-semibold transition-opacity duration-300
          opacity-100 pointer-events-auto
          ${type === 'success'
            ? 'bg-white border-green-400 text-green-700'
            : 'bg-white border-red-400 text-red-600'
          }
        `}
        role="alert"
      >
        {type === 'success' ? (
          <CheckCircle2 className="w-6 h-6" />
        ) : (
          <span className="text-lg font-bold">!</span>
        )}
        <span>{message}</span>
      </div>
    );
  }

  const displayItems = useMemo(() => items, [items]);

  return (
    <section className="bg-[#FFFBEB] mb-[61px] relative">
      <div className="w-full">
        <div
          ref={emblaRef}
          className="overflow-hidden cursor-grab active:cursor-grabbing"
          role="list"
          aria-label="New arrivals product carousel"
        >
          <div className="flex gap-2">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="flex-[0_0_80%] sm:flex-[0_0_60%] md:flex-[0_0_40%] lg:flex-[0_0_30%] group relative"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                role="listitem"
              >
                <div className="relative aspect-[2/3]">
                  <Link href={`/shop/${item.id}`} className="block relative aspect-[2/3]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover rounded-md"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  </Link>
                  <button
                    onClick={() => toggleWishlist(item)}
                    aria-label="Add to wishlist"
                    className={`absolute top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm transition-opacity ${hoveredItem === item.id ? 'opacity-100' : 'opacity-0'
                      }`}
                    type="button"
                  >
                    <Heart
                      className={`w-6 h-6 ${wishlist.some((w) => w.id === item.id)
                        ? 'fill-[#8D2741] text-[#8D2741]'
                        : 'text-[#8D2741]'
                        }`}
                    />
                  </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-[#FBF7F3CC]/80 backdrop-blur-sm p-2 transition-transform transform group-hover:translate-y-0 translate-y-full font-WorkSans">
                  <h3 className="text-[16px] font-normal text-[#2C2C2C]">{item.name}</h3>
                  {/* Sizes */}
                  {item.sizes.length > 0 && (
                    <div className="mb-1">
                      <p className="text-xs text-gray-600">Sizes: {normalizeSizes(item.sizes).join(', ')}</p>
                    </div>
                  )}
                  {/* Colors (all available swatches) */}
                  {item.swatches.length > 0 && (
                    <div className="mb-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-xs text-gray-600">Colors:</span>
                        {item.swatches.map((sw) => (
                          <div
                            key={`${item.id}-${sw.name}`}
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: sw.hex || '#e5e7eb' }}
                            title={sw.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-lg font-medium text-[#2C2C2C]">{symbol}{(item.price || 0).toLocaleString()}</p>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(item)}
                    className="underline font-semibold text-[16px] text-[#2C2C2C] hover:text-[#701d34] transition-colors"
                  >
                    ADD TO CART
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {toastMessage && <Toast message={toastMessage} type={toastType} />}
    </section>
  );
}
