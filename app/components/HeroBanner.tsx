'use client';


import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Work_Sans } from 'next/font/google';
import {motion} from 'framer-motion';


const workSans = Work_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export default function HeroBanner() {
  return (
    <section
      className="relative w-full min-h-svh md:min-h-[130vh]  bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('/temade-hero1.jpg')`,
        backgroundPosition: 'center 15%',
      }}
    >
      {/* Centered Container */}
      <div className="relative flex  items-center justify-center">
        <div
          className="flex items-center justify-center text-center w-full min-h-svh md:min-h-[130vh]  bg-opacity-50 bg-black p-8"
        >
          <div className='border-[2px] border-white p-8 md:p-16 rounded-[5px] '>
            <div className="font-garamond space-y-8 text-white max-w-[358px]">
              <h1 className="leading-none font-medium text-4xl md:text-5xl">
                Effortless,
                Beautiful,
                Sustainable.
              </h1>
            </div>

            <Link href="/shop">
              <button className={`${workSans.className} mt-8 flex items-center gap-2 border-[2px] border-white px-8 py-3 text-white hover:bg-[#8D2741] hover:border-[#8D2741] rounded-[5px] m-auto transition-all duration-300 ease-in-out`}>
                <span className="text-lg">SHOP TEMADE</span>
                 <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
