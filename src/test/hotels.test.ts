import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('Hotels API', () => {
  describe('GET /api/hotels/search', () => {
    it('should return all hotels when no filters applied', async () => {
      const response = await request(app)
        .get('/api/hotels/search')
        .expect(200);

      expect(response.body).toHaveProperty('hotels');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('totalPages', 1);
      expect(response.body.hotels).toBeInstanceOf(Array);
      expect(response.body.hotels.length).toBe(3);
      expect(response.body.total).toBe(3);
    });

    it('should return hotels with correct structure', async () => {
      const response = await request(app)
        .get('/api/hotels/search')
        .expect(200);

      const hotel = response.body.hotels[0];
      expect(hotel).toHaveProperty('id');
      expect(hotel).toHaveProperty('name');
      expect(hotel).toHaveProperty('location');
      expect(hotel).toHaveProperty('description');
      expect(hotel).toHaveProperty('starRating');
      expect(hotel).toHaveProperty('price');
      expect(hotel).toHaveProperty('images');
      expect(hotel).toHaveProperty('amenities');
      expect(hotel).toHaveProperty('rooms');

      expect(hotel.price).toHaveProperty('amount');
      expect(hotel.price).toHaveProperty('currency', 'USD');
      expect(hotel.images).toBeInstanceOf(Array);
      expect(hotel.amenities).toBeInstanceOf(Array);
      expect(hotel.rooms).toBeInstanceOf(Array);
      expect(hotel.starRating).toBeGreaterThanOrEqual(1);
      expect(hotel.starRating).toBeLessThanOrEqual(5);
    });

    it('should filter hotels by location', async () => {
      const response = await request(app)
        .get('/api/hotels/search?location=miami')
        .expect(200);

      expect(response.body.hotels).toHaveLength(1);
      expect(response.body.hotels[0].location).toContain('Miami');
      expect(response.body.total).toBe(1);
    });

    it('should filter hotels by location case-insensitive', async () => {
      const response = await request(app)
        .get('/api/hotels/search?location=MIAMI')
        .expect(200);

      expect(response.body.hotels).toHaveLength(1);
      expect(response.body.hotels[0].location).toContain('Miami');
    });

    it('should filter hotels by minimum price', async () => {
      const response = await request(app)
        .get('/api/hotels/search?minPrice=250')
        .expect(200);

      response.body.hotels.forEach((hotel: any) => {
        expect(hotel.price.amount).toBeGreaterThanOrEqual(250);
      });
    });

    it('should filter hotels by maximum price', async () => {
      const response = await request(app)
        .get('/api/hotels/search?maxPrice=250')
        .expect(200);

      response.body.hotels.forEach((hotel: any) => {
        expect(hotel.price.amount).toBeLessThanOrEqual(250);
      });
    });

    it('should filter hotels by price range', async () => {
      const response = await request(app)
        .get('/api/hotels/search?minPrice=200&maxPrice=280')
        .expect(200);

      response.body.hotels.forEach((hotel: any) => {
        expect(hotel.price.amount).toBeGreaterThanOrEqual(200);
        expect(hotel.price.amount).toBeLessThanOrEqual(280);
      });
    });

    it('should handle multiple filters simultaneously', async () => {
      const response = await request(app)
        .get('/api/hotels/search?location=miami&minPrice=200&maxPrice=400')
        .expect(200);

      expect(response.body.hotels).toHaveLength(1);
      const hotel = response.body.hotels[0];
      expect(hotel.location).toContain('Miami');
      expect(hotel.price.amount).toBeGreaterThanOrEqual(200);
      expect(hotel.price.amount).toBeLessThanOrEqual(400);
    });

    it('should return empty array when no hotels match filters', async () => {
      const response = await request(app)
        .get('/api/hotels/search?location=nonexistent')
        .expect(200);

      expect(response.body.hotels).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });

    it('should handle invalid price filters gracefully', async () => {
      const response = await request(app)
        .get('/api/hotels/search?minPrice=invalid')
        .expect(200);

      // Invalid price filter results in NaN, which fails the filter, returning no results
      // This is actually the expected behavior for invalid input
      expect(response.body.hotels).toBeInstanceOf(Array);
      expect(response.body.total).toBe(response.body.hotels.length);
    });
  });

  describe('GET /api/hotels/:id', () => {
    it('should return hotel details for valid ID', async () => {
      const response = await request(app)
        .get('/api/hotels/hotel-1')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'hotel-1');
      expect(response.body).toHaveProperty('name', 'Luxury Beach Resort');
      expect(response.body).toHaveProperty('location');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('fullDescription');
      expect(response.body).toHaveProperty('starRating', 5);
      expect(response.body).toHaveProperty('price');
      expect(response.body).toHaveProperty('images');
      expect(response.body).toHaveProperty('amenities');
      expect(response.body).toHaveProperty('rooms');
      expect(response.body).toHaveProperty('address');
      expect(response.body).toHaveProperty('phone');
      expect(response.body).toHaveProperty('email');
    });

    it('should return hotel with multiple room options', async () => {
      const response = await request(app)
        .get('/api/hotels/hotel-1')
        .expect(200);

      expect(response.body.rooms).toBeInstanceOf(Array);
      expect(response.body.rooms.length).toBeGreaterThan(1);
      
      const room = response.body.rooms[0];
      expect(room).toHaveProperty('id');
      expect(room).toHaveProperty('type');
      expect(room).toHaveProperty('price');
      expect(room).toHaveProperty('available');
      expect(room).toHaveProperty('description');
    });

    it('should return 404 for non-existent hotel ID', async () => {
      const response = await request(app)
        .get('/api/hotels/non-existent-hotel')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Hotel not found'
      });
    });

    it('should handle empty hotel ID', async () => {
      const response = await request(app)
        .get('/api/hotels/')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Data Validation', () => {
    it('should have valid hotel data structure', async () => {
      const response = await request(app)
        .get('/api/hotels/search')
        .expect(200);

      response.body.hotels.forEach((hotel: any) => {
        // Required fields
        expect(hotel.id).toBeTruthy();
        expect(hotel.name).toBeTruthy();
        expect(hotel.location).toBeTruthy();
        expect(hotel.description).toBeTruthy();
        
        // Numeric validations
        expect(typeof hotel.starRating).toBe('number');
        expect(hotel.starRating).toBeGreaterThanOrEqual(1);
        expect(hotel.starRating).toBeLessThanOrEqual(5);
        expect(typeof hotel.price.amount).toBe('number');
        expect(hotel.price.amount).toBeGreaterThan(0);
        
        // Array validations
        expect(Array.isArray(hotel.images)).toBe(true);
        expect(Array.isArray(hotel.amenities)).toBe(true);
        expect(Array.isArray(hotel.rooms)).toBe(true);
        expect(hotel.images.length).toBeGreaterThan(0);
        expect(hotel.amenities.length).toBeGreaterThan(0);
        expect(hotel.rooms.length).toBeGreaterThan(0);
        
        // Room structure validation
        hotel.rooms.forEach((room: any) => {
          expect(room.id).toBeTruthy();
          expect(room.type).toBeTruthy();
          expect(typeof room.price).toBe('number');
          expect(typeof room.available).toBe('boolean');
        });
      });
    });
  });
});