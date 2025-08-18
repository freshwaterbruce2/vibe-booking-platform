import axios from 'axios';
import type { ProcessedQuery } from '@/types/api';

class AIService {
  private baseURL = '/api';

  async processNaturalLanguage(query: string): Promise<ProcessedQuery> {
    try {
      const response = await axios.post(`${this.baseURL}/ai/process-query`, {
        query,
        context: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        },
      });
      return response.data.processedQuery;
    } catch (error) {
      console.error('Error processing natural language query:', error);
      throw new Error('Failed to process natural language query');
    }
  }

  async getRecommendations(context: {
    userId?: string;
    location?: string;
    preferences?: string[];
    budget?: { min: number; max: number };
  }) {
    try {
      const response = await axios.post(`${this.baseURL}/ai/recommendations`, context);
      return response.data;
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      throw new Error('Failed to get recommendations');
    }
  }

  async analyzeSentiment(text: string) {
    try {
      const response = await axios.post(`${this.baseURL}/ai/sentiment`, { text });
      return response.data;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      throw new Error('Failed to analyze sentiment');
    }
  }
}

export const aiService = new AIService();
