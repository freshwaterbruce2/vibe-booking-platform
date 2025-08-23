
import { Hero } from '@/components/home/Hero';
import FeaturedDestinations from '@/components/home/FeaturedDestinations';
import PassionSection from '@/components/passion/PassionSection';
import Testimonials from '@/components/home/Testimonials';

export function HomePage() {
  return (
    <div className="space-y-0">
      <Hero />
      <PassionSection />
      <FeaturedDestinations />
      <Testimonials />
    </div>
  );
}