import { describe, it, expect } from 'vitest';
import { createBookingConfirmationEmailTemplate } from './bookingConfirmation.js';

describe('Booking Confirmation Email Template - TDD', () => {
  describe('Booking Confirmation Email System (RED PHASE - These tests should FAIL)', () => {
    it('should have createBookingConfirmationEmailTemplate function', () => {
      // This test SHOULD FAIL initially - function doesn't exist yet
      expect(createBookingConfirmationEmailTemplate).toBeDefined();
      expect(typeof createBookingConfirmationEmailTemplate).toBe('function');
    });

    it('should generate booking confirmation email with complete booking details', () => {
      // This test SHOULD FAIL - function doesn't exist yet
      const bookingData = {
        firstName: 'John',
        lastName: 'Doe',
        bookingId: 'VB-2024-001234',
        hotelName: 'Grand Luxury Resort & Spa',
        checkIn: '2024-12-15',
        checkOut: '2024-12-18',
        nights: 3,
        guests: 2,
        totalAmount: 750,
        confirmationUrl: 'https://vibe-booking.netlify.app/booking/VB-2024-001234'
      };

      const template = createBookingConfirmationEmailTemplate(bookingData);

      expect(template).toBeDefined();
      expect(template.subject).toContain('Booking Confirmed');
      expect(template.subject).toContain('VB-2024-001234');
      expect(template.html).toContain('John');
      expect(template.html).toContain('Grand Luxury Resort & Spa');
      expect(template.html).toContain('December 15, 2024');
      expect(template.html).toContain('December 18, 2024');
      expect(template.html).toContain('3 nights');
      expect(template.html).toContain('2 guests');
      expect(template.html).toContain('$750');
      expect(template.text).toBeDefined();
    });

    it('should include luxury hotel branding in booking confirmation', () => {
      // This test SHOULD FAIL - template doesn't exist yet
      const bookingData = {
        firstName: 'Jane',
        lastName: 'Smith',
        bookingId: 'VB-2024-001235',
        hotelName: 'Boutique City Hotel',
        checkIn: '2024-12-20',
        checkOut: '2024-12-22',
        nights: 2,
        guests: 1,
        totalAmount: 400,
        confirmationUrl: 'https://vibe-booking.netlify.app/booking/VB-2024-001235'
      };

      const template = createBookingConfirmationEmailTemplate(bookingData);

      expect(template.html).toContain('Vibe Hotels');
      expect(template.html).toContain('#1c2951'); // Luxury navy color
      expect(template.html).toContain('#b8860b'); // Luxury gold color
      expect(template.html).toContain('🏨'); // Hotel emoji
      expect(template.html).toContain('luxury');
    });

    it('should include call-to-action buttons for booking management', () => {
      // This test SHOULD FAIL - CTA buttons don't exist yet
      const bookingData = {
        firstName: 'Alice',
        lastName: 'Johnson',
        bookingId: 'VB-2024-001236',
        hotelName: 'Seaside Resort',
        checkIn: '2024-12-25',
        checkOut: '2024-12-28',
        nights: 3,
        guests: 4,
        totalAmount: 1200,
        confirmationUrl: 'https://vibe-booking.netlify.app/booking/VB-2024-001236'
      };

      const template = createBookingConfirmationEmailTemplate(bookingData);

      expect(template.html).toContain('View Booking Details');
      expect(template.html).toContain('Manage Booking');
      expect(template.html).toContain('Contact Hotel');
      expect(template.html).toContain('href=');
      expect(template.html).toContain(bookingData.confirmationUrl);
    });

    it('should include check-in instructions and hotel contact information', () => {
      // This test SHOULD FAIL - instructions don't exist yet
      const bookingData = {
        firstName: 'Michael',
        lastName: 'Brown',
        bookingId: 'VB-2024-001237',
        hotelName: 'Mountain Lodge',
        checkIn: '2024-12-30',
        checkOut: '2025-01-02',
        nights: 3,
        guests: 2,
        totalAmount: 900,
        confirmationUrl: 'https://vibe-booking.netlify.app/booking/VB-2024-001237'
      };

      const template = createBookingConfirmationEmailTemplate(bookingData);

      expect(template.html).toContain('Check-in Instructions');
      expect(template.html).toContain('3:00 PM');
      expect(template.html).toContain('11:00 AM');
      expect(template.html).toContain('photo ID');
      expect(template.html).toContain('credit card');
      expect(template.html).toContain('contact the hotel');
    });

    it('should format dates and currency professionally', () => {
      // This test SHOULD FAIL - formatting doesn't exist yet
      const bookingData = {
        firstName: 'Sarah',
        lastName: 'Davis',
        bookingId: 'VB-2024-001238',
        hotelName: 'Business Hotel',
        checkIn: '2024-12-01',
        checkOut: '2024-12-03',
        nights: 2,
        guests: 1,
        totalAmount: 500,
        confirmationUrl: 'https://vibe-booking.netlify.app/booking/VB-2024-001238'
      };

      const template = createBookingConfirmationEmailTemplate(bookingData);

      // Should format dates as "December 1, 2024" not "2024-12-01"
      expect(template.html).toContain('December 1, 2024');
      expect(template.html).toContain('December 3, 2024');
      
      // Should format currency as "$500.00" not "500"
      expect(template.html).toContain('$500.00');
      
      // Should include proper pluralization
      expect(template.html).toContain('2 nights');
      expect(template.html).toContain('1 guest');
    });

    it('should include booking modification and cancellation policies', () => {
      // This test SHOULD FAIL - policies don't exist yet
      const bookingData = {
        firstName: 'David',
        lastName: 'Wilson',
        bookingId: 'VB-2024-001239',
        hotelName: 'Luxury Suites',
        checkIn: '2024-12-10',
        checkOut: '2024-12-14',
        nights: 4,
        guests: 3,
        totalAmount: 1600,
        confirmationUrl: 'https://vibe-booking.netlify.app/booking/VB-2024-001239'
      };

      const template = createBookingConfirmationEmailTemplate(bookingData);

      expect(template.html).toContain('Cancellation Policy');
      expect(template.html).toContain('Modification Policy');
      expect(template.html).toContain('24 hours');
      expect(template.html).toContain('free cancellation');
      expect(template.html).toContain('modify your booking');
    });
  });
});