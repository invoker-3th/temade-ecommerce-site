"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { ScrollArea } from "@/app/components/ui/scroll-area"
import { Button } from "@/app/components/ui/button"
import { motion } from "framer-motion"

type AboutModalProps = {
  open: boolean
  onClose: () => void
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
        onClick={onClose}
      >
        <motion.div
          key="about-modal"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="w-full max-w-3xl sm:rounded-2xl bg-[#FFFBEB] shadow-xl overflow-hidden font-WorkSans"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader className="p-4 border-b border-gray-200">
            <DialogTitle className="text-lg sm:text-2xl font-semibold text-center text-[#5A554C]">
              About TemADE Studios
            </DialogTitle>
            <p className="text-sm text-center text-[#7a7468]">
              Crafting effortless elegance with responsible practices and global experience.
            </p>
          </DialogHeader>

          <ScrollArea className="h-[70vh] p-4 space-y-5 text-sm leading-relaxed text-[#4b4640]">
            <section className="space-y-3">
              <h3 className="text-base font-semibold text-[#8D2741]">Temilade Ashafa — Founder & Creative Director</h3>
              <p>
                Temilade Ashafa studied Apparel Design in the USA, earning a Bachelor of Fine Arts with Honors in 2010.
                She began her career in the United Kingdom designing for a couture company that dressed celebrities such
                as Taraji P. Henson, Chrissy Teigen, and Kelly Rowland.
              </p>
              <p>
                She later collaborated with sustainable and niche luxury houses before joining the legendary global brand
                Burberry, contributing across Womens RTW, Runway, and Accessories for over three years. Beyond daily
                collections, she supported high-profile projects including Beyoncé’s OTR2 tour and VIP requests for Madonna,
                Rosalia, and Irina Shayk.
              </p>
              <p>
                During this time she also completed Harvard Business School’s CORe Program, gaining fundamentals in business
                strategy, accounting, and analytics to solve complex business problems.
              </p>
              <p>
                With 11+ years of experience, Temilade returned to Nigeria in 2021 to launch a brand consultancy dedicated
                to raising African fashion to internationally regulated standards. She leveraged her global network to mentor
                creatives, support innovative projects, and grow the ecosystem before founding TemADE Studios.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-[#8D2741]">TemADE Studios — Effortless, Responsible Luxury</h3>
              <p>
                TemADE Studios is a lifestyle brand focused on making women feel beautiful effortlessly. We craft simple,
                flattering silhouettes using materials and processes that embrace sustainable practices, so our community
                can feel good for aesthetic and ethical reasons alike.
              </p>
              <p>
                The brand releases small capsule collections 3–4 times a year—featuring dresses, tops, bottoms, jackets,
                and interchangeable sets—alongside accessories such as bags and jewelry to elevate each look.
              </p>
              <p>
                Since launch, TemADE Studios has hosted successful pop-ups in Houston, London, and Lagos, and showcased at
                Africa Fashion Week London in partnership with Adire Oodua Textile Hub, celebrating Nigerian heritage through
                vibrant Adire fabrics.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-[#8D2741]">Celebrating African Craft</h3>
              <p>
                TemADE Studios keeps all production in Nigeria, partnering with local artisans and creatives to promote the
                country as a global fashion hub. Collections spotlight custom Adire and other indigenous techniques, produced
                in our solar-powered facility with locally sourced materials.
              </p>
              <p>
                Our mission is to champion African craftsmanship, foster ethical practices, and continue building a global
                brand for the modern woman.
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


