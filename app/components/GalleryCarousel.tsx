'use client';


import Image from 'next/image';
import { useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { galleryImages } from '../data/galleryImages'; // 👈 import here
import { useMounted } from '@/app/hooks/useMounted';

function GalleryCarousel() {
  const mounted = useMounted();
  const autoplay = useMemo(
    () => Autoplay({ delay: 2000, stopOnInteraction: false, stopOnMouseEnter: false }),
    []
  );

  const [emblaRef] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      dragFree: true,
    },
    [autoplay]
  );

  if (!mounted) return null;
  return (
    <section className="relative bg-[#FFFBEB] py-10 overflow-hidden">
      <div ref={emblaRef} className="overflow-hidden cursor-grab">
        <div className="flex">
          {galleryImages.map((imgSrc, index) => (
            <div
              key={index}
              className="flex-[0_0_60%] sm:flex-[0_0_35%] md:flex-[0_0_30%] lg:flex-[0_0_25%]"
            >
              <div className="relative aspect-[3/5] w-full overflow-hidden group">
                <Image
                  src={imgSrc}
                  alt={`Gallery item ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
                  priority={index < 2}
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition duration-500 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default GalleryCarousel;
