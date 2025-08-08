// Passion Data Structure & Management
// Defines travel passions and their matching criteria

const PASSIONS = {
    'gourmet-foodie': {
        id: 'gourmet-foodie',
        name: 'Gourmet Foodie',
        icon: '🍽️',
        description: 'Savor exceptional dining experiences and culinary adventures',
        color: '#FF6B6B',
        keywords: [
            'restaurant', 'dining', 'chef', 'cuisine', 'culinary', 'gourmet', 
            'michelin', 'food', 'kitchen', 'breakfast', 'lunch', 'dinner',
            'bar', 'wine', 'cocktail', 'rooftop', 'bistro', 'cafe'
        ],
        amenityMatches: [
            'restaurant', 'bar', 'room service', 'kitchen', 'dining',
            'breakfast', 'coffee', 'wine', 'cocktail'
        ],
        locationKeywords: [
            'culinary district', 'food market', 'restaurant district',
            'gastronomic', 'food scene', 'dining'
        ]
    },
    
    'outdoor-adventure': {
        id: 'outdoor-adventure',
        name: 'Outdoor Adventure',
        icon: '🏔️',
        description: 'Embrace nature and thrilling outdoor activities',
        color: '#4ECDC4',
        keywords: [
            'hiking', 'mountain', 'nature', 'outdoor', 'adventure', 'trail',
            'forest', 'park', 'beach', 'water sports', 'skiing', 'cycling',
            'climbing', 'kayaking', 'fishing', 'safari', 'wildlife'
        ],
        amenityMatches: [
            'outdoor pool', 'fitness center', 'spa', 'bicycle rental',
            'water sports', 'hiking', 'golf', 'tennis', 'beach access'
        ],
        locationKeywords: [
            'national park', 'mountain', 'beach', 'nature reserve',
            'outdoor activities', 'adventure sports', 'hiking trails'
        ]
    },
    
    'historical-exploration': {
        id: 'historical-exploration',
        name: 'Historical Exploration',
        icon: '🏛️',
        description: 'Discover rich history and cultural heritage',
        color: '#A8E6CF',
        keywords: [
            'historic', 'heritage', 'museum', 'castle', 'monument',
            'ancient', 'cultural', 'architecture', 'landmark', 'cathedral',
            'palace', 'ruins', 'archaeological', 'traditional', 'historic center'
        ],
        amenityMatches: [
            'concierge', 'tour desk', 'cultural activities',
            'historic building', 'traditional architecture'
        ],
        locationKeywords: [
            'historic center', 'old town', 'heritage site', 'museum district',
            'cultural quarter', 'historic district', 'archaeological site'
        ]
    },
    
    'sustainable-stays': {
        id: 'sustainable-stays',
        name: 'Sustainable Stays',
        icon: '🌱',
        description: 'Support eco-friendly and sustainable travel',
        color: '#88D8B0',
        keywords: [
            'eco', 'sustainable', 'green', 'organic', 'renewable',
            'environmental', 'carbon neutral', 'solar', 'recycling',
            'local sourcing', 'eco-friendly', 'conservation'
        ],
        amenityMatches: [
            'eco-friendly', 'solar power', 'recycling', 'organic',
            'local sourcing', 'green building', 'energy efficient'
        ],
        locationKeywords: [
            'eco resort', 'sustainable tourism', 'green hotel',
            'environmental conservation', 'organic farm'
        ]
    },
    
    'arts-culture': {
        id: 'arts-culture',
        name: 'Arts & Culture Vulture',
        icon: '🎨',
        description: 'Immerse yourself in art, music, and cultural experiences',
        color: '#FFB74D',
        keywords: [
            'art', 'gallery', 'museum', 'theater', 'music', 'cultural',
            'exhibition', 'performance', 'artist', 'creative', 'design',
            'contemporary', 'sculpture', 'painting', 'concert', 'opera'
        ],
        amenityMatches: [
            'art gallery', 'cultural activities', 'entertainment',
            'live music', 'theater', 'exhibition space'
        ],
        locationKeywords: [
            'arts district', 'cultural quarter', 'gallery district',
            'theater district', 'creative hub', 'art scene'
        ]
    },
    
    'relaxation-wellness': {
        id: 'relaxation-wellness',
        name: 'Relaxation & Wellness',
        icon: '🧘',
        description: 'Rejuvenate your mind, body, and soul',
        color: '#CE93D8',
        keywords: [
            'spa', 'wellness', 'relaxation', 'massage', 'meditation',
            'yoga', 'thermal', 'sauna', 'hot springs', 'retreat',
            'peaceful', 'tranquil', 'serene', 'zen', 'mindfulness'
        ],
        amenityMatches: [
            'spa', 'wellness center', 'massage', 'sauna', 'hot tub',
            'yoga', 'meditation', 'fitness center', 'pool', 'quiet'
        ],
        locationKeywords: [
            'spa resort', 'wellness retreat', 'thermal springs',
            'peaceful location', 'quiet area', 'meditation center'
        ]
    },
    
    'stargazing-hotspots': {
        id: 'stargazing-hotspots',
        name: 'Stargazing Hotspots',
        icon: '⭐',
        description: 'Experience the wonder of dark skies and celestial beauty',
        color: '#7986CB',
        keywords: [
            'stargazing', 'astronomy', 'dark sky', 'observatory',
            'planetarium', 'celestial', 'night sky', 'telescope',
            'constellation', 'milky way', 'remote', 'rural'
        ],
        amenityMatches: [
            'observatory', 'telescope', 'dark sky', 'remote location',
            'outdoor terrace', 'rooftop', 'minimal light pollution'
        ],
        locationKeywords: [
            'dark sky reserve', 'observatory', 'remote location',
            'rural area', 'mountain top', 'desert', 'minimal light pollution'
        ]
    }
};

// Passion matching logic
class PassionMatcher {
    constructor() {
        this.passions = PASSIONS;
    }
    
    // Calculate passion score for a hotel based on user's selected passions
    calculatePassionScore(hotel, selectedPassionIds) {
        if (!selectedPassionIds || selectedPassionIds.length === 0) {
            return { totalScore: 0, matches: [] };
        }
        
        let totalScore = 0;
        const matches = [];
        
        selectedPassionIds.forEach(passionId => {
            const passion = this.passions[passionId];
            if (!passion) return;
            
            const score = this.calculateSinglePassionScore(hotel, passion);
            if (score.score > 0) {
                totalScore += score.score;
                matches.push({
                    passion: passion,
                    score: score.score,
                    reasons: score.reasons
                });
            }
        });
        
        return {
            totalScore: Math.min(totalScore, 100), // Cap at 100
            matches: matches.sort((a, b) => b.score - a.score)
        };
    }
    
    // Calculate score for a single passion against hotel data
    calculateSinglePassionScore(hotel, passion) {
        let score = 0;
        const reasons = [];
        
        // Check hotel name and description
        const hotelText = `${hotel.name} ${hotel.description || ''}`.toLowerCase();
        const matchedKeywords = passion.keywords.filter(keyword => 
            hotelText.includes(keyword.toLowerCase())
        );
        
        if (matchedKeywords.length > 0) {
            score += matchedKeywords.length * 5;
            reasons.push(`Hotel features: ${matchedKeywords.slice(0, 3).join(', ')}`);
        }
        
        // Check amenities/facilities
        const facilities = hotel.facilities || hotel.amenities || [];
        const facilitiesText = facilities.join(' ').toLowerCase();
        
        const matchedAmenities = passion.amenityMatches.filter(amenity =>
            facilitiesText.includes(amenity.toLowerCase())
        );
        
        if (matchedAmenities.length > 0) {
            score += matchedAmenities.length * 8;
            reasons.push(`Amenities: ${matchedAmenities.slice(0, 2).join(', ')}`);
        }
        
        // Check location context (if available)
        const locationText = `${hotel.address || ''} ${hotel.location || ''}`.toLowerCase();
        const matchedLocation = passion.locationKeywords.filter(keyword =>
            locationText.includes(keyword.toLowerCase())
        );
        
        if (matchedLocation.length > 0) {
            score += matchedLocation.length * 10;
            reasons.push(`Location: ${matchedLocation[0]}`);
        }
        
        // Bonus for high ratings if it matches the passion
        if (hotel.rating && hotel.rating > 8 && score > 0) {
            score += 5;
            reasons.push('Highly rated for this experience');
        }
        
        return {
            score: Math.min(score, 50), // Cap individual passion score at 50
            reasons: reasons
        };
    }
    
    // Get passion strength description
    getPassionStrength(score) {
        if (score >= 30) return 'Excellent Match';
        if (score >= 20) return 'Great Match';
        if (score >= 10) return 'Good Match';
        if (score > 0) return 'Some Match';
        return 'No Match';
    }
    
    // Get all available passions
    getAllPassions() {
        return Object.values(this.passions);
    }
    
    // Get passion by ID
    getPassion(id) {
        return this.passions[id];
    }
}

// User passion profile management
class PassionProfile {
    constructor() {
        this.selectedPassions = this.loadFromStorage();
    }
    
    // Load selected passions from localStorage
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('hotelFinder_passions');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading passions from storage:', error);
            return [];
        }
    }
    
    // Save selected passions to localStorage
    saveToStorage() {
        try {
            localStorage.setItem('hotelFinder_passions', JSON.stringify(this.selectedPassions));
        } catch (error) {
            console.error('Error saving passions to storage:', error);
        }
    }
    
    // Toggle passion selection
    togglePassion(passionId) {
        const index = this.selectedPassions.indexOf(passionId);
        if (index > -1) {
            this.selectedPassions.splice(index, 1);
        } else {
            this.selectedPassions.push(passionId);
        }
        this.saveToStorage();
        return this.selectedPassions;
    }
    
    // Check if passion is selected
    isSelected(passionId) {
        return this.selectedPassions.includes(passionId);
    }
    
    // Get all selected passions
    getSelected() {
        return this.selectedPassions;
    }
    
    // Clear all selections
    clearAll() {
        this.selectedPassions = [];
        this.saveToStorage();
        return this.selectedPassions;
    }
    
    // Get selected passion objects
    getSelectedPassions() {
        return this.selectedPassions.map(id => PASSIONS[id]).filter(Boolean);
    }
}

// Global instances
window.passionMatcher = new PassionMatcher();
window.passionProfile = new PassionProfile();
