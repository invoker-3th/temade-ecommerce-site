
import Hero from "@/app/components/Hero";
import CategorySection from "./components/CategoriesSection";
import NewArrivals from "./components/NewArrivals";
import HeroBanner from "./components/HeroBanner";
import GalleryCarousel from "./components/GalleryCarousel";

export default function Home() {
  return (
    <main>
      <Hero />
      <CategorySection />
      <GalleryCarousel />
      <NewArrivals />
      <HeroBanner />
      
    </main>
  );
}
