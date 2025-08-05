import React, { useState } from 'react';

interface Testimonial {
  id: string;
  name: string;
  location: string;
  avatar: string;
  rating: number;
  review: string;
  hotelStayed: string;
  dateStayed: string;
  verified: boolean;
}

interface TestimonialsProps {
  testimonials?: Testimonial[];
  autoSlide?: boolean;
  className?: string;
}

const Testimonials: React.FC<TestimonialsProps> = ({
  testimonials = [
    {
      id: '1',
      name: 'Sarah Johnson',
      location: 'New York, USA',
      avatar: '/avatars/sarah.jpg',
      rating: 5,
      review: 'Amazing experience! The hotel recommendation was perfect for our honeymoon. The booking process was so smooth and the customer service was exceptional.',
      hotelStayed: 'Grand Palace Resort, Bali',
      dateStayed: 'March 2024',
      verified: true,
    },
    {
      id: '2',
      name: 'Michael Chen',
      location: 'Toronto, Canada',
      avatar: '/avatars/michael.jpg',
      rating: 5,
      review: 'I travel frequently for business and this platform has become my go-to for hotel bookings. Great prices, excellent selection, and reliable service.',
      hotelStayed: 'Business Tower Hotel, Tokyo',
      dateStayed: 'February 2024',
      verified: true,
    },
    {
      id: '3',
      name: 'Emma Rodriguez',
      location: 'Madrid, Spain',
      avatar: '/avatars/emma.jpg',
      rating: 4,
      review: 'The passion-based hotel matching feature is brilliant! It found exactly the type of boutique hotel I was looking for in Paris. Highly recommend!',
      hotelStayed: 'Le Petit Boutique, Paris',
      dateStayed: 'January 2024',
      verified: true,
    },
    {
      id: '4',
      name: 'David Kim',
      location: 'Seoul, South Korea',
      avatar: '/avatars/david.jpg',
      rating: 5,
      review: 'Fantastic platform with great user experience. The AI-powered search understood exactly what I was looking for. Will definitely use again!',
      hotelStayed: 'Luxury Suites Dubai',
      dateStayed: 'December 2023',
      verified: true,
    },
    {
      id: '5',
      name: 'Lisa Thompson',
      location: 'London, UK',
      avatar: '/avatars/lisa.jpg',
      rating: 5,
      review: 'Best hotel booking experience ever! The personalized recommendations were spot-on, and the whole family loved our vacation resort.',
      hotelStayed: 'Tropical Paradise Resort, Maldives',
      dateStayed: 'November 2023',
      verified: true,
    },
  ],
  autoSlide: _autoSlide = false,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1,
    );
  };

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1,
    );
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <section className={`py-16 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            What Our Travelers Say
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have found their perfect hotels with us.
          </p>
        </div>

        {/* Desktop View - Grid */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8">
          {testimonials.slice(0, 3).map((testimonial) => (
            <div key={testimonial.id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-avatar.jpg';
                  }}
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.location}</p>
                </div>
                {testimonial.verified && (
                  <div className="ml-auto">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center mb-3">
                {renderStars(testimonial.rating)}
                <span className="ml-2 text-sm text-gray-600">
                  {testimonial.rating}.0
                </span>
              </div>

              <blockquote className="text-gray-700 mb-4 italic">
                "{testimonial.review}"
              </blockquote>

              <div className="text-sm text-gray-500">
                <p className="font-medium">{testimonial.hotelStayed}</p>
                <p>{testimonial.dateStayed}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile/Tablet View - Carousel */}
        <div className="lg:hidden">
          <div className="relative">
            <div className="bg-white rounded-xl shadow-lg p-6 mx-4">
              <div className="flex items-center mb-4">
                <img
                  src={testimonials[currentIndex].avatar}
                  alt={testimonials[currentIndex].name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-avatar.jpg';
                  }}
                />
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {testimonials[currentIndex].name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {testimonials[currentIndex].location}
                  </p>
                </div>
                {testimonials[currentIndex].verified && (
                  <div className="ml-auto">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center mb-3">
                {renderStars(testimonials[currentIndex].rating)}
                <span className="ml-2 text-sm text-gray-600">
                  {testimonials[currentIndex].rating}.0
                </span>
              </div>

              <blockquote className="text-gray-700 mb-4 italic">
                "{testimonials[currentIndex].review}"
              </blockquote>

              <div className="text-sm text-gray-500">
                <p className="font-medium">{testimonials[currentIndex].hotelStayed}</p>
                <p>{testimonials[currentIndex].dateStayed}</p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-6 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Join thousands of happy travelers</p>
          <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Start Your Journey
          </button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;