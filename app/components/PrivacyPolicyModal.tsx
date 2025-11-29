'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Button } from '@/app/components/ui/button'
import { motion } from 'framer-motion'

interface PrivacyPolicyModalProps {
  open: boolean
  onClose: () => void
}

export default function PrivacyPolicyModal({ open, onClose }: PrivacyPolicyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
        onClick={onClose}
      >
        <motion.div
          key="privacy-modal"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }} // ⚡ Faster close speed
          className="w-full max-w-2xl sm:rounded-2xl bg-[#FFFBEB] shadow-xl overflow-hidden font-WorkSans"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
            <DialogTitle className="text-lg sm:text-xl font-semibold text-center">
              Temade Studios Privacy Policy
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[70vh] p-4 text-sm text-gray-700 dark:text-gray-300 space-y-4 font-WorkSans scrollbar-thin scrollbar-thumb-[#8D2741] scrollbar-track-[#FFD7E1] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#8D2741] [&::-webkit-scrollbar-track]:bg-[#FFD7E1] [&::-webkit-scrollbar]:w-2">
            <p>
              We are Temade Studios, and we care deeply about your trust and privacy. This Privacy Policy explains how we collect, use, and protect your information when you interact with us—whether you are visiting our Instagram page, sending us a DM, or making a purchase from us.
            </p>
            <p>
              By connecting with us or using our services, you are agreeing to how we handle your information as described below.
            </p>

            <h3 className="text-lg font-semibold text-[#8D2741]">1. The Kind of Information We Collect</h3>
            <p>We only collect information that helps us serve you better.</p>
            <h4 className="font-semibold">What you share with us directly:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Your name and contact details (like your phone number or email)</li>
              <li>Your Instagram handle or social media username</li>
              <li>Delivery information when you make a purchase</li>
              <li>Payment details (processed securely through trusted partners)</li>
              <li>Messages, comments, or feedback you send us</li>
            </ul>
            <h4 className="font-semibold">What we collect automatically:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Device type, browser, and location (city or country)</li>
              <li>How you interact with our content or website</li>
              <li>The time and date of your visits</li>
            </ul>
            <p>We use this information to understand our audience better and improve your experience.</p>

            <h3 className="text-lg font-semibold text-[#8D2741]">2. How We Use Your Information</h3>
            <p>We promise to use your information responsibly and only for the right reasons, things like:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Processing your orders or booking requests</li>
              <li>Sending you updates about new collections or collaborations</li>
              <li>Replying to your DMs, questions, or feedback</li>
              <li>Improving our products and customer experience</li>
              <li>Keeping you informed about special offers (only if you want them)</li>
              <li>Making sure our platforms are safe, secure, and running smoothly</li>
            </ul>
            <p>We will never sell your personal data, not now, not ever.</p>

            <h3 className="text-lg font-semibold text-[#8D2741]">3. Sharing Your Information</h3>
            <p>We work with trusted partners to help us serve you better, for example:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Payment processors that handle your transactions safely</li>
              <li>Delivery services that get your order to you</li>
              <li>Analytics or marketing tools that help us understand what our audience loves</li>
            </ul>
            <p>We only share what’s absolutely necessary and always make sure your information stays protected. We may also share information if required by law or to prevent fraud, but that’s it.</p>

            <h3 className="text-lg font-semibold text-[#8D2741]">4. Cookies & Similar Tools</h3>
            <p>
              Like most brands, we use cookies and similar tools to make your experience smoother and more personal. They help us remember your preferences, see which content you enjoy, and improve our marketing. You can choose to turn off cookies in your browser at any time, though some parts of our site may not work as smoothly.
            </p>

            <h3 className="text-lg font-semibold text-[#8D2741]">5. Your Rights</h3>
            <p>You are always in control of your information. Depending on where you live, you can:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Ask to see what data we have about you</li>
              <li>Request corrections if something’s inaccurate</li>
              <li>Ask us to delete your data (when possible)</li>
              <li>Opt out of marketing messages at any time</li>
            </ul>
            <p>If you ever want to update or remove your information, just send us an email or DM.</p>

            <h3 className="text-lg font-semibold text-[#8D2741]">6. How We Keep Your Information Safe</h3>
            <p>
              We take your privacy seriously. We use trusted systems, password protection, and secure platforms to keep your information safe. That said, no system is 100% perfect but we always do our best to protect your data.
            </p>

            <h3 className="text-lg font-semibold text-[#8D2741]">7. How Long We Keep Your Data</h3>
            <p>
              We only keep your information for as long as we need to—for example, to fulfill an order or stay in touch about a service you requested. When we no longer need it, we delete it securely.
            </p>

            <h3 className="text-lg font-semibold text-[#8D2741]">8. Updates to This Policy</h3>
            <p>
              We may update this Privacy Policy occasionally if our practices change. When that happens, we will post the updated version here with a new “last updated” date.
            </p>

            <h3 className="text-lg font-semibold text-[#8D2741]">9. How to Reach Us</h3>
            <p>
              If you have any questions about this Privacy Policy or how we use your data, please reach out—we would love to help.
            </p>
            <ul className="list-none space-y-1">
              <li><strong>Temade Studios</strong></li>
              <li>Email: <a href="mailto:orders@temadestudios.com" className="text-[#CA6F86] underline">orders@temadestudios.com</a></li>
              <li>Instagram: <strong>@temade_studios</strong></li>
              <li>Address: 12 Otunba Oshikoya Close, Lekki, Lagos, Nigeria</li>
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
