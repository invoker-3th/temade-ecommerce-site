'use client';

import { ArrowRight } from 'lucide-react';
import { EB_Garamond } from 'next/font/google';
import Link from 'next/link';
import { motion } from 'framer-motion';

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['700', '800'],
});


function CategorySection() {

  return (
    <section
      className=" my-[40px] bg-[#FFFBEB] md:min-h-[150vh] lg:h-[50vh] overflow-hidden flex flex-col justify-center  relative"
    >
      <div className=" bg-[#FFFBEB] min-h-screen md:min-h-[150vh] bg-center bg-no-repeat sm:mx-8"
        style={{
          backgroundImage: "url('/section2-image.png')",
          backgroundPosition: "center 6%",
        }}>

      </div>
      <div className=' absolute top-[30%] sm:top-[50%] left-0 w-full h-full  text-center z-10'>
        <div className={`${ebGaramond.className} font-medium flex flex-col sm:flex-row justify-between items-center w-full max-w-[1200px] mb-[90px] mx-auto`}>
          <Link href="/shop/categories/pants" className="text-responsive text-[#FFFFFF] sm:text-[#CA6F86] ">
            PANTS
          </Link>
          <Link href="/shop/categories/dresses" className="text-responsive2 text-[#FFFFFF] ">
            DRESSES
          </Link>
          <Link href="/shop/categories/skirts" className="text-responsive text-[#FFFFFF] sm:text-[#CA6F86]">
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