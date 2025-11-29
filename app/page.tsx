
import Hero from "@/app/components/Hero";
import CategorySection from "./components/CategoriesSection";
import NewArrivals from "./components/NewArrivals";
import HeroBanner from "./components/HeroBanner";
import GalleryCarousel from "./components/GalleryCarousel";

export default function Home() {
  return (
    <main className="space-y-12 sm:space-y-14 lg:space-y-16">
      <Hero />
      <CategorySection />
      <GalleryCarousel />
      <NewArrivals />
      <HeroBanner />
    </main>
  );
}
