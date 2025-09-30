// import TopBar from "@/app/components/TopBar";
// import NavBar from "@/app/components/NavBar";
import Hero from "@/app/components/Hero";
import CategorySection from "./components/CategoriesSection";
import NewArrivals from "./components/NewArrivals";
import HeroBanner from "./components/HeroBanner";

export default function Home() {
  return (
    <main>
      <Hero />
      <CategorySection />
      <NewArrivals />
      <HeroBanner />
      
    </main>
  );
}
