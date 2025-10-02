'use client';

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { EB_Garamond } from 'next/font/google';
import { Work_Sans } from 'next/font/google';
import Link from 'next/link';
import { useMounted } from '@/app/hooks/useMounted';

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['700', '800'],
});

const workSans = Work_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'], // adjust weights as needed
});

const Hero = () => {
  const mounted = useMounted();
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const buttonY = useTransform(scrollYProgress, [0, 1], [100, 0]);
  const opacity = useTransform(scrollYProgress, [0.2, 0.5], [1, 1]);

  if (!mounted) {
    return (
      <section
        className="relative w-full min-h-svh md:min-h-[130vh] overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/temade-hero1.jpg')",
          backgroundPosition: "center 15%",
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-end text-center text-white bg-black/40 z-10 pb-[15rem] md:pb-40">
          <div className="flex flex-col items-center">
            <h1 className={`${ebGaramond.className} text-[44px] font-extrabold drop-shadow-lg text-[#FFFFFF]`}>
              THE NEW COLLECTION IS HERE
            </h1>
            <p className={`${workSans.className} text-[15px] drop-shadow-md font-normal`}>
              Discover our latest drop; designed to move with you, made to last. 
            </p>
            <Link href="/shop">
              <button
                className={`${workSans.className} flex items-center gap-2 text-[10px] sm:text-[18px] md:text-xl hover:bg-[#8D2741] hover:border-[#8D2741] px-8 py-4 rounded-[5px] border-[2px] transition drop-shadow-lg bg-transparent border-white text-white`} 
              >
                SHOP THE NEW COLLECTION
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-svh md:min-h-[100vh] overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/temade-hero1.jpg')",
        backgroundPosition: "center 15%",
      }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-end text-center text-white bg-black/40 z-10 pb-[15rem] md:pb-40">
        <motion.div
          
          className="flex flex-col items-center"
        >
          <h1 className={`${ebGaramond.className} text-[44px] font-extrabold drop-shadow-lg text-[#FFFFFF]`}>
            THE NEW COLLECTION IS HERE
          </h1>
          <p className={`${workSans.className} text-[15px] drop-shadow-md font-normal`}>
            Discover our latest drop; designed to move with you, made to last. 
          </p>
          <Link href="/shop">
            <motion.button
              style={{ y: buttonY, opacity }}
              className={`${workSans.className} flex items-center gap-2 text-[10px] sm:text-[18px]  md:text-xl hover:bg-[#8D2741] hover:border-[#8D2741] px-8 py-4 rounded-[5px] border-[2px] transition drop-shadow-lg bg-transparent border-white text-white`} 
            >
              SHOP THE NEW COLLECTION
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>

  );
};

export default Hero;
