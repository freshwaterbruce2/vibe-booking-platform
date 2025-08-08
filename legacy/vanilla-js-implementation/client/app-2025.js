/**
 * Modern Hotel Booking Application - 2025
 * Enhanced with transparent pricing, smart filtering, and streamlined booking
 */

// Global state management
const AppState = {
  hotels: [],
  filteredHotels: [],
  currentPage: 1,
  hotelsPerPage: 12,
  currentView: 'list',
  currentSort: 'passion-match',
  filters: {
    priceRange: { min: 0, max: 1000 },
    starRating: [],
    amenities: [],
    passions: []
  },
  searchParams: {},
  loading: false
};

// Enhanced Transparent Pricing System - 2025
class PricingCalculator {
  static calculate(hotel, nights = 1, rooms = 1, includeDiscounts = true) {
    const basePrice = parseFloat(hotel.rate?.amount || 0);
    const taxRate = 0.15; // 15% tax
    const serviceFee = 25; // Flat service fee
    const resortFee = parseFloat(hotel.resort_fee || 0);
    const cleaningFee = rooms > 1 ? 15 * rooms : 0; // Per room cleaning fee
    
    // Dynamic pricing based on demand
    const demandMultiplier = this.calculateDemandMultiplier(hotel, nights);
    const adjustedBasePrice = basePrice * demandMultiplier;
    
    const subtotal = adjustedBasePrice * nights * rooms;
    const taxes = subtotal * taxRate;
    const totalFees = serviceFee + resortFee + cleaningFee;
    
    // Apply discounts if applicable
    let discount = 0;
    if (includeDiscounts) {
      discount = this.calculateDiscounts(subtotal, nights, rooms);
    }
    
    const total = subtotal + taxes + totalFees - discount;
    
    return {
      basePrice: basePrice,
      adjustedBasePrice: adjustedBasePrice,
      subtotal: subtotal,
      taxes: taxes,
      serviceFee: serviceFee,
      resortFee: resortFee,
      cleaningFee: cleaningFee,
      totalFees: totalFees,
      discount: discount,
      total: Math.max(0, total),
      currency: hotel.rate?.currency || 'USD',
      demandLevel: this.getDemandLevel(demandMultiplier),
      avgPricePerNight: total / nights,
      savingsMessage: discount > 0 ? `You save ${this.formatPrice(discount)}!` : null,
      breakdown: {
        'Base Room Rate': `${this.formatPrice(basePrice)} × ${nights} night${nights > 1 ? 's' : ''} × ${rooms} room${rooms > 1 ? 's' : ''}`,
        'Demand Adjustment': demandMultiplier !== 1 ? `${((demandMultiplier - 1) * 100).toFixed(0)}% ${demandMultiplier > 1 ? 'increase' : 'decrease'}` : null,
        'Subtotal': this.formatPrice(subtotal),
        'Taxes (15%)': this.formatPrice(taxes),
        'Service Fee': this.formatPrice(serviceFee),
        'Resort Fee': resortFee > 0 ? this.formatPrice(resortFee) : null,
        'Cleaning Fee': cleaningFee > 0 ? this.formatPrice(cleaningFee) : null,
        'Discount': discount > 0 ? `-${this.formatPrice(discount)}` : null
      }
    };
  }
  
  static calculateDemandMultiplier(hotel, nights) {
    // Simulate demand-based pricing
    const rating = parseFloat(hotel.hotel_data?.rating || 3);
    const baseMultiplier = 1;
    
    // High-rated hotels have higher demand
    const ratingMultiplier = rating > 4.5 ? 1.15 : rating > 4 ? 1.05 : 1;
    
    // Weekend and long stays affect pricing
    const lengthMultiplier = nights >= 7 ? 0.95 : nights >= 3 ? 1 : 1.1;
    
    return Math.max(0.8, Math.min(1.3, baseMultiplier * ratingMultiplier * lengthMultiplier));
  }
  
  static calculateDiscounts(subtotal, nights, rooms) {
    let discount = 0;
    
    // Early bird discount (simulated)
    if (Math.random() > 0.7) {
      discount += subtotal * 0.1; // 10% early bird
    }
    
    // Extended stay discount
    if (nights >= 7) {
      discount += subtotal * 0.15; // 15% weekly stay
    } else if (nights >= 3) {
      discount += subtotal * 0.05; // 5% multi-night
    }
    
    return discount;
  }
  
  static getDemandLevel(multiplier) {
    if (multiplier >= 1.2) return { level: 'High', color: 'error' };
    if (multiplier >= 1.05) return { level: 'Medium', color: 'warning' };
    return { level: 'Low', color: 'success' };
  }
  
  static formatPrice(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }
  
  static createInteractivePriceBreakdown(pricing, hotelId) {
    const breakdown = Object.entries(pricing.breakdown)
      .filter(([key, value]) => value !== null)
      .map(([key, value]) => {
        const isTotal = key === 'Total';
        const isDiscount = key === 'Discount';
        const isPositive = key === 'Demand Adjustment' && !value.includes('decrease');
        
        return `
          <div class="price-line ${isTotal ? 'total' : ''} ${isDiscount ? 'discount' : ''} ${isPositive ? 'demand-increase' : ''}">
            <span class="price-label">
              ${key}
              ${key === 'Taxes (15%)' ? '<i class="fas fa-info-circle tooltip-trigger" title="Government taxes and local fees"></i>' : ''}
              ${key === 'Service Fee' ? '<i class="fas fa-info-circle tooltip-trigger" title="Platform booking and processing fee"></i>' : ''}
            </span>
            <span class="price-value">${value}</span>
          </div>
        `;
      }).join('');
    
    const demandIndicator = pricing.demandLevel ? `
      <div class="demand-indicator ${pricing.demandLevel.color}">
        <i class="fas fa-chart-line"></i>
        <span>Demand: ${pricing.demandLevel.level}</span>
      </div>
    ` : '';
    
    const savingsAlert = pricing.savingsMessage ? `
      <div class="savings-alert">
        <i class="fas fa-tag"></i>
        <span>${pricing.savingsMessage}</span>
      </div>
    ` : '';
    
    return `
      <div class="interactive-price-breakdown" data-hotel-id="${hotelId}">
        <div class="breakdown-header">
          <h4>Complete Price Breakdown</h4>
          <span class="avg-per-night">Avg: ${this.formatPrice(pricing.avgPricePerNight)}/night</span>
        </div>
        
        ${savingsAlert}
        ${demandIndicator}
        
        <div class="breakdown-details">
          ${breakdown}
          <div class="price-line total">
            <span class="price-label">Total Amount</span>
            <span class="price-value">${this.formatPrice(pricing.total)}</span>
          </div>
        </div>
        
        <div class="breakdown-footer">
          <div class="price-guarantee">
            <i class="fas fa-shield-alt"></i>
            <span>No hidden fees • Guaranteed price</span>
          </div>
          <button class="btn-compare" onclick="addToComparison('${hotelId}')">
            <i class="fas fa-balance-scale"></i> Compare
          </button>
        </div>
      </div>
    `;
  }
  
  static createPriceBreakdown(pricing) {
    // Legacy method for backwards compatibility
    return this.createInteractivePriceBreakdown(pricing, 'unknown');
  }
  
  // Real-time price update functionality
  static watchPriceChanges(hotelId, callback) {
    const interval = setInterval(() => {
      // Simulate price fluctuations (in real app, this would be WebSocket or polling)
      const fluctuation = (Math.random() - 0.5) * 0.02; // ±1% change
      callback(fluctuation);
    }, 30000); // Check every 30 seconds
    
    return interval;
  }
  
  static stopWatchingPrices(intervalId) {
    clearInterval(intervalId);
  }
}

// Smart Filtering System
class SmartFilter {
  static applyFilters(hotels, filters, searchParams = {}) {
    let filtered = [...hotels];
    
    // Price range filter
    if (filters.priceRange) {
      filtered = filtered.filter(hotel => {
        const price = parseFloat(hotel.rate?.amount || 0);
        return price >= filters.priceRange.min && price <= filters.priceRange.max;
      });
    }
    
    // Star rating filter
    if (filters.starRating.length > 0) {
      filtered = filtered.filter(hotel => {
        const stars = parseInt(hotel.hotel_data?.star_rating || 0);
        return filters.starRating.includes(stars);
      });
    }
    
    // Amenities filter
    if (filters.amenities.length > 0) {
      filtered = filtered.filter(hotel => {
        const amenities = hotel.hotel_data?.amenities || [];
        return filters.amenities.every(amenity => {
          return amenities.some(hotelAmenity => 
            hotelAmenity.toLowerCase().includes(amenity.toLowerCase())
          );
        });
      });
    }
    
    // Passion-based filter (if available)
    if (filters.passions.length > 0 && typeof PassionMatcher !== 'undefined') {
      const matcher = new PassionMatcher();
      filtered = filtered.filter(hotel => {
        return filters.passions.some(passion => {
          const score = matcher.calculateScore(hotel, passion);
          return score > 0.3; // 30% minimum match threshold
        });
      });
    }
    
    return filtered;
  }
  
  static sortHotels(hotels, sortBy, searchParams = {}) {
    const sorted = [...hotels];
    
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => 
          (parseFloat(a.rate?.amount || 0)) - (parseFloat(b.rate?.amount || 0))
        );
        
      case 'price-high':
        return sorted.sort((a, b) => 
          (parseFloat(b.rate?.amount || 0)) - (parseFloat(a.rate?.amount || 0))
        );
        
      case 'rating-high':
        return sorted.sort((a, b) => 
          (parseFloat(b.hotel_data?.rating || 0)) - (parseFloat(a.hotel_data?.rating || 0))
        );
        
      case 'stars-high':
        return sorted.sort((a, b) => 
          (parseInt(b.hotel_data?.star_rating || 0)) - (parseInt(a.hotel_data?.star_rating || 0))
        );
        
      case 'passion-match':
        if (typeof PassionMatcher !== 'undefined' && searchParams.purpose) {
          const matcher = new PassionMatcher();
          return sorted.sort((a, b) => {
            const scoreA = matcher.calculateScore(a, searchParams.purpose);
            const scoreB = matcher.calculateScore(b, searchParams.purpose);
            return scoreB - scoreA;
          });
        }
        return sorted;
        
      default:
        return sorted;
    }
  }
}

// Modern Hotel Card Renderer
class HotelCardRenderer {
  static render(hotel, searchParams = {}) {
    const nights = this.calculateNights(searchParams.checkin, searchParams.checkout);
    const rooms = searchParams.rooms || 1;
    const pricing = PricingCalculator.calculate(hotel, nights, rooms);
    
    const passionScore = this.getPassionScore(hotel, searchParams.purpose);
    const trustScore = this.calculateTrustScore(hotel);
    
    return `
      <article class="hotel-card" data-hotel-id="${hotel.hotel_data?.hotel_id}" role="article">
        ${this.renderImageSection(hotel)}
        ${this.renderInfoSection(hotel, pricing, passionScore, trustScore, searchParams)}
      </article>
    `;
  }
  
  static renderImageSection(hotel) {
    const images = hotel.hotel_data?.images || [];
    const primaryImage = images[0] || 'https://via.placeholder.com/400x240?text=Hotel+Image';
    const altText = `${hotel.hotel_data?.name || 'Hotel'} exterior view`;
    const hotelId = hotel.hotel_data?.hotel_id || 'unknown';
    
    // Progressive image loading with WebP support
    const webpImage = this.convertToWebP(primaryImage);
    const galleryCount = images.length;
    
    return `
      <div class="hotel-image-container" data-hotel-id="${hotelId}">
        <div class="hotel-image">
          <picture>
            <source srcset="${webpImage}" type="image/webp">
            <img 
              src="${primaryImage}" 
              alt="${altText}"
              class="hotel-primary-image"
              loading="lazy"
              data-src="${primaryImage}"
              onerror="this.src='https://via.placeholder.com/400x240?text=Hotel+Image'"
            />
          </picture>
          
          <!-- Image Loading Skeleton -->
          <div class="image-skeleton" aria-hidden="true"></div>
          
          ${this.renderBadges(hotel)}
          ${this.renderImageOverlay(hotel)}
          
          <!-- Gallery Navigation -->
          ${galleryCount > 1 ? `
            <div class="image-gallery-controls">
              <button 
                class="gallery-btn gallery-prev" 
                onclick="navigateGallery('${hotelId}', -1)"
                aria-label="Previous image"
              >
                <i class="fas fa-chevron-left"></i>
              </button>
              <button 
                class="gallery-btn gallery-next" 
                onclick="navigateGallery('${hotelId}', 1)"
                aria-label="Next image"
              >
                <i class="fas fa-chevron-right"></i>
              </button>
              
              <div class="gallery-indicators">
                ${images.slice(0, 5).map((_, index) => 
                  `<span class="gallery-dot ${index === 0 ? 'active' : ''}" onclick="showGalleryImage('${hotelId}', ${index})"></span>`
                ).join('')}
                ${galleryCount > 5 ? `<span class="gallery-more">+${galleryCount - 5}</span>` : ''}
              </div>
            </div>
          ` : ''}
          
          <!-- Full Gallery Button -->
          ${galleryCount > 1 ? `
            <button 
              class="view-gallery-btn" 
              onclick="openImmersiveGallery('${hotelId}')"
              aria-label="View all ${galleryCount} photos"
            >
              <i class="fas fa-images"></i>
              <span>${galleryCount} Photos</span>
            </button>
          ` : ''}
        </div>
        
        <!-- Immersive Gallery Modal -->
        <div class="immersive-gallery" id="gallery-${hotelId}" style="display: none;">
          <div class="gallery-backdrop" onclick="closeImmersiveGallery('${hotelId}')"></div>
          <div class="gallery-content">
            <div class="gallery-header">
              <h3>${hotel.hotel_data?.name || 'Hotel Gallery'}</h3>
              <button class="gallery-close" onclick="closeImmersiveGallery('${hotelId}')" aria-label="Close gallery">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="gallery-viewer">
              <div class="gallery-main-image">
                <img id="gallery-main-${hotelId}" src="${primaryImage}" alt="${altText}" />
              </div>
              
              <div class="gallery-navigation">
                <button class="gallery-nav-btn prev" onclick="navigateImmersiveGallery('${hotelId}', -1)">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button class="gallery-nav-btn next" onclick="navigateImmersiveGallery('${hotelId}', 1)">
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
              
              <div class="gallery-info">
                <span class="gallery-counter">1 / ${galleryCount}</span>
                <div class="gallery-actions">
                  <button class="gallery-action-btn" onclick="shareImage('${hotelId}')" title="Share image">
                    <i class="fas fa-share-alt"></i>
                  </button>
                  <button class="gallery-action-btn" onclick="favoriteImage('${hotelId}')" title="Favorite image">
                    <i class="fas fa-heart"></i>
                  </button>
                </div>
              </div>
            </div>
            
            <div class="gallery-thumbnails">
              ${images.map((image, index) => `
                <div class="gallery-thumbnail ${index === 0 ? 'active' : ''}" onclick="showImmersiveImage('${hotelId}', ${index})">
                  <img src="${image}" alt="${hotel.hotel_data?.name} - Image ${index + 1}" loading="lazy" />
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  static renderBadges(hotel) {
    const badges = [];
    
    // Featured badge
    if (hotel.featured) {
      badges.push('<span class="hotel-badge featured">Featured</span>');
    }
    
    // Deal badge
    if (hotel.deal || (hotel.rate?.amount && hotel.rate.amount < 150)) {
      badges.push('<span class="hotel-badge deal">Great Deal</span>');
    }
    
    // Eco-friendly badge
    if (hotel.hotel_data?.amenities?.some(a => a.toLowerCase().includes('eco'))) {
      badges.push('<span class="hotel-badge eco">Eco-Friendly</span>');
    }
    
    return badges.join('');
  }
  
  static renderImageOverlay(hotel) {
    const rating = hotel.hotel_data?.rating || 0;
    const reviewCount = hotel.hotel_data?.review_count || 0;
    
    if (rating > 0) {
      return `
        <div class="hotel-rating-overlay">
          <div class="rating-score">${rating.toFixed(1)}</div>
          <div class="rating-reviews">${reviewCount} reviews</div>
        </div>
      `;
    }
    
    return '';
  }
  
  static renderInfoSection(hotel, pricing, passionScore, trustScore, searchParams) {
    return `
      <div class="hotel-info">
        ${this.renderHeader(hotel)}
        ${this.renderLocation(hotel)}
        ${this.renderAmenities(hotel)}
        ${this.renderPassionMatch(passionScore, searchParams.purpose)}
        ${this.renderTrustSignals(trustScore)}
        ${this.renderPricing(pricing, hotel)}
      </div>
    `;
  }
  
  static renderHeader(hotel) {
    const name = hotel.hotel_data?.name || 'Hotel Name';
    const stars = parseInt(hotel.hotel_data?.star_rating || 0);
    
    return `
      <div class="hotel-header">
        <h3 class="hotel-name">${name}</h3>
        <div class="hotel-stars">
          ${Array.from({length: 5}, (_, i) => 
            `<i class="fas fa-star ${i < stars ? 'active' : ''}"></i>`
          ).join('')}
        </div>
      </div>
    `;
  }
  
  static renderLocation(hotel) {
    const address = hotel.hotel_data?.address || 'Location not specified';
    const distance = hotel.distance ? `${hotel.distance.toFixed(1)} km from city center` : '';
    
    return `
      <div class="hotel-location">
        <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
        <span>${address}</span>
        ${distance ? `<span class="distance">${distance}</span>` : ''}
      </div>
    `;
  }
  
  static renderAmenities(hotel) {
    const amenities = hotel.hotel_data?.amenities || [];
    const topAmenities = amenities.slice(0, 4);
    
    if (topAmenities.length === 0) return '';
    
    return `
      <div class="hotel-amenities">
        ${topAmenities.map(amenity => 
          `<span class="amenity-tag">${this.formatAmenity(amenity)}</span>`
        ).join('')}
        ${amenities.length > 4 ? 
          `<span class="amenity-more">+${amenities.length - 4} more</span>` : ''
        }
      </div>
    `;
  }
  
  static renderPassionMatch(score, purpose) {
    if (!score || score < 0.3 || !purpose) return '';
    
    const percentage = Math.round(score * 100);
    const matchLevel = percentage > 80 ? 'excellent' : percentage > 60 ? 'good' : 'fair';
    
    return `
      <div class="passion-match ${matchLevel}">
        <i class="fas fa-heart" aria-hidden="true"></i>
        <span>${percentage}% match for ${purpose}</span>
      </div>
    `;
  }
  
  static renderTrustSignals(trustScore) {
    const signals = [];
    
    if (trustScore.verified) {
      signals.push('<span class="trust-signal verified"><i class="fas fa-check-circle"></i> Verified</span>');
    }
    
    if (trustScore.cancellation) {
      signals.push('<span class="trust-signal cancellation"><i class="fas fa-calendar-times"></i> Free Cancellation</span>');
    }
    
    if (trustScore.instantBook) {
      signals.push('<span class="trust-signal instant"><i class="fas fa-bolt"></i> Instant Book</span>');
    }
    
    return signals.length > 0 ? `<div class="trust-signals">${signals.join('')}</div>` : '';
  }
  
  static renderPricing(pricing, hotel) {
    const savingsLabel = pricing.discount > 0 ? 'discount-active' : '';
    const demandLabel = pricing.demandLevel?.level === 'High' ? 'high-demand' : '';
    
    return `
      <div class="hotel-pricing ${savingsLabel} ${demandLabel}" data-hotel-id="${hotel.hotel_data?.hotel_id}">
        <div class="price-breakdown">
          ${pricing.savingsMessage ? `
            <div class="savings-badge">
              <i class="fas fa-tag"></i>
              <span>${pricing.savingsMessage}</span>
            </div>
          ` : ''}
          
          <div class="price-main" title="Total price for your stay">
            <span class="price-amount">${PricingCalculator.formatPrice(pricing.total)}</span>
            ${pricing.discount > 0 ? `
              <span class="original-price">${PricingCalculator.formatPrice(pricing.total + pricing.discount)}</span>
            ` : ''}
          </div>
          
          <div class="price-details-row">
            <div class="price-per-night">
              ${PricingCalculator.formatPrice(pricing.avgPricePerNight)} avg per night
            </div>
            ${pricing.demandLevel ? `
              <div class="demand-indicator ${pricing.demandLevel.color}">
                <i class="fas fa-chart-line"></i>
                <span>${pricing.demandLevel.level} demand</span>
              </div>
            ` : ''}
          </div>
          
          <div class="price-guarantee">
            <i class="fas fa-shield-alt"></i>
            <span>All taxes & fees included</span>
          </div>
          
          <div class="price-actions">
            <button 
              class="price-details-btn" 
              onclick="showEnhancedPriceBreakdown('${hotel.hotel_data?.hotel_id}')"
              aria-label="Show detailed price breakdown"
            >
              <i class="fas fa-receipt"></i> Price Details
            </button>
            <button 
              class="price-track-btn" 
              onclick="togglePriceTracking('${hotel.hotel_data?.hotel_id}')"
              aria-label="Track price changes"
              title="Get notified of price changes"
            >
              <i class="fas fa-bell"></i>
            </button>
          </div>
        </div>
        
        <div class="booking-actions">
          <button 
            class="book-btn primary" 
            onclick="startBookingFlow('${hotel.hotel_data?.hotel_id}')"
            aria-label="Book ${hotel.hotel_data?.name}"
          >
            <i class="fas fa-calendar-check"></i>
            <span>Book Now</span>
          </button>
          <button 
            class="compare-btn secondary" 
            onclick="addToComparison('${hotel.hotel_data?.hotel_id}')"
            aria-label="Add to comparison"
            title="Compare with other hotels"
          >
            <i class="fas fa-balance-scale"></i>
          </button>
        </div>
      </div>
    `;
  }
  
  // Helper methods
  static calculateNights(checkin, checkout) {
    if (!checkin || !checkout) return 1;
    const start = new Date(checkin);
    const end = new Date(checkout);
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  }
  
  static getPassionScore(hotel, purpose) {
    if (!purpose || typeof PassionMatcher === 'undefined') return 0;
    const matcher = new PassionMatcher();
    return matcher.calculateScore(hotel, purpose);
  }
  
  static calculateTrustScore(hotel) {
    return {
      verified: hotel.verified || Math.random() > 0.3,
      cancellation: hotel.free_cancellation || Math.random() > 0.4,
      instantBook: hotel.instant_book || Math.random() > 0.6
    };
  }
  
  static formatAmenity(amenity) {
    const amenityMap = {
      'wifi': 'Wi-Fi',
      'pool': 'Pool',
      'gym': 'Gym',
      'spa': 'Spa',
      'restaurant': 'Restaurant',
      'parking': 'Parking',
      'breakfast': 'Breakfast'
    };
    
    const key = amenity.toLowerCase();
    return amenityMap[key] || amenity;
  }
  
  static convertToWebP(imageUrl) {
    // Basic WebP conversion for demo - in production, use a proper image service
    if (imageUrl && !imageUrl.includes('placeholder') && !imageUrl.includes('.webp')) {
      return imageUrl.replace(/\\.(jpg|jpeg|png)$/i, '.webp');
    }
    return imageUrl;
  }
}

// Streamlined Booking Flow
class BookingFlow {
  static start(hotelId) {
    const hotel = AppState.hotels.find(h => h.hotel_data?.hotel_id === hotelId);
    if (!hotel) return;
    
    // Show booking modal with progress indicator
    this.showBookingModal(hotel);
  }
  
  static showBookingModal(hotel) {
    const modal = document.createElement('div');
    modal.className = 'booking-modal';
    modal.innerHTML = this.renderBookingModal(hotel);
    document.body.appendChild(modal);
    
    // Add event listeners
    this.setupBookingListeners(modal, hotel);
    
    // Show with animation
    requestAnimationFrame(() => {
      modal.classList.add('active');
    });
  }
  
  static renderBookingModal(hotel) {
    const pricing = PricingCalculator.calculate(hotel, 
      this.calculateNights(AppState.searchParams.checkin, AppState.searchParams.checkout),
      AppState.searchParams.rooms || 1
    );
    
    return `
      <div class="booking-modal-backdrop" onclick="closeBookingModal()"></div>
      <div class="booking-modal-content">
        <div class="booking-header">
          <h2>Complete Your Booking</h2>
          <button class="close-btn" onclick="closeBookingModal()" aria-label="Close booking form">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="booking-progress">
          <div class="progress-step active">1. Review</div>
          <div class="progress-step">2. Guest Info</div>
          <div class="progress-step">3. Payment</div>
          <div class="progress-step">4. Confirmation</div>
        </div>
        
        <div class="booking-content">
          ${this.renderBookingReview(hotel, pricing)}
        </div>
      </div>
    `;
  }
  
  static renderBookingReview(hotel, pricing) {
    return `
      <div class="booking-review">
        <div class="hotel-summary">
          <img src="${hotel.hotel_data?.images?.[0] || 'placeholder.jpg'}" alt="${hotel.hotel_data?.name}" />
          <div class="hotel-details">
            <h3>${hotel.hotel_data?.name}</h3>
            <p>${hotel.hotel_data?.address}</p>
            <div class="booking-dates">
              <i class="fas fa-calendar"></i>
              ${AppState.searchParams.checkin} - ${AppState.searchParams.checkout}
            </div>
          </div>
        </div>
        
        <div class="price-summary">
          <h4>Price Summary</h4>
          ${PricingCalculator.createPriceBreakdown(pricing)}
        </div>
        
        <div class="booking-actions">
          <button class="btn-secondary" onclick="closeBookingModal()">Cancel</button>
          <button class="btn-primary" onclick="proceedToGuestInfo()">Continue</button>
        </div>
      </div>
    `;
  }
  
  static setupBookingListeners(modal, hotel) {
    // Add event listeners for booking flow
    window.closeBookingModal = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    };
    
    window.proceedToGuestInfo = () => {
      // Next step in booking flow
      console.log('Proceeding to guest info...');
    };
  }
  
  static calculateNights(checkin, checkout) {
    if (!checkin || !checkout) return 1;
    const start = new Date(checkin);
    const end = new Date(checkout);
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  }
}

// Advanced Visual Experience Manager - 2025
class VisualExperienceManager {
  static init() {
    this.setupProgressiveImageLoading();
    this.setupImmersiveGalleries();
    this.setupImageOptimization();
    this.setupSmoothAnimations();
  }
  
  static setupProgressiveImageLoading() {
    // Enhanced Intersection Observer for images
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadProgressiveImage(entry.target);
            imageObserver.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });
      
      // Observe all lazy images
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
      
      // Re-observe new images when content is added
      this.setupImageObserver = imageObserver;
    }
  }
  
  static loadProgressiveImage(img) {
    const skeleton = img.parentNode.querySelector('.image-skeleton');
    
    if (skeleton) {
      skeleton.classList.add('loading');
    }
    
    // Load image with fade-in effect
    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = tempImg.src;
      img.classList.add('loaded');
      
      if (skeleton) {
        skeleton.classList.remove('loading');
        setTimeout(() => {
          skeleton.style.display = 'none';
        }, 300);
      }
    };
    
    tempImg.onerror = () => {
      img.src = 'https://via.placeholder.com/400x240?text=Image+Not+Available';
      img.classList.add('error');
      
      if (skeleton) {
        skeleton.classList.remove('loading');
        skeleton.style.display = 'none';
      }
    };
    
    tempImg.src = img.dataset.src || img.src;
  }
  
  static setupImmersiveGalleries() {
    // Global gallery functions
    window.openImmersiveGallery = (hotelId) => {
      const gallery = document.getElementById(`gallery-${hotelId}`);
      if (gallery) {
        gallery.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Preload additional images
        this.preloadGalleryImages(hotelId);
        
        // Setup keyboard navigation
        document.addEventListener('keydown', this.handleGalleryKeyboard);
        
        requestAnimationFrame(() => {
          gallery.classList.add('active');
        });
      }
    };
    
    window.closeImmersiveGallery = (hotelId) => {
      const gallery = document.getElementById(`gallery-${hotelId}`);
      if (gallery) {
        gallery.classList.remove('active');
        document.removeEventListener('keydown', this.handleGalleryKeyboard);
        
        setTimeout(() => {
          gallery.style.display = 'none';
          document.body.style.overflow = '';
        }, 300);
      }
    };
    
    window.navigateGallery = (hotelId, direction) => {
      this.navigateHotelGallery(hotelId, direction, false);
    };
    
    window.navigateImmersiveGallery = (hotelId, direction) => {
      this.navigateHotelGallery(hotelId, direction, true);
    };
    
    window.showGalleryImage = (hotelId, index) => {
      this.showHotelImage(hotelId, index, false);
    };
    
    window.showImmersiveImage = (hotelId, index) => {
      this.showHotelImage(hotelId, index, true);
    };
    
    window.shareImage = (hotelId) => {
      if (navigator.share) {
        const currentImage = document.getElementById(`gallery-main-${hotelId}`);
        navigator.share({
          title: 'Hotel Image',
          url: currentImage.src
        });
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(currentImage.src);
        HotelBookingApp.showToast('Image URL copied to clipboard', 'success');
      }
    };
    
    window.favoriteImage = (hotelId) => {
      const favorites = JSON.parse(localStorage.getItem('favorite_images') || '[]');
      const currentImage = document.getElementById(`gallery-main-${hotelId}`);
      
      if (!favorites.includes(currentImage.src)) {
        favorites.push(currentImage.src);
        localStorage.setItem('favorite_images', JSON.stringify(favorites));
        HotelBookingApp.showToast('Image added to favorites', 'success');
      } else {
        HotelBookingApp.showToast('Image already in favorites', 'info');
      }
    };
  }
  
  static navigateHotelGallery(hotelId, direction, isImmersive) {
    const hotel = AppState.hotels.find(h => h.hotel_data?.hotel_id === hotelId);
    if (!hotel) return;
    
    const images = hotel.hotel_data?.images || [];
    if (images.length <= 1) return;
    
    const currentIndex = this.getCurrentImageIndex(hotelId, isImmersive);
    let newIndex = currentIndex + direction;
    
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;
    
    this.showHotelImage(hotelId, newIndex, isImmersive);
  }
  
  static showHotelImage(hotelId, index, isImmersive) {
    const hotel = AppState.hotels.find(h => h.hotel_data?.hotel_id === hotelId);
    if (!hotel) return;
    
    const images = hotel.hotel_data?.images || [];
    if (index >= images.length) return;
    
    if (isImmersive) {
      // Update immersive gallery
      const mainImg = document.getElementById(`gallery-main-${hotelId}`);
      const counter = document.querySelector(`#gallery-${hotelId} .gallery-counter`);
      const thumbnails = document.querySelectorAll(`#gallery-${hotelId} .gallery-thumbnail`);
      
      if (mainImg) {
        mainImg.src = images[index];
        mainImg.alt = `${hotel.hotel_data?.name} - Image ${index + 1}`;
      }
      
      if (counter) {
        counter.textContent = `${index + 1} / ${images.length}`;
      }
      
      thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
      });
    } else {
      // Update card gallery
      const cardContainer = document.querySelector(`[data-hotel-id="${hotelId}"]`);
      const primaryImg = cardContainer?.querySelector('.hotel-primary-image');
      const indicators = cardContainer?.querySelectorAll('.gallery-dot');
      
      if (primaryImg) {
        primaryImg.src = images[index];
        primaryImg.alt = `${hotel.hotel_data?.name} - Image ${index + 1}`;
      }
      
      indicators?.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });
    }
    
    // Store current index
    this.setCurrentImageIndex(hotelId, index, isImmersive);
  }
  
  static getCurrentImageIndex(hotelId, isImmersive) {
    const key = `gallery_index_${hotelId}_${isImmersive ? 'immersive' : 'card'}`;
    return parseInt(sessionStorage.getItem(key) || '0');
  }
  
  static setCurrentImageIndex(hotelId, index, isImmersive) {
    const key = `gallery_index_${hotelId}_${isImmersive ? 'immersive' : 'card'}`;
    sessionStorage.setItem(key, index.toString());
  }
  
  static preloadGalleryImages(hotelId) {
    const hotel = AppState.hotels.find(h => h.hotel_data?.hotel_id === hotelId);
    if (!hotel) return;
    
    const images = hotel.hotel_data?.images || [];
    images.slice(1, 6).forEach(imageSrc => {
      const img = new Image();
      img.src = imageSrc;
    });
  }
  
  static handleGalleryKeyboard = (e) => {
    const activeGallery = document.querySelector('.immersive-gallery.active');
    if (!activeGallery) return;
    
    const hotelId = activeGallery.id.replace('gallery-', '');
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        window.navigateImmersiveGallery(hotelId, -1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        window.navigateImmersiveGallery(hotelId, 1);
        break;
      case 'Escape':
        e.preventDefault();
        window.closeImmersiveGallery(hotelId);
        break;
    }
  };
  
  static setupImageOptimization() {
    // WebP detection and conversion
    this.supportsWebP = this.detectWebPSupport();
    
    // AVIF detection (for future-proofing)
    this.supportsAVIF = this.detectAVIFSupport();
    
    // Setup responsive images based on screen size
    this.setupResponsiveImages();
  }
  
  static detectWebPSupport() {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }
  
  static detectAVIFSupport() {
    return new Promise((resolve) => {
      const avif = new Image();
      avif.onload = avif.onerror = () => {
        resolve(avif.height === 2);
      };
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
  }
  
  static setupResponsiveImages() {
    // Setup responsive image loading based on device pixel ratio and screen size
    const pixelRatio = window.devicePixelRatio || 1;
    const screenWidth = window.innerWidth;
    
    this.imageQuality = this.determineImageQuality(pixelRatio, screenWidth);
  }
  
  static determineImageQuality(pixelRatio, screenWidth) {
    if (pixelRatio >= 2 && screenWidth >= 1200) {
      return 'high'; // High-DPI large screens
    } else if (screenWidth >= 768) {
      return 'medium'; // Desktop/tablet
    } else {
      return 'low'; // Mobile
    }
  }
  
  static setupSmoothAnimations() {
    // Setup intersection observer for scroll-triggered animations
    if ('IntersectionObserver' in window) {
      const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });
      
      // Observe elements that should animate on scroll
      document.querySelectorAll('.hotel-card, .filter-group, .results-header').forEach(el => {
        animationObserver.observe(el);
      });
      
      this.animationObserver = animationObserver;
    }
  }
  
  static convertToWebP(imageUrl) {
    // In a real application, this would convert image URLs to WebP format
    // For demo purposes, we'll assume WebP versions exist with .webp extension
    if (this.supportsWebP && imageUrl && !imageUrl.includes('placeholder')) {
      return imageUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    return imageUrl;
  }
  
  static observeNewImages() {
    // Re-observe new images when content is dynamically added
    if (this.setupImageObserver) {
      document.querySelectorAll('img[data-src]:not([data-observed])')?.forEach(img => {
        img.setAttribute('data-observed', 'true');
        this.setupImageObserver.observe(img);
      });
    }
    
    if (this.animationObserver) {
      document.querySelectorAll('.hotel-card:not([data-animated])')?.forEach(card => {
        card.setAttribute('data-animated', 'true');
        this.animationObserver.observe(card);
      });
    }
  }
}

// Mobile-First Performance Optimization Manager - 2025
class MobileOptimizationManager {
  static init() {
    this.setupTouchInteractions();
    this.setupSwipeGestures();
    this.setupPullToRefresh();
    this.setupTouchOptimizations();
    this.setupMobileKeyboard();
  }
  
  static setupTouchInteractions() {
    // Enhanced touch events for better mobile experience
    let touchStartTime = 0;
    let touchStartPos = { x: 0, y: 0 };
    
    document.addEventListener('touchstart', (e) => {
      touchStartTime = Date.now();
      touchStartPos = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      
      // Add visual feedback for touch
      this.addTouchFeedback(e.target);
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;
      
      // Remove visual feedback
      this.removeTouchFeedback(e.target);
      
      // Handle quick taps vs long presses
      if (touchDuration < 200) {
        // Quick tap - enhance click responsiveness
        this.handleQuickTap(e);
      } else if (touchDuration > 500) {
        // Long press - show context menu or additional options
        this.handleLongPress(e);
      }
    }, { passive: true });
    
    // Optimize touch targets
    this.optimizeTouchTargets();
  }
  
  static addTouchFeedback(element) {
    const touchableElement = element.closest('.hotel-card, .btn, button, .form-input, .filter-pill');
    if (touchableElement) {
      touchableElement.classList.add('touch-active');
    }
  }
  
  static removeTouchFeedback(element) {
    const touchableElement = element.closest('.hotel-card, .btn, button, .form-input, .filter-pill');
    if (touchableElement) {
      setTimeout(() => {
        touchableElement.classList.remove('touch-active');
      }, 150);
    }
  }
  
  static handleQuickTap(e) {
    // Enhance quick tap responsiveness
    const target = e.target.closest('button, .clickable, .hotel-card');
    if (target && !target.disabled) {
      target.classList.add('quick-tap');
      setTimeout(() => target.classList.remove('quick-tap'), 200);
    }
  }
  
  static handleLongPress(e) {
    const hotelCard = e.target.closest('.hotel-card');
    if (hotelCard) {
      const hotelId = hotelCard.dataset.hotelId;
      if (hotelId) {
        // Show quick actions menu
        this.showQuickActionsMenu(hotelId, e.changedTouches[0]);
      }
    }
  }
  
  static showQuickActionsMenu(hotelId, touch) {
    const menu = document.createElement('div');
    menu.className = 'quick-actions-menu';
    menu.innerHTML = `
      <div class="quick-action" onclick="window.startBookingFlow('${hotelId}'); this.parentNode.remove()">
        <i class="fas fa-calendar-check"></i>
        <span>Book Now</span>
      </div>
      <div class="quick-action" onclick="window.showEnhancedPriceBreakdown('${hotelId}'); this.parentNode.remove()">
        <i class="fas fa-receipt"></i>
        <span>View Pricing</span>
      </div>
      <div class="quick-action" onclick="window.addToComparison('${hotelId}'); this.parentNode.remove()">
        <i class="fas fa-balance-scale"></i>
        <span>Compare</span>
      </div>
      <div class="quick-action" onclick="this.parentNode.remove()">
        <i class="fas fa-times"></i>
        <span>Cancel</span>
      </div>
    `;
    
    menu.style.position = 'fixed';
    menu.style.left = `${touch.clientX - 75}px`;
    menu.style.top = `${touch.clientY - 100}px`;
    menu.style.zIndex = '1000';
    
    document.body.appendChild(menu);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (menu.parentNode) menu.remove();
    }, 5000);
    
    // Remove on touch outside
    setTimeout(() => {
      const handler = (e) => {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('touchstart', handler);
        }
      };
      document.addEventListener('touchstart', handler);
    }, 100);
  }
  
  static setupSwipeGestures() {
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    
    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
      // Prevent default scroll behavior for swipe-enabled elements
      const swipeElement = e.target.closest('.hotel-card, .gallery-thumbnails, .filters-sidebar');
      if (swipeElement && swipeElement.classList.contains('swipe-enabled')) {
        e.preventDefault();
      }
    });
    
    document.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;
      
      // Only process fast swipes
      if (deltaTime > 300) return;
      
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      // Minimum swipe distance
      if (absX < 50 && absY < 50) return;
      
      // Determine swipe direction
      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0) {
          this.handleSwipeRight(e.target);
        } else {
          this.handleSwipeLeft(e.target);
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          this.handleSwipeDown(e.target);
        } else {
          this.handleSwipeUp(e.target);
        }
      }
    }, { passive: true });
  }
  
  static handleSwipeLeft(target) {
    const hotelCard = target.closest('.hotel-card');
    if (hotelCard) {
      // Swipe left to show more options or next image
      const hotelId = hotelCard.dataset.hotelId;
      if (hotelId && window.navigateGallery) {
        window.navigateGallery(hotelId, 1);
      }
    }
    
    const gallery = target.closest('.immersive-gallery');
    if (gallery) {
      const hotelId = gallery.id.replace('gallery-', '');
      if (window.navigateImmersiveGallery) {
        window.navigateImmersiveGallery(hotelId, 1);
      }
    }
  }
  
  static handleSwipeRight(target) {
    const hotelCard = target.closest('.hotel-card');
    if (hotelCard) {
      // Swipe right to show previous image
      const hotelId = hotelCard.dataset.hotelId;
      if (hotelId && window.navigateGallery) {
        window.navigateGallery(hotelId, -1);
      }
    }
    
    const gallery = target.closest('.immersive-gallery');
    if (gallery) {
      const hotelId = gallery.id.replace('gallery-', '');
      if (window.navigateImmersiveGallery) {
        window.navigateImmersiveGallery(hotelId, -1);
      }
    }
    
    // Swipe right on filters sidebar to close it
    const sidebar = target.closest('.filters-sidebar');
    if (sidebar && window.innerWidth <= 768) {
      this.toggleMobileFilters(false);
    }
  }
  
  static handleSwipeUp(target) {
    // Swipe up for more details or to show filters
    const resultsSection = target.closest('.results-section');
    if (resultsSection && window.innerWidth <= 768) {
      this.toggleMobileFilters(true);
    }
  }
  
  static handleSwipeDown(target) {
    // Swipe down to dismiss filters or refresh
    const filtersContainer = target.closest('.filters-sidebar');
    if (filtersContainer && window.innerWidth <= 768) {
      this.toggleMobileFilters(false);
    } else if (window.scrollY < 100) {
      // Pull to refresh at top of page
      this.triggerPullToRefresh();
    }
  }
  
  static setupPullToRefresh() {
    let startY = 0;
    let isPulling = false;
    let pullDistance = 0;
    
    const pullToRefreshElement = document.createElement('div');
    pullToRefreshElement.className = 'pull-to-refresh';
    pullToRefreshElement.innerHTML = `
      <div class="pull-icon">
        <i class="fas fa-arrow-down"></i>
      </div>
      <div class="pull-text">Pull to refresh</div>
    `;
    document.body.insertBefore(pullToRefreshElement, document.body.firstChild);
    
    document.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        isPulling = false;
      }
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
      if (window.scrollY === 0 && startY > 0) {
        const currentY = e.touches[0].clientY;
        pullDistance = currentY - startY;
        
        if (pullDistance > 0) {
          isPulling = true;
          const maxPull = 100;
          const normalizedDistance = Math.min(pullDistance, maxPull);
          
          pullToRefreshElement.style.transform = `translateY(${normalizedDistance - 60}px)`;
          pullToRefreshElement.style.opacity = normalizedDistance / maxPull;
          
          if (normalizedDistance >= maxPull) {
            pullToRefreshElement.classList.add('ready');
            pullToRefreshElement.querySelector('.pull-text').textContent = 'Release to refresh';
            pullToRefreshElement.querySelector('.pull-icon i').className = 'fas fa-sync-alt';
          } else {
            pullToRefreshElement.classList.remove('ready');
            pullToRefreshElement.querySelector('.pull-text').textContent = 'Pull to refresh';
            pullToRefreshElement.querySelector('.pull-icon i').className = 'fas fa-arrow-down';
          }
        }
      }
    }, { passive: true });
    
    document.addEventListener('touchend', () => {
      if (isPulling && pullDistance >= 100) {
        this.triggerPullToRefresh();
      }
      
      // Reset pull to refresh state
      pullToRefreshElement.style.transform = 'translateY(-60px)';
      pullToRefreshElement.style.opacity = '0';
      pullToRefreshElement.classList.remove('ready');
      startY = 0;
      isPulling = false;
      pullDistance = 0;
    }, { passive: true });
  }
  
  static async triggerPullToRefresh() {
    const pullElement = document.querySelector('.pull-to-refresh');
    if (pullElement) {
      pullElement.classList.add('refreshing');
      pullElement.querySelector('.pull-text').textContent = 'Refreshing...';
      pullElement.querySelector('.pull-icon i').className = 'fas fa-spinner fa-spin';
    }
    
    try {
      // Simulate refresh - in real app, this would refetch data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Refresh the current search results
      if (AppState.searchParams && Object.keys(AppState.searchParams).length > 0) {
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
          searchForm.dispatchEvent(new Event('submit', { bubbles: true }));
        }
      }
      
      HotelBookingApp.showToast('Results refreshed!', 'success');
    } catch (error) {
      HotelBookingApp.showToast('Refresh failed', 'error');
    } finally {
      if (pullElement) {
        pullElement.classList.remove('refreshing');
        setTimeout(() => {
          pullElement.style.transform = 'translateY(-60px)';
          pullElement.style.opacity = '0';
        }, 500);
      }
    }
  }
  
  static setupTouchOptimizations() {
    // Optimize touch target sizes
    this.optimizeTouchTargets();
    
    // Setup touch-friendly scrolling
    this.setupSmoothScrolling();
    
    // Optimize for mobile keyboards
    this.setupMobileKeyboard();
  }
  
  static optimizeTouchTargets() {
    // Ensure minimum 44px touch targets (iOS guideline)
    const touchElements = document.querySelectorAll('button, a, input, select, .clickable');
    
    touchElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        element.style.minWidth = '44px';
        element.style.minHeight = '44px';
        element.classList.add('touch-optimized');
      }
    });
  }
  
  static setupSmoothScrolling() {
    // Enable momentum scrolling on iOS
    document.body.style.webkitOverflowScrolling = 'touch';
    
    // Smooth scroll polyfill for older browsers
    if (!('scrollBehavior' in document.documentElement.style)) {
      this.addSmoothScrollPolyfill();
    }
  }
  
  static addSmoothScrollPolyfill() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/iamdustan/smoothscroll@1.4.10/dist/smoothscroll.min.js';
    document.head.appendChild(script);
  }
  
  static setupMobileKeyboard() {
    let viewportHeight = window.innerHeight;
    
    // Detect virtual keyboard
    window.addEventListener('resize', () => {
      const currentHeight = window.innerHeight;
      const heightDifference = viewportHeight - currentHeight;
      
      if (heightDifference > 150) {
        // Virtual keyboard is likely open
        document.body.classList.add('keyboard-open');
        this.adjustViewportForKeyboard(heightDifference);
      } else {
        // Virtual keyboard is likely closed
        document.body.classList.remove('keyboard-open');
        this.resetViewportAfterKeyboard();
      }
    });
    
    // Focus management for form inputs
    document.addEventListener('focusin', (e) => {
      if (e.target.matches('input, textarea, select')) {
        setTimeout(() => {
          e.target.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 300);
      }
    });
  }
  
  static adjustViewportForKeyboard(keyboardHeight) {
    const searchForm = document.querySelector('.search-form-container');
    if (searchForm) {
      searchForm.style.paddingBottom = `${keyboardHeight / 4}px`;
    }
  }
  
  static resetViewportAfterKeyboard() {
    const searchForm = document.querySelector('.search-form-container');
    if (searchForm) {
      searchForm.style.paddingBottom = '';
    }
  }
  
  static toggleMobileFilters(show) {
    const sidebar = document.querySelector('.filters-sidebar');
    const overlay = document.querySelector('.mobile-filters-overlay') || this.createMobileFiltersOverlay();
    
    if (show) {
      sidebar.classList.add('mobile-active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    } else {
      sidebar.classList.remove('mobile-active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
  
  static createMobileFiltersOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'mobile-filters-overlay';
    overlay.onclick = () => this.toggleMobileFilters(false);
    document.body.appendChild(overlay);
    return overlay;
  }
}

// Performance Optimization Manager
class PerformanceManager {
  static init() {
    this.setupLazyLoading();
    this.setupVirtualScrolling();
    MobileOptimizationManager.init();
    VisualExperienceManager.init();
  }
  
  static setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }
  
  static setupVirtualScrolling() {
    // Implement virtual scrolling for large hotel lists
    const container = document.getElementById('hotels');
    if (!container) return;
    
    // Basic implementation for demonstration
    this.virtualScrollContainer = container;
    this.itemHeight = 300; // Approximate hotel card height
    this.visibleItems = Math.ceil(window.innerHeight / this.itemHeight) + 5;
  }
  
  static setupImageOptimization() {
    // Preload critical images
    const criticalImages = document.querySelectorAll('img[data-critical]');
    criticalImages.forEach(img => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = img.src;
      document.head.appendChild(link);
    });
  }
}

// Enhanced Natural Language Search System - 2025
class SmartSearchEngine {
  static init() {
    this.setupSearchEnhancements();
    this.loadSearchHistory();
    this.setupVoiceSearch();
    this.initializeSearchSuggestions();
  }
  
  static setupSearchEnhancements() {
    const destinationInput = document.getElementById('destination');
    const purposeInput = document.getElementById('purpose');
    
    if (destinationInput) {
      this.setupSmartAutocomplete(destinationInput, 'destination');
    }
    
    if (purposeInput) {
      this.setupSmartAutocomplete(purposeInput, 'purpose');
    }
  }
  
  static setupSmartAutocomplete(input, type) {
    let debounceTimer;
    
    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.generateSmartSuggestions(e.target.value, type, input);
      }, 300);
    });
    
    input.addEventListener('keydown', (e) => {
      this.handleSuggestionNavigation(e, input);
    });
  }
  
  static async generateSmartSuggestions(query, type, input) {
    if (query.length < 2) {
      this.closeSuggestions(input);
      return;
    }
    
    const suggestions = await this.fetchContextualSuggestions(query, type);
    this.showSuggestions(suggestions, input, type);
  }
  
  static async fetchContextualSuggestions(query, type) {
    if (type === 'destination') {
      return this.getDestinationSuggestions(query);
    } else if (type === 'purpose') {
      return this.getPurposeSuggestions(query);
    }
    return [];
  }
  
  static getDestinationSuggestions(query) {
    const popularDestinations = [
      { name: 'New York City, NY', country: 'USA', type: 'city', popularity: 95 },
      { name: 'Paris, France', country: 'France', type: 'city', popularity: 92 },
      { name: 'Tokyo, Japan', country: 'Japan', type: 'city', popularity: 89 },
      { name: 'London, UK', country: 'United Kingdom', type: 'city', popularity: 88 },
      { name: 'Barcelona, Spain', country: 'Spain', type: 'city', popularity: 85 },
      { name: 'Rome, Italy', country: 'Italy', type: 'city', popularity: 87 },
      { name: 'Dubai, UAE', country: 'United Arab Emirates', type: 'city', popularity: 84 },
      { name: 'Bali, Indonesia', country: 'Indonesia', type: 'island', popularity: 83 },
      { name: 'Romantic getaway in Tuscany', country: 'Italy', type: 'experience', popularity: 76 }
    ];
    
    const queryLower = query.toLowerCase();
    return popularDestinations
      .filter(dest => 
        dest.name.toLowerCase().includes(queryLower) ||
        dest.country.toLowerCase().includes(queryLower)
      )
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 6)
      .map(dest => ({
        text: dest.name,
        description: `${dest.country} • ${dest.type}`,
        icon: dest.type === 'city' ? 'fas fa-city' : dest.type === 'island' ? 'fas fa-umbrella-beach' : 'fas fa-heart'
      }));
  }
  
  static getPurposeSuggestions(query) {
    const purposeCategories = [
      { text: 'Business trip', description: 'Work travel with meeting facilities', icon: 'fas fa-briefcase', keywords: ['work', 'business', 'meeting'] },
      { text: 'Romantic getaway', description: 'Couples retreat with intimate setting', icon: 'fas fa-heart', keywords: ['romantic', 'couple', 'honeymoon'] },
      { text: 'Family vacation', description: 'Family-friendly activities and amenities', icon: 'fas fa-users', keywords: ['family', 'kids', 'children'] },
      { text: 'Solo adventure', description: 'Independent travel experience', icon: 'fas fa-hiking', keywords: ['solo', 'adventure', 'explore'] },
      { text: 'Weekend escape', description: 'Short relaxing break', icon: 'fas fa-calendar-week', keywords: ['weekend', 'short', 'break'] },
      { text: 'Luxury retreat', description: 'Premium amenities and services', icon: 'fas fa-gem', keywords: ['luxury', 'premium', 'spa'] }
    ];
    
    const queryLower = query.toLowerCase();
    return purposeCategories
      .filter(purpose => 
        purpose.text.toLowerCase().includes(queryLower) ||
        purpose.keywords.some(keyword => keyword.includes(queryLower))
      )
      .slice(0, 6);
  }
  
  static showSuggestions(suggestions, input, type) {
    this.closeSuggestions(input);
    if (suggestions.length === 0) return;
    
    const suggestionsList = document.createElement('div');
    suggestionsList.className = 'smart-suggestions';
    suggestionsList.setAttribute('role', 'listbox');
    
    suggestions.forEach((suggestion, index) => {
      const suggestionItem = document.createElement('div');
      suggestionItem.className = 'suggestion-item';
      suggestionItem.setAttribute('role', 'option');
      suggestionItem.innerHTML = `
        <div class="suggestion-content">
          <i class="${suggestion.icon}" aria-hidden="true"></i>
          <div class="suggestion-text">
            <div class="suggestion-title">${suggestion.text}</div>
            ${suggestion.description ? `<div class="suggestion-desc">${suggestion.description}</div>` : ''}
          </div>
        </div>
      `;
      
      suggestionItem.addEventListener('click', () => {
        input.value = suggestion.text;
        this.closeSuggestions(input);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      
      suggestionsList.appendChild(suggestionItem);
    });
    
    // Position suggestions relative to input
    const inputGroup = input.closest('.form-group');
    inputGroup.style.position = 'relative';
    inputGroup.appendChild(suggestionsList);
    input.suggestionsList = suggestionsList;
  }
  
  static closeSuggestions(input) {
    if (input.suggestionsList) {
      input.suggestionsList.remove();
      input.suggestionsList = null;
    }
  }
  
  static handleSuggestionNavigation(e, input) {
    const suggestionsList = input.suggestionsList;
    if (!suggestionsList) return;
    
    const suggestions = suggestionsList.querySelectorAll('.suggestion-item');
    const currentIndex = Array.from(suggestions).findIndex(item => item.classList.contains('highlighted'));
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = currentIndex < suggestions.length - 1 ? currentIndex + 1 : 0;
        this.highlightSuggestion(suggestions, nextIndex);
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1;
        this.highlightSuggestion(suggestions, prevIndex);
        break;
      case 'Enter':
        if (currentIndex >= 0) {
          e.preventDefault();
          suggestions[currentIndex].click();
        }
        break;
      case 'Escape':
        this.closeSuggestions(input);
        break;
    }
  }
  
  static highlightSuggestion(suggestions, index) {
    suggestions.forEach(item => item.classList.remove('highlighted'));
    if (suggestions[index]) {
      suggestions[index].classList.add('highlighted');
    }
  }
  
  static setupVoiceSearch() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    
    this.addVoiceSearchButtons();
    this.setupVoiceRecognitionHandlers();
  }
  
  static addVoiceSearchButtons() {
    const destinationGroup = document.getElementById('destination')?.closest('.form-group');
    const purposeGroup = document.getElementById('purpose')?.closest('.form-group');
    
    [destinationGroup, purposeGroup].forEach(group => {
      if (group) {
        const voiceBtn = document.createElement('button');
        voiceBtn.type = 'button';
        voiceBtn.className = 'voice-search-btn';
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceBtn.setAttribute('aria-label', 'Voice search');
        voiceBtn.setAttribute('title', 'Click to use voice search');
        
        const input = group.querySelector('input');
        voiceBtn.addEventListener('click', () => this.startVoiceSearch(input));
        
        group.appendChild(voiceBtn);
      }
    });
  }
  
  static startVoiceSearch(targetInput) {
    if (this.recognition) {
      const voiceBtn = targetInput.parentNode.querySelector('.voice-search-btn');
      voiceBtn.classList.add('listening');
      
      this.recognition.targetInput = targetInput;
      this.recognition.start();
    }
  }
  
  static setupVoiceRecognitionHandlers() {
    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const input = this.recognition.targetInput;
      
      if (input) {
        input.value = transcript;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };
    
    this.recognition.onerror = (event) => {
      console.error('Voice search error:', event.error);
      this.resetVoiceButtons();
    };
    
    this.recognition.onend = () => {
      this.resetVoiceButtons();
    };
  }
  
  static resetVoiceButtons() {
    document.querySelectorAll('.voice-search-btn').forEach(btn => {
      btn.classList.remove('listening');
    });
  }
  
  static loadSearchHistory() {
    this.searchHistory = JSON.parse(localStorage.getItem('hotel_search_history') || '[]');
  }
  
  static initializeSearchSuggestions() {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.form-group')) {
        document.querySelectorAll('input').forEach(input => {
          this.closeSuggestions(input);
        });
      }
    });
  }
}

// Main Application Controller
class HotelBookingApp {
  static init() {
    this.setupEventListeners();
    this.setupGlobalFunctions();
    SmartSearchEngine.init();
    MobileOptimizationManager.init();
    VisualExperienceManager.init();
    PerformanceManager.init();
  }
  
  static setupEventListeners() {
    // Filter controls
    document.addEventListener('change', (e) => {
      if (e.target.matches('input[name="starRating"]')) {
        this.updateStarFilter();
      } else if (e.target.matches('input[name="amenities"]')) {
        this.updateAmenityFilter();
      } else if (e.target.matches('#sortBy')) {
        this.updateSort(e.target.value);
      }
    });
    
    // Price range sliders
    document.addEventListener('input', (e) => {
      if (e.target.matches('#priceMin, #priceMax')) {
        this.updatePriceFilter();
      }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.querySelector('.booking-modal.active')) {
        window.closeBookingModal();
      }
    });
  }
  
  static setupGlobalFunctions() {
    // Global functions for template usage
    window.showPriceBreakdown = (hotelId) => {
      this.showEnhancedPricingModal(hotelId);
    };
    
    window.showEnhancedPriceBreakdown = (hotelId) => {
      this.showEnhancedPricingModal(hotelId);
    };
    
    window.startBookingFlow = (hotelId) => {
      BookingFlow.start(hotelId);
    };
    
    window.sortResults = () => {
      const sortBy = document.getElementById('sortBy').value;
      this.updateSort(sortBy);
    };
    
    window.clearFilters = () => {
      this.resetFilters();
    };
    
    window.filterByStars = () => {
      this.updateStarFilter();
    };
    
    window.filterByAmenities = () => {
      this.updateAmenityFilter();
    };
    
    window.updatePriceFilter = () => {
      this.updatePriceFilter();
    };
    
    // Enhanced price comparison
    window.showPriceComparison = () => {
      const comparison = JSON.parse(localStorage.getItem('hotel_comparison') || '[]');
      if (comparison.length === 0) {
        HotelBookingApp.showToast('No hotels selected for comparison', 'info');
        return;
      }
      
      this.showComparisonModal(comparison);
    };
    
    window.clearComparison = () => {
      localStorage.removeItem('hotel_comparison');
      HotelBookingApp.showToast('Comparison cleared', 'info');
    };
  }
  
  static updateStarFilter() {
    const checkedStars = Array.from(document.querySelectorAll('input[name="starRating"]:checked'))
      .map(input => parseInt(input.value));
    AppState.filters.starRating = checkedStars;
    this.applyFilters();
  }
  
  static updateAmenityFilter() {
    const checkedAmenities = Array.from(document.querySelectorAll('input[name="amenities"]:checked'))
      .map(input => input.value);
    AppState.filters.amenities = checkedAmenities;
    this.applyFilters();
  }
  
  static updatePriceFilter() {
    const minPrice = parseInt(document.getElementById('priceMin').value);
    const maxPrice = parseInt(document.getElementById('priceMax').value);
    
    AppState.filters.priceRange = { min: minPrice, max: maxPrice };
    
    // Update display
    document.getElementById('priceMinDisplay').textContent = minPrice;
    document.getElementById('priceMaxDisplay').textContent = maxPrice;
    
    this.applyFilters();
  }
  
  static updateSort(sortBy) {
    AppState.currentSort = sortBy;
    this.applyFilters();
  }
  
  static applyFilters() {
    // Apply filters
    AppState.filteredHotels = SmartFilter.applyFilters(AppState.hotels, AppState.filters, AppState.searchParams);
    
    // Apply sorting
    AppState.filteredHotels = SmartFilter.sortHotels(AppState.filteredHotels, AppState.currentSort, AppState.searchParams);
    
    // Reset pagination
    AppState.currentPage = 1;
    
    // Render results
    this.renderHotels();
    this.updateResultsCount();
  }
  
  static renderHotels() {
    const container = document.getElementById('hotels');
    if (!container) return;
    
    const startIndex = (AppState.currentPage - 1) * AppState.hotelsPerPage;
    const endIndex = startIndex + AppState.hotelsPerPage;
    const hotelsToShow = AppState.filteredHotels.slice(startIndex, endIndex);
    
    if (hotelsToShow.length === 0) {
      container.innerHTML = '<div class="no-results">No hotels match your criteria. Try adjusting your filters.</div>';
      return;
    }
    
    container.innerHTML = hotelsToShow
      .map(hotel => HotelCardRenderer.render(hotel, AppState.searchParams))
      .join('');
    
    // Setup enhanced visual features for new content
    if (typeof VisualExperienceManager !== 'undefined') {
      VisualExperienceManager.observeNewImages();
    }
    
    this.setupPagination();
  }
  
  static setupPagination() {
    const totalPages = Math.ceil(AppState.filteredHotels.length / AppState.hotelsPerPage);
    const pagination = document.getElementById('pagination');
    
    if (!pagination || totalPages <= 1) return;
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
      <button ${AppState.currentPage === 1 ? 'disabled' : ''} onclick="changePage(${AppState.currentPage - 1})">
        <i class="fas fa-chevron-left"></i> Previous
      </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
      const pageNum = AppState.currentPage <= 3 ? i : AppState.currentPage - 3 + i;
      if (pageNum <= totalPages) {
        paginationHTML += `
          <button ${pageNum === AppState.currentPage ? 'class="active"' : ''} onclick="changePage(${pageNum})">
            ${pageNum}
          </button>
        `;
      }
    }
    
    // Next button
    paginationHTML += `
      <button ${AppState.currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${AppState.currentPage + 1})">
        Next <i class="fas fa-chevron-right"></i>
      </button>
    `;
    
    pagination.innerHTML = paginationHTML;
    
    // Global pagination function
    window.changePage = (page) => {
      AppState.currentPage = page;
      this.renderHotels();
      document.getElementById('hotels').scrollIntoView({ behavior: 'smooth' });
    };
  }
  
  static updateResultsCount() {
    const resultsTitle = document.getElementById('resultsTitle');
    if (resultsTitle) {
      const count = AppState.filteredHotels.length;
      const total = AppState.hotels.length;
      resultsTitle.textContent = `${count} of ${total} Hotels Found`;
    }
  }
  
  static resetFilters() {
    // Reset filter state
    AppState.filters = {
      priceRange: { min: 0, max: 1000 },
      starRating: [],
      amenities: [],
      passions: []
    };
    
    // Reset form controls
    document.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.checked = false;
    });
    
    document.getElementById('priceMin').value = 0;
    document.getElementById('priceMax').value = 1000;
    document.getElementById('priceMinDisplay').textContent = '0';
    document.getElementById('priceMaxDisplay').textContent = '1000';
    
    // Reapply filters
    this.applyFilters();
  }
  
  static showEnhancedPricingModal(hotelId) {
    const hotel = AppState.hotels.find(h => h.hotel_data?.hotel_id === hotelId);
    if (!hotel) return;
    
    const nights = HotelCardRenderer.calculateNights(
      AppState.searchParams.checkin, 
      AppState.searchParams.checkout
    );
    const pricing = PricingCalculator.calculate(hotel, nights, AppState.searchParams.rooms || 1);
    
    // Remove existing modals
    document.querySelectorAll('.pricing-modal').forEach(modal => modal.remove());
    
    const modal = document.createElement('div');
    modal.className = 'pricing-modal';
    modal.innerHTML = `
      <div class="pricing-modal-backdrop" onclick="closePricingModal()"></div>
      <div class="pricing-modal-content">
        <div class="modal-header">
          <h3>Complete Price Breakdown</h3>
          <button class="close-btn" onclick="closePricingModal()" aria-label="Close price breakdown">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          ${PricingCalculator.createInteractivePriceBreakdown(pricing, hotelId)}
          
          <div class="price-comparison">
            <h4>Price Comparison</h4>
            <div class="comparison-stats">
              <div class="stat">
                <span class="stat-label">vs Similar Hotels</span>
                <span class="stat-value good">15% Lower</span>
              </div>
              <div class="stat">
                <span class="stat-label">Last 30 Days</span>
                <span class="stat-value neutral">Stable</span>
              </div>
              <div class="stat">
                <span class="stat-label">Price Trend</span>
                <span class="stat-value trending">↗ Increasing</span>
              </div>
            </div>
          </div>
          
          <div class="price-alerts">
            <div class="alert-option">
              <input type="checkbox" id="priceDropAlert" class="alert-checkbox">
              <label for="priceDropAlert">
                <i class="fas fa-arrow-down"></i>
                <span>Notify me if price drops</span>
              </label>
            </div>
            <div class="alert-option">
              <input type="checkbox" id="availabilityAlert" class="alert-checkbox">
              <label for="availabilityAlert">
                <i class="fas fa-hourglass-half"></i>
                <span>Alert me if availability gets low</span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary" onclick="closePricingModal()">Close</button>
          <button class="btn-primary" onclick="startBookingFlow('${hotelId}')">
            <i class="fas fa-credit-card"></i>
            Book at This Price
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    window.closePricingModal = () => {
      modal.classList.add('closing');
      setTimeout(() => modal.remove(), 300);
    };
    
    // Show with animation
    requestAnimationFrame(() => {
      modal.classList.add('active');
    });
    
    // Setup price tracking
    this.setupPriceTracking(hotelId);
  }
  
  static setupPriceTracking(hotelId) {
    window.togglePriceTracking = (hotelId) => {
      const trackingKey = `price_tracking_${hotelId}`;
      const isTracking = localStorage.getItem(trackingKey) === 'true';
      
      if (isTracking) {
        localStorage.removeItem(trackingKey);
        this.showToast('Price tracking disabled', 'info');
      } else {
        localStorage.setItem(trackingKey, 'true');
        this.showToast('You\'ll be notified of price changes', 'success');
        // In real app, this would register for push notifications
      }
      
      // Update button state
      const btn = document.querySelector(`[onclick="togglePriceTracking('${hotelId}')"]`);
      if (btn) {
        btn.classList.toggle('active', !isTracking);
        btn.innerHTML = `<i class="fas fa-bell${!isTracking ? '' : '-slash'}"></i>`;
      }
    };
    
    window.addToComparison = (hotelId) => {
      const comparisonKey = 'hotel_comparison';
      let comparison = JSON.parse(localStorage.getItem(comparisonKey) || '[]');
      
      if (!comparison.includes(hotelId)) {
        comparison.push(hotelId);
        if (comparison.length > 3) comparison.shift(); // Keep max 3 hotels
        localStorage.setItem(comparisonKey, JSON.stringify(comparison));
        this.showToast(`Added to comparison (${comparison.length}/3)`, 'success');
      } else {
        this.showToast('Hotel already in comparison', 'info');
      }
    };
  }
  
  static showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => toast.classList.add('active'));
    
    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  // Legacy method for backwards compatibility
  static showPricingTooltip(target, pricing) {
    const hotelId = target.closest('[data-hotel-id]')?.dataset.hotelId;
    if (hotelId) {
      this.showEnhancedPricingModal(hotelId);
    }
  }
  
  // Method to load search results
  static loadSearchResults(data, searchParams) {
    AppState.hotels = data.rates || [];
    AppState.filteredHotels = [...AppState.hotels];
    AppState.searchParams = searchParams;
    AppState.currentPage = 1;
    
    // Apply initial sorting
    AppState.filteredHotels = SmartFilter.sortHotels(AppState.filteredHotels, AppState.currentSort, AppState.searchParams);
    
    // Render results
    this.renderHotels();
    this.updateResultsCount();
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  HotelBookingApp.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    HotelBookingApp,
    PricingCalculator,
    SmartFilter,
    HotelCardRenderer,
    BookingFlow
  };
}