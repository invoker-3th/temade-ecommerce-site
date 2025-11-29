'use client';

import { ArrowRight } from 'lucide-react';
import { EB_Garamond } from 'next/font/google';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['700', '800'],
});


function CategorySection() {

  return (
    <section className="relative bg-[#FFFBEB]">
      <div className="mx-auto flex w-full justify-center px-4">
        <div className="relative w-full md:w-[75%] min-h-[100vh] overflow-hidden bg-[#845D2D] flex items-center justify-center">
          <Image
            src="/IMG_3258(1).jpg"
            alt="TemADE Studios model wearing cotton adire"
            fill
            sizes="(max-width: 768px) 100vw, 75vw"
            className="object-contain object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/60" />
        </div>
      </div>
      <div className="absolute top-[30%] sm:top-[50%] left-0 w-full h-full text-center z-10">
        <div className={`${ebGaramond.className} font-medium flex flex-col sm:flex-row justify-between items-center w-full max-w-[1200px] mb-[90px] mx-auto`}>
          <Link href="/shop/categories/pants" className="text-2xl sm:text-[50px] text-[#FFFFFF] sm:text-[#CA6F86] transition-colors">
            PANTS
          </Link>
          <Link href="/shop/categories/dresses" className="text-3xl sm:text-[70px] text-[#FFFFFF] transition-colors">
            DRESSES
          </Link>
          <Link href="/shop/categories/skirts" className="text-2xl sm:text-[50px] text-[#FFFFFF] sm:text-[#CA6F86] transition-colors">
            SKIRTS
          </Link>
        </div>
        {/* Shop Now Button */}
        <Link href="/shop" passHref>
          <button
            className="border-[2px] border-white hover:border-[#701d34] text-white px-8 py-4 rounded-lg hover:bg-[#701d34] transition flex items-center m-auto"
          >
            SHOP NOW
             <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
          </button>
        </Link>
      </div>
    </section>
  );
}

export default CategorySection; 