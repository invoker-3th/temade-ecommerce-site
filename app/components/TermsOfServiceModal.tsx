'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Button } from '@/app/components/ui/button'
import { motion } from 'framer-motion'

interface TermsOfServiceModalProps {
  open: boolean
  onClose: () => void
}

export default function TermsOfServiceModal({ open, onClose }: TermsOfServiceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
        onClick={onClose}
      >
        <motion.div
          key="terms-modal"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="w-full max-w-2xl sm:rounded-2xl bg-[#FFFBEB] shadow-xl overflow-hidden font-WorkSans"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
            <DialogTitle className="text-lg sm:text-xl font-semibold text-center">
              TEMADE STUDIOS - TERMS OF SERVICE
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[70vh] p-4 text-sm text-gray-700 dark:text-gray-300 space-y-4 font-WorkSans scrollbar-thin scrollbar-thumb-[#8D2741] scrollbar-track-[#FFD7E1]">
            <p>
              Temade Studios is a fashion brand operating in Lagos, Nigeria. By accessing any of our platforms including our website, Instagram page, WhatsApp channel, or by making a purchase you agree to be bound by the Terms and Conditions outlined below.
            </p>

            <p>
              These Terms govern all purchases, interactions, and use of Temade Studios&apos; services, products, and digital platforms.
            </p>

            <p>
              We strongly encourage customers to review these policies before engaging with us.
            </p>

            <h3 className="font-semibold text-lg">1. GENERAL USE OF OUR WEBSITE & PLATFORMS</h3>
            <p>
              This Website and all Temade Studios digital platforms are owned, controlled, and operated by Temade Studios, a registered business in Lagos, Nigeria. By using any of our platforms, you agree to comply with the policies guiding their use.
            </p>

            <p>
              All content on our platforms including graphics, images, text, logos, icons, videos, designs, and data compilations is the exclusive intellectual property of Temade Studios and/or our affiliates. Such content is protected under applicable intellectual property laws in Nigeria and internationally.
            </p>

            <p>
              Our platforms may contain links to third-party websites. Unless expressly stated, Temade Studios has no affiliation with and no control over such external sites. We assume no responsibility for any loss or damage arising from your use of third-party platforms.
            </p>

            <p>
              Temade Studios reserves the right to modify product listings, policies, and content at any time. Customers are responsible for reviewing the most current version before placing orders.
            </p>

            <h3 className="font-semibold text-lg">2. COMMUNICATION & OPERATING HOURS</h3>
            <p>
              Orders may be placed via our website, Instagram, Email, or WhatsApp.
            </p>

            <p>
              Customer service and support are available Monday – Saturday, 10:00 AM – 5:00 PM (WAT) excluding public holidays.
            </p>

            <h3 className="font-semibold text-lg">3. PRODUCT INFORMATION & AVAILABILITY</h3>
            <p>
              All products listed on our platforms are subject to availability and may be restocked, modified, or discontinued without prior notice.
            </p>

            <p>
              Due to unique production processes including manual craftsmanship colors, textures, prints, and fabrics may differ slightly from product display images.
            </p>

            <p>
              Temade Studios strives for accuracy in all product descriptions; however, minor variations may occur and are considered normal.
            </p>

            <h3 className="font-semibold text-lg">4. ORDER PROCESSING</h3>
            <p>
              All orders are processed within 1–3 working days after payment confirmation.
            </p>

            <p>
              Custom-made or pre-order items require 5–10 working days for production. In periods of high demand or backlogs, processing may extend slightly beyond this range.
            </p>

            <p>
              Once your order has been produced or packed, a delivery update or tracking number (where applicable) will be shared.
            </p>

            <p>
              Orders placed on weekends or public holidays will be processed the next working day.
            </p>

            <h3 className="font-semibold text-lg">5. PAYMENT TERMS</h3>
            <p>
              Temade Studios accepts payment via:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Bank transfer</li>
              <li>Debit/credit cards</li>
              <li>Paystack</li>
              <li>Flutterwave</li>
              <li>Other approved secure payment partners</li>
            </ul>

            <p>
              An order is considered valid only after payment is completed.
            </p>

            <p>
              We may decline or cancel an order if:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Payment is incomplete</li>
              <li>The item becomes unavailable</li>
              <li>Fraudulent or suspicious activity is suspected</li>
            </ul>

            <p>
              In such cases, any received payments will be refunded where applicable.
            </p>

            <p>
              Product prices may change due to supply conditions or currency fluctuations. Prices shown at checkout are the final applicable prices.
            </p>

            <h3 className="font-semibold text-lg">6. SHIPPING & DELIVERY</h3>
            <h4 className="font-semibold">GENERAL</h4>
            <p>
              Temade Studios partners with reliable logistics companies for local and international deliveries. Customers must ensure that all delivery information including name, address, and phone number is accurate at checkout. Once an order is dispatched, we may not be able to amend delivery details. Shipping timelines begin after dispatch, not date of purchase.
            </p>

            <h4 className="font-semibold">DELIVERY TIMELINES</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Within Nigeria: 1–4 working days</li>
              <li>International: 7–10 working days, subject to customs clearance and courier operations</li>
            </ul>

            <h4 className="font-semibold">TRACKING</h4>
            <p>
              Once your order is on the way, we will send you a tracking number (if available) so you can follow its journey.
            </p>

            <p>
              If your tracking link doesn&apos;t update immediately, don&apos;t worry it can take a day or two before the courier system refreshes.
            </p>

            <h4 className="font-semibold">Delivery Fees</h4>
            <p>
              Delivery fees depend on your location and will be shared at checkout or when we confirm your order.
            </p>

            <p>
              Be sure to follow us on instagram @temade_studios so you don&apos;t miss out.
            </p>

            <h3 className="font-semibold text-lg">7. MISSED, DAMAGED, OR INCOMPLETE DELIVERIES</h3>
            <p>
              If your delivery is missed, the courier will usually reach out to reschedule.
            </p>

            <p>
              Please double-check that your address and contact information are correct before placing your order, we wouldn&apos;t want your package to go missing!
            </p>

            <h3 className="font-semibold text-lg">8. RETURNS, EXCHANGES & REFUNDS</h3>
            <p>
              Because of the nature of our products (and to keep things hygienic), all sales are final, unless your item arrives damaged or incorrect.
            </p>

            <p>
              If there&apos;s an issue, please reach out and we&apos;ll do our best to help.
            </p>

            <p>
              You can check our Return & Exchange Policy for more details.
            </p>

            <h4 className="font-semibold">CONDITIONS FOR RETURN</h4>
            <p>
              Returns are accepted only if:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>The wrong item was delivered</li>
              <li>The item is defective from production</li>
              <li>The product significantly differs from the confirmed order specification</li>
            </ul>

            <h4 className="font-semibold">EXCHANGES</h4>
            <p>
              Exchanges may be requested within 72 hours of placing an order, for items of equal value.
            </p>

            <p>
              If approved, the production timeline restarts from the date of confirmation.
            </p>

            <h3 className="font-semibold text-lg">9. PRIVACY & DATA PROTECTION</h3>
            <h4 className="font-semibold">1. The Kind of Information We Collect</h4>
            <p>
              We only collect information that helps us serve you better.
            </p>

            <p>
              <strong>What you share with us directly:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Your name and contact details (like your phone number or email)</li>
              <li>Your Instagram handle or social media username</li>
              <li>Delivery information when you make a purchase</li>
              <li>Payment details (processed securely through trusted partners)</li>
              <li>Messages, comments, or feedback you send us</li>
            </ul>

            <p>
              <strong>What we collect automatically:</strong>
            </p>
            <p>
              When you visit our pages or website, we may gather some basic details automatically, like:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Device type, browser, and location (city or country)</li>
              <li>How you interact with our content or website</li>
              <li>The time and date of your visits</li>
            </ul>

            <p>
              We use this information to understand our audience better and improve your experience.
            </p>

            <h4 className="font-semibold">2. How We Use Your Information</h4>
            <p>
              We promise to use your information responsibly and only for the right reasons, things like:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Processing your orders or booking requests</li>
              <li>Sending you updates about new collections or collaborations</li>
              <li>Replying to your DMs, questions, or feedback</li>
              <li>Improving our products and customer experience</li>
              <li>Keeping you informed about special offers (only if you want them)</li>
              <li>Making sure our platforms are safe, secure, and running smoothly</li>
            </ul>

            <p>
              We will <strong>never sell your personal data</strong>, not now, not ever.
            </p>

            <h4 className="font-semibold">3. Sharing Your Information</h4>
            <p>
              We work with trusted partners to help us serve you better, for example:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Payment processors that handle your transactions safely</li>
              <li>Delivery services that get your order to you</li>
              <li>Analytics or marketing tools that help us understand what our audience loves</li>
            </ul>

            <p>
              We only share what&apos;s absolutely necessary and always make sure your information stays protected.
            </p>

            <p>
              We may also share information if required by law or to prevent fraud, but that&apos;s it.
            </p>

            <h4 className="font-semibold">4. Cookies & Similar Tools</h4>
            <p>
              Like most brands, we use cookies and similar tools to make your experience smoother and more personal.
            </p>

            <p>
              They help us remember your preferences, see which content you enjoy, and improve our marketing.
            </p>

            <p>
              You can choose to turn off cookies in your browser at any time, though some parts of our site may not work as smoothly.
            </p>

            <h4 className="font-semibold">5. Your Rights</h4>
            <p>
              You are always in control of your information. Depending on where you live, you can:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Ask to see what data we have about you</li>
              <li>Request corrections if something&apos;s inaccurate</li>
              <li>Ask us to delete your data (when possible)</li>
              <li>Opt out of marketing messages at any time</li>
            </ul>

            <p>
              If you ever want to update or remove your information, just send us an email or DM.
            </p>

            <h4 className="font-semibold">6. How We Keep Your Information Safe</h4>
            <p>
              We take your privacy seriously.
            </p>

            <p>
              We use trusted systems, password protection, and secure platforms to keep your information safe.
            </p>

            <p>
              That said, no system is 100% perfect but we always do our best to protect your data.
            </p>

            <h4 className="font-semibold">7. How Long We Keep Your Data</h4>
            <p>
              We only keep your information for as long as we need to for example, to fulfill an order or stay in touch about a service you requested.
            </p>

            <p>
              When we no longer need it, we delete it securely.
            </p>

            <h4 className="font-semibold">8. Updates to This Policy</h4>
            <p>
              We may update this Privacy Policy occasionally if our practices change.
            </p>

            <p>
              When that happens, we will post the updated version here with a new &quot;last updated&quot; date.
            </p>

            <h4 className="font-semibold">9. How to Reach Us</h4>
            <p>
              If you have any questions about this Privacy Policy or how we use your data, please reach out, we would love to help.
            </p>

            <ul className="list-none space-y-1">
              <li><strong>Temade Studios</strong></li>
              <li>Email: <a href="mailto:orders@temadestudios.com" className="text-[#CA6F86] underline">orders@temadestudios.com</a></li>
              <li>Instagram: <strong>@temade_studios</strong></li>
              <li>Address: 12 Otunba Oshikoya close Lekki, Lagos, Nigeria</li>
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

