import { OpenAI } from 'openai';
import { config } from '../config';
import { logger } from '../utils/logger';
import { z } from 'zod';

// Schema for parsed search query
const ParsedSearchQuerySchema = z.object({
  location: z.object({
    city: z.string().optional(),
    country: z.string().optional(),
    region: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }).optional(),
  dates: z.object({
    checkIn: z.string(),
    checkOut: z.string(),
  }).optional(),
  guests: z.object({
    adults: z.number().default(1),
    children: z.number().default(0),
    rooms: z.number().default(1),
  }).optional(),
  priceRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().default('USD'),
  }).optional(),
  amenities: z.array(z.string()).optional(),
  hotelType: z.array(z.string()).optional(),
  starRating: z.array(z.number()).optional(),
  preferences: z.object({
    nearBeach: z.boolean().optional(),
    petFriendly: z.boolean().optional(),
    businessFriendly: z.boolean().optional(),
    familyFriendly: z.boolean().optional(),
    romantic: z.boolean().optional(),
    luxury: z.boolean().optional(),
    budget: z.boolean().optional(),
    sustainable: z.boolean().optional(),
  }).optional(),
  activities: z.array(z.string()).optional(),
  passions: z.array(z.string()).optional(),
});

export type ParsedSearchQuery = z.infer<typeof ParsedSearchQuerySchema>;

export class AISearchService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  async parseNaturalLanguageQuery(query: string, context?: {
    userLocation?: { lat: number; lng: number };
    previousSearches?: string[];
    userPreferences?: Record<string, any>;
  }): Promise<ParsedSearchQuery> {
    try {
      const systemPrompt = `You are a hotel search assistant that converts natural language queries into structured search parameters.
      
      Extract the following information from user queries:
      - Location (city, country, region, or coordinates)
      - Check-in and check-out dates (return in ISO format YYYY-MM-DD)
      - Number of guests (adults, children) and rooms
      - Price range and currency
      - Desired amenities (wifi, pool, gym, spa, parking, etc.)
      - Hotel type (resort, boutique, business, airport, etc.)
      - Star rating preferences
      - Special preferences (pet-friendly, beach access, romantic, family-friendly, etc.)
      - Activities or experiences they're interested in
      - Passions or interests (adventure, wellness, culture, food, etc.)
      
      Current date: ${new Date().toISOString().split('T')[0]}
      
      Return a valid JSON object matching the schema. If dates are not specified, suggest reasonable defaults.
      If location is vague, ask for clarification in the response.`;

      const userPrompt = `Query: "${query}"
      ${context?.userLocation ? `User's current location: ${context.userLocation.lat}, ${context.userLocation.lng}` : ''}
      ${context?.previousSearches ? `Previous searches: ${context.previousSearches.join(', ')}` : ''}`;

      const completion = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: config.openai.temperature,
        max_tokens: config.openai.maxTokens,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const parsedData = JSON.parse(response);
      const validatedData = ParsedSearchQuerySchema.parse(parsedData);

      logger.info('Successfully parsed natural language query', {
        originalQuery: query,
        parsedData: validatedData,
      });

      return validatedData;

    } catch (error) {
      logger.error('Failed to parse natural language query', { error, query });
      throw new Error('Failed to understand your search query. Please try rephrasing.');
    }
  }

  async generateSearchSuggestions(partialQuery: string, context?: {
    recentSearches?: string[];
    popularDestinations?: string[];
  }): Promise<string[]> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'Generate 5 relevant hotel search suggestions based on the partial query. Return as a JSON array of strings.',
          },
          {
            role: 'user',
            content: `Partial query: "${partialQuery}"
            Recent searches: ${context?.recentSearches?.join(', ') || 'none'}
            Popular destinations: ${context?.popularDestinations?.join(', ') || 'none'}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        return [];
      }

      const { suggestions } = JSON.parse(response);
      return Array.isArray(suggestions) ? suggestions.slice(0, 5) : [];

    } catch (error) {
      logger.error('Failed to generate search suggestions', { error, partialQuery });
      return [];
    }
  }

  async enhanceHotelDescriptions(hotels: any[]): Promise<any[]> {
    try {
      const enhancedHotels = await Promise.all(
        hotels.map(async (hotel) => {
          const completion = await this.openai.chat.completions.create({
            model: config.openai.model,
            messages: [
              {
                role: 'system',
                content: 'Create a compelling, concise hotel description (max 100 words) highlighting unique features and appeal.',
              },
              {
                role: 'user',
                content: `Hotel: ${hotel.name}
                Location: ${hotel.city}, ${hotel.country}
                Amenities: ${hotel.amenities.join(', ')}
                Rating: ${hotel.rating}/5
                Original description: ${hotel.description}`,
              },
            ],
            temperature: 0.8,
            max_tokens: 150,
          });

          const enhancedDescription = completion.choices[0].message.content || hotel.description;

          return {
            ...hotel,
            aiEnhancedDescription: enhancedDescription,
          };
        })
      );

      return enhancedHotels;

    } catch (error) {
      logger.error('Failed to enhance hotel descriptions', { error });
      return hotels; // Return original hotels if enhancement fails
    }
  }

  async analyzeUserIntent(query: string): Promise<{
    intent: 'search' | 'booking' | 'question' | 'support';
    confidence: number;
    entities: Record<string, any>;
  }> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: `Analyze the user's intent from their message. Classify as:
            - search: Looking for hotels
            - booking: Ready to book or asking about booking process
            - question: General questions about hotels or services
            - support: Need help or have issues
            
            Return JSON with intent, confidence (0-1), and extracted entities.`,
          },
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(response);

    } catch (error) {
      logger.error('Failed to analyze user intent', { error, query });
      return {
        intent: 'search',
        confidence: 0.5,
        entities: {},
      };
    }
  }

  async generatePersonalizedRecommendations(userData: {
    previousBookings?: any[];
    searchHistory?: string[];
    preferences?: Record<string, any>;
    currentLocation?: { lat: number; lng: number };
  }): Promise<{
    destinations: string[];
    hotelTypes: string[];
    experiences: string[];
    priceRange: { min: number; max: number };
  }> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'Generate personalized hotel recommendations based on user data. Return JSON with destinations, hotel types, experiences, and price range suggestions.',
          },
          {
            role: 'user',
            content: JSON.stringify(userData),
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(response);

    } catch (error) {
      logger.error('Failed to generate personalized recommendations', { error });
      return {
        destinations: [],
        hotelTypes: [],
        experiences: [],
        priceRange: { min: 0, max: 500 },
      };
    }
  }
}

export const aiSearchService = new AISearchService();