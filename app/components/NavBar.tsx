'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  CircleUser,
  Heart,
  Menu,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import ShopTemadeDropdown from "./ShopTemadeDropdown";
import CartOverlay from "./CartOverlay";
import { useCart } from "../context/CartContext";
// import { useWishlist } from "../context/WishlistContext";
// import toast, { Toaster } from "react-hot-toast";

const NavBar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  type SearchProduct = { _id: string; name: string; category?: string; colorVariants?: Array<{ images: Array<{ src: string; alt: string }> }> };
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const { cartItems } = useCart();
  const router = useRouter();

  const totalCartQuantity = (cartItems || []).reduce((sum, item) => sum + item.quantity, 0);

  const handleCategorySelect = (category: string) => {
    console.log("Selected category:", category);
  
  };

  useEffect(() => {
    if (isMobileMenuOpen || isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen, isCartOpen]);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      if (!searchOpen) return;
      const q = searchQuery.trim();
      if (!q) { setSearchResults([]); return; }
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!res.ok) throw new Error('search failed');
        const data = await res.json();
        setSearchResults((data.results || []).slice(0, 2));
      } catch {
        // ignore abort
      } finally {
        setSearchLoading(false);
      }
    };
    const id = setTimeout(run, 250);
    return () => { controller.abort(); clearTimeout(id); };
  }, [searchQuery, searchOpen]);

  return (
    <>
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 bg-[#FFFBEB] font-WorkSans  text-[14px] font-medium leading-[100%] tracking-[0]">
        <div className="max-w-[1280px] m-auto px-8 py-3 flex justify-between items-center">
          <Link href="/">
            <Image
              src="/temade-icon.png"
              alt="Temade Logo"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex space-x-[32px] text-sm text-[#030C26]">
            <Link href="/">NEW ARRIVALS</Link>
            <Link href="/collections">COLLECTIONS</Link>
            <button
              onClick={() => setIsCategoryDropdownOpen(true)}
              className={`flex items-center gap-1 transition-colors ${isCategoryDropdownOpen ? "underline text-[#8D2741] font-semibold" : ""}`}
            >
              SHOP TEMADE
              <ChevronDown className="w-4 h-4" />
            </button>
            <Link href="/lookbook">LOOKBOOK</Link>
          </div>

          {/* Icons */}
          <div className="hidden sm:flex items-center space-x-5 text-[#030C26] relative">
            <button onClick={() => setSearchOpen((v) => !v)} className="hover:text-[#8D2741] transition-colors">
              <Search />
            </button>
            {searchOpen && (
              <div className="absolute right-0 top-10 w-80 bg-white border rounded shadow-lg p-3 z-50">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or category"
                  className="w-full border rounded px-3 py-2 mb-2"
                />
                <div className="max-h-80 overflow-y-auto">
                  {searchLoading ? (
                    <div className="text-sm text-gray-500">Searching...</div>
                  ) : (
                    <>
                      {searchQuery && (
                        <div className="text-xs text-gray-500 mb-1">Results for: {searchQuery}</div>
                      )}
                      {searchResults.length === 0 ? (
                        <div className="text-sm text-gray-500">No results</div>
                      ) : (
                        <ul className="divide-y">
                          {searchResults.map((p) => (
                            <li key={p._id} className="py-2">
                              <Link href={`/shop/${p._id}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 hover:bg-gray-50 rounded px-2 py-1">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p?.colorVariants?.[0]?.images?.[0]?.src || '/placeholder.svg'} alt={p.name} className="w-10 h-10 object-cover rounded" />
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{p.name}</div>
                                  <div className="text-xs text-gray-500">{p.category}</div>
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                      {searchQuery && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => { router.push(`/search?q=${encodeURIComponent(searchQuery)}`); setSearchOpen(false); }}
                            className="text-sm text-[#8D2741] hover:underline"
                          >
                            View all
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">Tip: type a letter (e.g., T) or a category (e.g., skirts)</div>
              </div>
            )}

            {/* Wishlist Icon */}
            <Link href="/wishlist" className="relative hover:text-[#8D2741] transition-colors flex">
              <Heart />
            </Link>

            <Link href="/account" className="hover:text-[#8D2741] transition-colors">
              <CircleUser />
            </Link>

            {/* Cart Icon */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative hover:text-[#8D2741] transition-colors flex items-center text-[14px]"
            >
              <ShoppingCart />
              {totalCartQuantity > 0 ? (
                <span className="absolute z-10 text-[14px] left-5 font-bold px-1">
                  [{totalCartQuantity}]
                </span>
              ) : "[0]"}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => !isMobileMenuOpen && setIsMobileMenuOpen(true)}
              className="hidden sm:block lg:hidden text-[#030C26] ml-4"
            >
              <Menu />
            </button>
          </div>

          {/* Hamburger (Mobile) */}
          <button
            onClick={() => !isMobileMenuOpen && setIsMobileMenuOpen(true)}
            className="sm:hidden text-[#030C26]"
          >
            <Menu />
          </button>
        </div>
      </nav>

      {/* Mobile Side Menu */}
      <div
        className={`fixed top-9 left-0 h-full w-64 bg-[#FFFBEB] shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:hidden`}
      >
        <div className="flex justify-between items-center px-4 py-4 border-b">
          <Image src="/temade-icon.png" alt="Logo" width={36} height={36} />
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#030C26]">
            <X />
          </button>
        </div>
        <div className="flex flex-col px-6 py-4 space-y-6 text-[#030C26] text-sm">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>NEW ARRIVALS</Link>
          <Link href="/collections" onClick={() => setIsMobileMenuOpen(false)}>COLLECTIONS</Link>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsCategoryDropdownOpen(true);
            }}
            className="ml-0 block text-left"
          >
            SHOP TEMADE
          </button>
          <Link href="/lookbook" onClick={() => setIsMobileMenuOpen(false)}>LOOKBOOK</Link>

          <div className="flex sm:hidden w-full space-x-5">
            <Link href="/search" onClick={() => setIsMobileMenuOpen(false)}><Search /></Link>

            {/* Mobile Wishlist Icon */}
            <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="relative flex">
              <Heart />
            </Link>

            <Link href="/account" onClick={() => setIsMobileMenuOpen(false)}><CircleUser /></Link>

            {/* Mobile Cart Icon */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative hover:text-[#8D2741] transition-colors flex items-center text-[14px]"
            >
              <ShoppingCart />
              {totalCartQuantity > 0 ? (
                <span className="absolute z-10  text-[14px] left-5 font-bold px-1">
                  [{totalCartQuantity}]
                </span>
              ) : "[0]"}
            </button>
          </div>
        </div>
      </div>

      {/* Smooth Backdrop (Mobile menu) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 top-9 bg-black bg-opacity-30 transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Category Dropdown */}
      {isCategoryDropdownOpen && (
        <ShopTemadeDropdown
          onClose={() => setIsCategoryDropdownOpen(false)}
          onSelect={handleCategorySelect}
        />
      )}

      {/* Cart Overlay */}
      {isCartOpen && <CartOverlay onClose={() => setIsCartOpen(false)} />}
    </>
  );
};

export default NavBar;
