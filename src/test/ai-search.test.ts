import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('AI Search API', () => {
  describe('POST /api/ai/search', () => {
    it('should process natural language search query', async () => {
      const searchQuery = 'Find me a luxury hotel near the beach';
      
      const response = await request(app)
        .post('/api/ai/search')
        .send({ query: searchQuery })
        .expect(200);

      expect(response.body).toHaveProperty('processedQuery', searchQuery);
      expect(response.body).toHaveProperty('intent');
      expect(response.body).toHaveProperty('extractedFilters');
      expect(response.body).toHaveProperty('suggestions');
    });

    it('should return correct response structure', async () => {
      const response = await request(app)
        .post('/api/ai/search')
        .send({ query: 'luxury beach resort' })
        .expect(200);

      expect(response.body.intent).toBe('hotel_search');
      expect(response.body.extractedFilters).toHaveProperty('location');
      expect(response.body.extractedFilters).toHaveProperty('dateRange');
      expect(response.body.extractedFilters).toHaveProperty('priceRange');
      expect(response.body.extractedFilters).toHaveProperty('amenities');
      expect(Array.isArray(response.body.suggestions)).toBe(true);
      expect(response.body.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle empty query', async () => {
      const response = await request(app)
        .post('/api/ai/search')
        .send({ query: '' })
        .expect(200);

      expect(response.body).toHaveProperty('processedQuery', '');
      expect(response.body).toHaveProperty('intent');
    });

    it('should handle missing query parameter', async () => {
      const response = await request(app)
        .post('/api/ai/search')
        .send({})
        .expect(200);

      expect(response.body.processedQuery).toBeUndefined();
      expect(response.body).toHaveProperty('intent', 'hotel_search');
    });

    it('should handle various query types', async () => {
      const queries = [
        'Business hotel in downtown',
        'Family resort with pool',
        'Budget accommodation',
        'Pet-friendly hotel',
        'Mountain view cabin'
      ];

      for (const query of queries) {
        const response = await request(app)
          .post('/api/ai/search')
          .send({ query })
          .expect(200);

        expect(response.body.processedQuery).toBe(query);
        expect(response.body.intent).toBe('hotel_search');
        expect(Array.isArray(response.body.suggestions)).toBe(true);
      }
    });

    it('should handle special characters in query', async () => {
      const response = await request(app)
        .post('/api/ai/search')
        .send({ query: 'Hotel with 5★ rating & spa facilities!' })
        .expect(200);

      expect(response.body).toHaveProperty('processedQuery');
      expect(response.body.intent).toBe('hotel_search');
    });

    it('should return consistent suggestion format', async () => {
      const response = await request(app)
        .post('/api/ai/search')
        .send({ query: 'beach hotel' })
        .expect(200);

      response.body.suggestions.forEach((suggestion: any) => {
        expect(typeof suggestion).toBe('string');
        expect(suggestion.length).toBeGreaterThan(0);
      });
    });
  });

  describe('AI Search Integration', () => {
    it('should provide location suggestions that match available hotels', async () => {
      const response = await request(app)
        .post('/api/ai/search')
        .send({ query: 'beach hotel' })
        .expect(200);

      // Current mock returns 'Miami Beach' as location
      expect(response.body.extractedFilters.location).toBe('Miami Beach');
      
      // Verify this location exists in our hotel data
      const hotelsResponse = await request(app)
        .get('/api/hotels/search?location=Miami')
        .expect(200);
      
      expect(hotelsResponse.body.hotels.length).toBeGreaterThan(0);
    });

    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/ai/search')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(500);

      // Express default error handling returns 500 for malformed JSON
      expect(response.body).toHaveProperty('error');
    });
  });
});