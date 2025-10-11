'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Button } from '@/app/components/ui/button'
import { motion } from 'framer-motion'

interface ShippingPolicyModalProps {
    open: boolean
    onClose: () => void
}

export default function ShippingPolicyModal({ open, onClose }: ShippingPolicyModalProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
                onClick={onClose}
            >
                <motion.div
                    key="shipping-modal"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }} // faster transition
                    className="w-full max-w-2xl sm:rounded-2xl bg-[#FFFBEB] shadow-xl overflow-hidden font-WorkSans"
                    onClick={(e) => e.stopPropagation()}
                >
                    <DialogHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <DialogTitle className="text-lg sm:text-xl font-semibold text-center">
                            Temade Studios Shipping Policy
                        </DialogTitle>
                    </DialogHeader>

                    <ScrollArea className="h-[70vh] p-4 text-sm text-gray-700 dark:text-gray-300 space-y-4 font-WorkSans scrollbar-thin scrollbar-thumb-[#8D2741] scrollbar-track-[#FFD7E1]">
                        <p>
                            Thank you for shopping with <strong>Temade Studios</strong>. We&apos;re excited to get your order
                            to you as soon as possible. Below is our shipping and delivery information.
                        </p>

                        <h3 className="font-semibold text-lg">Processing Your Order</h3>
                        <p>
                            Orders are processed within <strong>1-2 working days</strong> after confirmation.
                            Custom/pre-order items may take <strong>5-7 working days</strong>.
                        </p>

                        <h3 className="font-semibold text-lg">Delivery Timeline</h3>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong>Within Nigeria:</strong> Lagos 1-2 days, others 2-5 days.</li>
                            <li><strong>Outside Nigeria:</strong> 7-14 working days depending on customs.</li>
                        </ul>

                        <h3 className="font-semibold text-lg">Delivery Fees</h3>
                        <p>
                            Fees depend on your location. For more info, contact{' '}
                            <a href="mailto:orders@temadestudios.com" className="text-blue-500 underline">
                                orders@temadestudios.com
                            </a>.
                        </p>

                        <h3 className="font-semibold text-lg">Tracking Your Order</h3>
                        <p>
                            A tracking number will be provided once shipped. Tracking may take 1-2 days to update.
                        </p>

                        <h3 className="font-semibold text-lg">Damaged or Missing Items</h3>
                        <p>
                            Contact us within 48 hours with your order number and clear photos of the issue.
                        </p>

                        <h3 className="font-semibold text-lg">Need Help?</h3>
                        <ul className="list-disc list-inside">
                            <li>
                                Email: <a href="mailto:orders@temadestudios.com" className="text-blue-500 underline">
                                    orders@temadestudios.com
                                </a>
                            </li>
                            <li>Instagram: <strong>@temade_studios</strong></li>
                            <li>Support: <strong>+234 806 214 0303</strong></li>
                        </ul>
                    </ScrollArea>

                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 text-center">
                        <Button
                            onClick={onClose}
                            className="bg-[#8D2741] hover:bg-[#551827] text-white px-6 rounded"
                        >
                            Close
                        </Button>
                    </div>
                </motion.div>
            </DialogContent>
        </Dialog>
    )
}
