
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero } from '@/components/home/Hero';
import FeaturedDestinations from '@/components/home/FeaturedDestinations';
import PassionSection from '@/components/passion/PassionSection';
import Testimonials from '@/components/home/Testimonials';
import { useSearchStore } from '@/store/searchStore';

export function HomePage() {
  const navigate = useNavigate();
  const { setQuery } = useSearchStore();
  const [selectedPassions, setSelectedPassions] = useState<string[]>([]);

  const handleDestinationSelect = (destination: any) => {
    // Set the destination as the search query
    setQuery(`${destination.name}, ${destination.country}`);

    // Navigate to search results
    navigate('/search');
  };

  const handlePassionToggle = (passionId: string) => {
    setSelectedPassions(prev =>
      prev.includes(passionId)
        ? prev.filter(id => id !== passionId)
        : [...prev, passionId]
    );
  };

  const handleApplyPassions = (passions: string[]) => {
    // Create a search query based on selected passions
    let searchQuery = 'Hotels with ';

    if (passions.length > 0) {
      // Convert passion IDs to readable search terms
      const passionTerms = passions.map(id => {
        switch (id) {
          case 'culinary-excellence': return 'fine dining';
          case 'wellness-sanctuary': return 'spa and wellness';
          case 'cultural-immersion': return 'cultural attractions';
          case 'adventure-escapes': return 'adventure activities';
          case 'business-elite': return 'business facilities';
          case 'family-luxury': return 'family amenities';
          case 'romantic-elegance': return 'romantic settings';
          default: return id.replace('-', ' ');
        }
      });

      searchQuery += passionTerms.join(', ');
    } else {
      searchQuery = 'Luxury hotels';
    }

    // Set the query and navigate to search
    setQuery(searchQuery);
    navigate('/search');
  };

  return (
    <div className="space-y-0">
      <Hero />
      <PassionSection
        selectedPassions={selectedPassions}
        onPassionToggle={handlePassionToggle}
        onApplyPassions={handleApplyPassions}
      />
      <FeaturedDestinations onDestinationSelect={handleDestinationSelect} />
      <Testimonials />
    </div>
  );
}