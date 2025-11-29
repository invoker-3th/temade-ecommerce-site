"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { ScrollArea } from "@/app/components/ui/scroll-area"
import { Button } from "@/app/components/ui/button"
import { motion } from "framer-motion"

type ContactModalProps = {
  open: boolean
  onClose: () => void
}

export default function ContactModal({ open, onClose }: ContactModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
        onClick={onClose}
      >
        <motion.div
          key="contact-modal"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="w-full max-w-2xl sm:rounded-2xl bg-[#FFFBEB] shadow-xl overflow-hidden font-WorkSans"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader className="p-4 border-b border-gray-200">
            <DialogTitle className="text-lg sm:text-xl font-semibold text-center text-[#5A554C]">
              Contact Temade Studios
            </DialogTitle>
            <p className="text-sm text-center text-[#7a7468]">
              We would love to hear from you! Let us know how we can help.
            </p>
          </DialogHeader>

          <ScrollArea className="h-[70vh] p-4 text-sm text-[#4b4640] space-y-5">
            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-[#8D2741]">Contact Us</h3>
              <p>
                We would love to hear from you! Whether you are making an inquiry, need support, or want to
                collaborate, the Temade Studios team is here to assist you.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-[#8D2741]">Hours of Operation</h3>
              <p>Our customer support team is available to help you from:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>9:00 AM – 5:00 PM, Monday to Friday</li>
                <li>10:00 AM – 2:00 PM, Saturday - Sunday</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-[#8D2741]">Email</h3>
              <p>For general inquiries, collaborations, or customer support, reach out to us at:</p>
              <p>
                <strong>Email:</strong>{" "}
                <a href="mailto:orders@temadestudios.com" className="text-[#CA6F86] underline">
                  orders@temadestudios.com
                </a>
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-[#8D2741]">Phone & WhatsApp</h3>
              <p>You can also reach us via phone during our business hours:</p>
              <p>
                <strong>Phone:</strong> +234 806 214 0303
              </p>
              <p>
                Prefer to chat? Connect with us directly on WhatsApp for quick responses and real-time support.
              </p>
              <p>
                <strong>Chat with us on WhatsApp:</strong>{" "}
                <a href="https://wa.me/2348062140303" className="text-[#CA6F86] underline" target="_blank">
                  +234 806 214 0303
                </a>
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-[#8D2741]">Address</h3>
              <p>Book an appointment to visit our studio at:</p>
              <p>
                12 Otunba Oshikoya Close, Lekki, Lagos, Nigeria
              </p>
            </section>
          </ScrollArea>

          <div className="border-t border-gray-200 p-4 text-center">
            <Button
              onClick={onClose}
              className="bg-[#8D2741] hover:bg-[#551827] text-white px-6 rounded-full"
            >
              Close
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}


