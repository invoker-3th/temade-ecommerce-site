'use client';

import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import Link from 'next/link';
import Image from 'next/image';
import { normalizeSize } from '@/lib/utils';

type CartOverlayProps = {
    onClose: () => void;
};

export default function CartOverlay({ onClose }: CartOverlayProps) {
    const { cartItems, increaseQty, decreaseQty, removeItem, getTotal } = useCart();
    const { symbol } = useCurrency();
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <>
            {/* Overlay Background */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/40 z-30"
            />

            {/* Cart Panel */}
            <div className="fixed top-0 right-0 h-full w-full sm:w-[90%] md:w-[70%] lg:w-[590px] bg-[#FFFBEB] shadow-lg z-50 transition-transform duration-300 ease-in-out overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-4 md:px-5 py-4 border-b">
                    <div className='flex items-center'>
                        <h2 className="text-xl md:text-2xl font-WorkSans font-semibold text-[#222222]">My Cart</h2>
                        {totalQuantity > -1 && (
                            <span className="text-sm md:text-base font-WorkSans font-semibold px-3 py-1 bg-[#CA6F86] rounded-full text-white ml-2">
                                {totalQuantity}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose}>
                        <X className="w-6 h-6 text-[#475367]" />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="p-4 md:p-5 space-y-4 font-WorkSans">
                    {cartItems.length === 0 ? (
                        <>
                            <p className="text-sm font-WorkSans text-gray-500">No items in cart yet.</p>
                            <Link href="/shop" className="text-sm font-WorkSans text-[#CA6F86] hover:underline">
                                Start Shopping
                            </Link>
                        </>
                    ) : (
                        cartItems.map(item => (
                            <div
                                key={item.id}
                                className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 p-4 rounded-lg "
                            >
                                <div className="relative w-full sm:w-[150px] h-[300px] sm:h-[150px]">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover rounded-md"
                                        sizes="(max-width: 640px) 100vw, 150px"
                                        priority={false}
                                      />
                                </div>
                                <div className="flex flex-col justify-between w-full space-y-2">
                                    <div className="space-y-1">
                                        <div className='flex items-center justify-between'>
                                            <h3 className="text-sm sm:text-base font-WorkSans font-medium text-[#222222]">
                                                {item.name}
                                            </h3>
                                            <p className="text-base sm:text-lg font-WorkSans font-semibold text-[#222222]">
                                                {symbol}{item.price.toLocaleString()}
                                            </p>
                                        </div>
                                        <p className="text-xs font-WorkSans text-gray-500">Color: {item.color}</p>
                                        <p className="text-xs font-WorkSans text-gray-400">Size: {normalizeSize(item.size)}</p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className='border border-[#ADADAD] rounded-[5px] flex items-center space-x-2 px-2 py-1'>
                                                <button
                                                    onClick={() => decreaseQty(item.id)}
                                                    className="p-1"
                                                >
                                                    <Minus className="w-4 h-4 text-[#A9A9A9]" />
                                                </button>
                                                <span className="text-sm font-WorkSans">{item.quantity}</span>
                                                <button
                                                    onClick={() => increaseQty(item.id)}
                                                    className="p-1"
                                                >
                                                    <Plus className="w-4 h-4 text-[#CA6F86]" />
                                                </button>
                                            </div>
                                            <button onClick={() => removeItem(item.id)} className="ml-1">
                                                <Trash2 className="w-4 h-4 text-[#98A2B3]" />
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 left-0 right-0 bg-[#FFFBEB] border-t px-4 md:px-5 py-4 shadow-inner">
                    <div className="flex justify-between font-WorkSans font-semibold text-[#5A554C] mb-3 text-sm sm:text-base">
                        <span>Total</span>
                        <span>{symbol}{getTotal().toLocaleString()}</span>
                    </div>
                    <Link href="/checkout">
                        <button
                            className="w-full bg-[#222222] text-white py-2 rounded-md hover:bg-[#111] transition-colors disabled:opacity-60 font-WorkSans font-semibold"
                            disabled={cartItems.length === 0}
                            onClick={onClose}
                        >
                            GO TO CHECKOUT
                        </button>
                    </Link>
                </div>
            </div>
        </>
    );
}
