const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const liteApi = require("liteapi-node-sdk");
const cors = require("cors");
const path = require("path");
const http = require('http');
const WebSocket = require('ws');
require("dotenv").config();
// DeepSeek API integration (replacing OpenAI)

// Enhanced imports for 2025 features
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const NodeCache = require('node-cache');
const validator = require('validator');
const winston = require('winston');
const axios = require('axios');

// Create logs directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Initialize enhanced logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'hotel-booking-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Initialize caching system
const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every minute
  useClones: false
});

// Currency exchange rates cache
const currencyCache = new NodeCache({ stdTTL: 3600 }); // 1 hour TTL for currency rates

// Request tracking for analytics
const searchAnalytics = {
  totalSearches: 0,
  popularDestinations: new Map(),
  searchErrors: 0,
  avgResponseTime: 0
};

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://payment-wrapper.liteapi.travel"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://api.deepseek.com", "https://api.liteapi.travel", "https://api.exchangerate-api.com"],
      frameSrc: ["'self'", "https://payment-wrapper.liteapi.travel"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Compression middleware for better performance
app.use(compression());

// Enhanced CORS configuration
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'http://localhost:3000']
      : "*",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit search requests
  message: {
    error: 'Too many search requests, please slow down.',
    retryAfter: '1 minute'
  }
});

app.use('/api/', apiLimiter);
app.use('/api/search-hotels', searchLimiter);

const prod_apiKey = process.env.PROD_API_KEY;
const sandbox_apiKey = process.env.SAND_API_KEY;

// DeepSeek API Configuration
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

// Debug: Check if API keys are loaded
logger.info("API Keys Status", {
  production: prod_apiKey ? "Loaded" : "Missing",
  sandbox: sandbox_apiKey ? "Loaded" : "Missing",
  sandboxPreview: sandbox_apiKey ? sandbox_apiKey.substring(0, 10) + "..." : "Not found"
});

// Initialize DeepSeek API Client
class DeepSeekClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = DEEPSEEK_API_URL;
    this.model = DEEPSEEK_MODEL;
    this.timeout = 30000; // 30 second timeout
    this.maxRetries = 3;
  }

  async createChatCompletion(params) {
    const requestBody = {
      model: this.model,
      messages: params.messages,
      temperature: params.temperature || 0.7,
      max_tokens: params.max_tokens || 800,
      stream: false
    };

    // Handle DeepSeek-specific parameters
    if (params.response_format?.type === 'json_object') {
      // DeepSeek may handle JSON responses differently
      requestBody.response_format = { type: 'json_object' };
    }

    const response = await axios.post(this.baseURL, requestBody, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'HotelBooking-DeepSeek/1.0'
      },
      timeout: this.timeout
    });

    // Transform DeepSeek response to match OpenAI format
    return {
      choices: [{
        message: {
          content: response.data.choices[0].message.content
        }
      }]
    };
  }
}

let deepseek;
let openai; // Legacy compatibility for existing references

if (process.env.DEEPSEEK_API_KEY) {
  deepseek = new DeepSeekClient(process.env.DEEPSEEK_API_KEY);
  openai = deepseek; // Alias for backward compatibility
  logger.info("DeepSeek Client Initialized Successfully");
} else if (process.env.OPEN_API_KEY) {
  // Fallback to OpenAI if DeepSeek key is not available
  try {
    const { OpenAI } = require('openai');
    openai = new OpenAI({ apiKey: process.env.OPEN_API_KEY });
    logger.info("OpenAI Client Initialized as fallback");
  } catch (err) {
    logger.error("OpenAI module not found, trying with existing OPEN_API_KEY as manual client");
    // Create a minimal OpenAI-compatible client
    openai = {
      chat: {
        completions: {
          create: async (params) => {
            // This is a basic fallback - in production you'd want proper OpenAI integration
            throw new Error("OpenAI module not properly configured");
          }
        }
      }
    };
  }
} else {
  logger.error("CRITICAL: Neither DEEPSEEK_API_KEY nor OPEN_API_KEY found. AI functionality will be disabled.");
}

// Enhanced currency conversion support
const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];

// Currency conversion utility
async function getCurrencyRates(baseCurrency = 'USD') {
  const cacheKey = `currency_rates_${baseCurrency}`;
  let rates = currencyCache.get(cacheKey);
  
  if (!rates) {
    try {
      // Using a free currency API (replace with your preferred service)
      const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`, {
        timeout: 5000
      });
      rates = response.data.rates;
      currencyCache.set(cacheKey, rates);
      logger.info(`Currency rates updated for ${baseCurrency}`);
    } catch (error) {
      logger.error('Failed to fetch currency rates:', error.message);
      // Fallback rates (you might want to store these in a database)
      rates = { USD: 1, EUR: 0.85, GBP: 0.73, JPY: 110, CAD: 1.25, AUD: 1.35, CHF: 0.92, CNY: 6.45 };
    }
  }
  
  return rates;
}

// Price calculation utility with transparent breakdown
function calculatePriceBreakdown(basePrice, currency = 'USD', nights = 1) {
  const taxes = basePrice * 0.12; // 12% tax rate (configurable)
  const serviceFee = Math.max(basePrice * 0.03, 5); // 3% service fee, minimum $5
  const cleaningFee = nights > 3 ? 25 : 15; // Cleaning fee based on nights
  
  const subtotal = basePrice;
  const totalTaxesAndFees = taxes + serviceFee + cleaningFee;
  const total = subtotal + totalTaxesAndFees;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxes: Math.round(taxes * 100) / 100,
    serviceFee: Math.round(serviceFee * 100) / 100,
    cleaningFee,
    totalTaxesAndFees: Math.round(totalTaxesAndFees * 100) / 100,
    total: Math.round(total * 100) / 100,
    currency
  };
}

// Enhanced search analytics tracking
function trackSearchAnalytics(searchParams, responseTime, success = true) {
  searchAnalytics.totalSearches++;
  
  if (searchParams.city) {
    const city = searchParams.city.toLowerCase();
    searchAnalytics.popularDestinations.set(
      city, 
      (searchAnalytics.popularDestinations.get(city) || 0) + 1
    );
  }
  
  if (!success) {
    searchAnalytics.searchErrors++;
  }
  
  // Calculate running average response time
  searchAnalytics.avgResponseTime = 
    (searchAnalytics.avgResponseTime + responseTime) / 2;
}

// Retry mechanism for API calls
async function retryApiCall(apiCall, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      logger.warn(`API call attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
}

// Fallback query parser for when OpenAI is unavailable
function parseFallbackQuery(query) {
  const params = {};
  const queryLower = query.toLowerCase();
  
  // Extract common patterns
  const cityMatch = queryLower.match(/(?:hotels? in|in) ([a-zA-Z\s]+?)(?:\s|$|,)/);
  if (cityMatch) {
    params.city = cityMatch[1].trim();
  }
  
  // Extract dates
  const dateRegex = /(\d{4}-\d{2}-\d{2})/g;
  const dates = query.match(dateRegex);
  if (dates && dates.length >= 2) {
    params.checkin = dates[0];
    params.checkout = dates[1];
  } else if (dates && dates.length === 1) {
    params.checkin = dates[0];
    const checkinDate = new Date(dates[0]);
    checkinDate.setDate(checkinDate.getDate() + 1);
    params.checkout = checkinDate.toISOString().split('T')[0];
  }
  
  // Extract adults
  const adultsMatch = queryLower.match(/(\d+)\s*adults?/);
  if (adultsMatch) {
    params.adults = parseInt(adultsMatch[1]);
  } else {
    params.adults = 2;
  }
  
  // Basic country code inference (expand this as needed)
  const countryMap = {
    'paris': 'FR', 'london': 'GB', 'tokyo': 'JP', 'new york': 'US',
    'berlin': 'DE', 'rome': 'IT', 'madrid': 'ES', 'amsterdam': 'NL',
    'sydney': 'AU', 'toronto': 'CA', 'zurich': 'CH', 'beijing': 'CN'
  };
  
  if (params.city) {
    params.countryCode = countryMap[params.city.toLowerCase()] || 'US';
  }
  
  return params;
}

app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enhanced search hotels endpoint with comprehensive features
app.get("/api/search-hotels", async (req, res) => {
  const startTime = Date.now();
  const clientIP = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  logger.info("Search endpoint hit", { 
    query: req.query, 
    ip: clientIP,
    timestamp: new Date().toISOString()
  });
  
  const { q, environment, currency = 'USD', locale = 'en' } = req.query;

  // Enhanced input validation
  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    const error = "Search query 'q' is required and must be a non-empty string.";
    logger.warn('Invalid search query', { query: q, ip: clientIP });
    trackSearchAnalytics({}, Date.now() - startTime, false);
    return res.status(400).json({ 
      error,
      code: 'INVALID_QUERY',
      suggestions: [
        'Try searching for a specific city like "hotels in Paris"',
        'Include dates like "hotels in Tokyo next week"',
        'Add guest count like "hotels in London for 2 adults"'
      ]
    });
  }
  
  // Validate currency
  if (currency && !SUPPORTED_CURRENCIES.includes(currency.toUpperCase())) {
    return res.status(400).json({
      error: `Unsupported currency: ${currency}`,
      supportedCurrencies: SUPPORTED_CURRENCIES
    });
  }
  
  // Check cache first
  const cacheKey = `search_${Buffer.from(q + environment + currency).toString('base64')}`;
  const cachedResult = cache.get(cacheKey);
  
  if (cachedResult) {
    logger.info('Returning cached search results', { cacheKey });
    trackSearchAnalytics(cachedResult.searchParams, Date.now() - startTime, true);
    return res.json({
      ...cachedResult,
      cached: true,
      cacheTimestamp: new Date().toISOString()
    });
  }

  if (!deepseek) {
    const error = "AI search processing is currently unavailable. Please try again later.";
    logger.error('DeepSeek client not initialized', { query: q });
    trackSearchAnalytics({}, Date.now() - startTime, false);
    return res.status(503).json({ 
      error,
      code: 'AI_SERVICE_UNAVAILABLE',
      fallback: 'Try using specific search terms like city names and dates'
    });
  }

  let funnyResponse = "I'm watching you... always watching...";
  let searchParams = {};

  try {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    // Enhanced DeepSeek prompt optimized for DeepSeek's capabilities
    const completion = await retryApiCall(async () => {
      return await deepseek.createChatCompletion({
        messages: [
          {
            role: "system",
            content: `You are an expert hotel search assistant. Parse user queries accurately and provide helpful responses.

EXTRACT these parameters from the user query:
- city: destination city name
- countryCode: 2-letter ISO code (US, GB, FR, DE, IT, ES, JP, etc.)
- checkin: date in YYYY-MM-DD format (today is ${today})
- checkout: date in YYYY-MM-DD format (default 1 night after checkin)
- adults: number of adults (default 2)
- children: number of children (default 0)
- rooms: number of rooms (default 1)
- priceRange: budget level ("budget", "mid-range", "luxury")
- preferences: array of preferences (pet-friendly, business, family, romantic, etc.)

GENERATE a helpful response that:
- Acknowledges their search intent
- Adds friendly personality
- Provides destination context
- Mentions assumptions made

PROVIDE 2-3 alternative search suggestions.

Respond in JSON format with keys: searchParams, funnyResponse, suggestions, confidence (0-100).`
          },
          {
            role: "user",
            content: q
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 800
      });
    });

    const aiResult = JSON.parse(completion.choices[0].message.content);
    funnyResponse = aiResult.funnyResponse || "Let me search for the perfect hotel for you!";
    searchParams = aiResult.searchParams || {};
    const searchSuggestions = aiResult.suggestions || [];
    const confidence = aiResult.confidence || 85;
    
    logger.info("DeepSeek parsing completed", { 
      searchParams, 
      confidence, 
      originalQuery: q 
    });

    // Enhanced validation with specific error messages
    const missingParams = [];
    if (!searchParams.city) missingParams.push('destination city');
    if (!searchParams.countryCode) missingParams.push('country');
    if (!searchParams.checkin) missingParams.push('check-in date');
    if (!searchParams.checkout) missingParams.push('check-out date');
    if (!searchParams.adults) searchParams.adults = 2; // Set default
    
    if (missingParams.length > 0) {
      logger.warn("Incomplete search parameters", { searchParams, missingParams, query: q });
      trackSearchAnalytics(searchParams, Date.now() - startTime, false);
      
      return res.status(400).json({ 
        funnyResponse, 
        error: `I need more information about: ${missingParams.join(', ')}`,
        code: 'INCOMPLETE_SEARCH_PARAMS',
        missingParams,
        suggestions: searchSuggestions,
        hotelData: [],
        searchParams: searchParams // Include partial params for frontend reference
      });
    }
    
    // Validate dates
    const checkinDate = new Date(searchParams.checkin);
    const checkoutDate = new Date(searchParams.checkout);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    if (checkinDate < todayDate) {
      return res.status(400).json({
        error: 'Check-in date cannot be in the past',
        code: 'INVALID_CHECKIN_DATE',
        funnyResponse: 'Time travel booking is not available yet! Please choose a future date.',
        hotelData: []
      });
    }
    
    if (checkoutDate <= checkinDate) {
      return res.status(400).json({
        error: 'Check-out date must be after check-in date',
        code: 'INVALID_CHECKOUT_DATE', 
        funnyResponse: 'You need at least one night to enjoy your stay!',
        hotelData: []
      });
    }

  } catch (error) {
    logger.error("DeepSeek API error", { error: error.message, query: q });
    trackSearchAnalytics({}, Date.now() - startTime, false);
    
    // Enhanced error handling for DeepSeek-specific issues
    if (error.response?.status === 401) {
      logger.error('DeepSeek API authentication failed');
      return res.status(503).json({ 
        funnyResponse: "Authentication issue with AI service. Please contact support.", 
        error: "AI service authentication failed",
        code: 'AI_AUTH_ERROR',
        hotelData: [] 
      });
    }
    
    if (error.response?.status === 429) {
      logger.error('DeepSeek API rate limit exceeded');
      return res.status(503).json({ 
        funnyResponse: "Too many requests to AI service. Please try again in a moment.", 
        error: "AI service rate limit exceeded",
        code: 'AI_RATE_LIMIT',
        hotelData: [] 
      });
    }
    
    // Provide fallback parsing for common patterns
    const fallbackParams = parseFallbackQuery(q);
    
    if (fallbackParams.city && fallbackParams.countryCode) {
      logger.info('Using fallback query parsing', { fallbackParams });
      searchParams = fallbackParams;
      funnyResponse = "My AI assistant is taking a coffee break, but I can still help you search!";
    } else {
      return res.status(503).json({ 
        funnyResponse: "Our AI search is temporarily unavailable. Please try a more specific search like 'hotels in Paris December 15-17'.", 
        error: "AI processing service temporarily unavailable",
        code: 'AI_SERVICE_ERROR',
        fallbackSuggestions: [
          'Use format: "hotels in [city] [dates]"',
          'Include country if city name is ambiguous',
          'Specify number of guests if not 2 adults'
        ],
        hotelData: [] 
      });
    }
  }

  // Proceed with LiteAPI call using parameters from DeepSeek
  const liteAPIKey = environment === "sandbox" ? sandbox_apiKey : prod_apiKey;
  if (!liteAPIKey) {
    logger.error(`LiteAPI key missing for environment: ${environment}`);
    trackSearchAnalytics(searchParams, Date.now() - startTime, false);
    return res.status(500).json({ 
      funnyResponse, 
      error: `Service configuration error for ${environment} environment`,
      code: 'API_KEY_MISSING',
      hotelData: [] 
    });
  }
  
  const sdk = liteApi(liteAPIKey);
  
  // Calculate nights for price breakdown
  const nights = Math.ceil((new Date(searchParams.checkout) - new Date(searchParams.checkin)) / (1000 * 60 * 60 * 24));

  try {
    // Enhanced hotel search with retry mechanism
    const hotelsResponse = await retryApiCall(async () => {
      return await sdk.getHotels(searchParams.countryCode, searchParams.city, 0, 20); // Get top 20 hotels for better selection
    });
    
    const hotelList = hotelsResponse?.data;
    logger.info('Hotels fetched from LiteAPI', { 
      count: hotelList?.length || 0, 
      city: searchParams.city,
      country: searchParams.countryCode 
    });

    if (!hotelList || !Array.isArray(hotelList) || hotelList.length === 0) {
      logger.warn('No hotels found', { 
        city: searchParams.city, 
        countryCode: searchParams.countryCode 
      });
      trackSearchAnalytics(searchParams, Date.now() - startTime, false);
      
      return res.json({ 
        funnyResponse: `No hotels found in ${searchParams.city}. Either it's a very exclusive destination or we need to expand our search!`,
        hotelData: { rates: [] }, 
        message: "No hotels available for this location and dates",
        code: 'NO_HOTELS_FOUND',
        suggestions: [
          'Try a nearby major city',
          'Check if the city name is spelled correctly', 
          'Consider different dates',
          'Try a different country code'
        ],
        searchParams
      });
    }

    const hotelIds = hotelList.map((hotel) => hotel.id);
    
    // Enhanced rates request with better configuration
    const occupancies = [
      { 
        adults: parseInt(searchParams.adults, 10) || 2,
        children: parseInt(searchParams.children, 10) || 0
      }
    ];
    
    // Add children ages if specified
    if (searchParams.childrenAges && searchParams.childrenAges.length > 0) {
      occupancies[0].childrenAges = searchParams.childrenAges;
    }
    
    const ratesData = await retryApiCall(async () => {
      return await sdk.getFullRates({
        hotelIds: hotelIds,
        occupancies: occupancies,
        currency: currency.toUpperCase(),
        guestNationality: searchParams.guestNationality || "US",
        checkin: searchParams.checkin,
        checkout: searchParams.checkout,
      });
    });
    
    const rates = ratesData?.data || [];
    
    // Enhanced rate processing with price breakdown and currency conversion
    const currencyRates = await getCurrencyRates('USD');
    const targetCurrencyRate = currencyRates[currency.toUpperCase()] || 1;
    
    const enhancedRates = rates.map((rate) => {
      const hotel = hotelList.find((hotel) => hotel.id === rate.hotelId);
      
      // Process room types with enhanced pricing
      if (rate.roomTypes) {
        rate.roomTypes = rate.roomTypes.map(roomType => {
          if (roomType.rates) {
            roomType.rates = roomType.rates.map(roomRate => {
              const basePrice = roomRate.retailRate?.total?.[0]?.amount || 0;
              const convertedPrice = basePrice * targetCurrencyRate;
              
              // Calculate transparent price breakdown
              const priceBreakdown = calculatePriceBreakdown(convertedPrice, currency.toUpperCase(), nights);
              
              return {
                ...roomRate,
                originalPrice: basePrice,
                convertedPrice: Math.round(convertedPrice * 100) / 100,
                priceBreakdown,
                currency: currency.toUpperCase(),
                averageNightlyRate: Math.round((convertedPrice / nights) * 100) / 100,
                totalNights: nights,
                lastUpdated: new Date().toISOString()
              };
            });
          }
          return roomType;
        });
      }
      
      return {
        ...rate,
        hotel: {
          ...hotel,
          distanceFromCity: hotel.distanceFromCity || 'Unknown',
          starRating: hotel.starRating || 'Not rated',
          amenities: hotel.amenities || [],
          lastUpdated: new Date().toISOString()
        },
        searchParams,
        responseTime: Date.now() - startTime
      };
    });
    
    // Sort by price (lowest first) and rating
    enhancedRates.sort((a, b) => {
      const aPrice = a.roomTypes?.[0]?.rates?.[0]?.convertedPrice || Infinity;
      const bPrice = b.roomTypes?.[0]?.rates?.[0]?.convertedPrice || Infinity;
      return aPrice - bPrice;
    });
    
    const response = {
      funnyResponse,
      hotelData: { 
        rates: enhancedRates,
        totalResults: enhancedRates.length,
        searchParams,
        currency: currency.toUpperCase(),
        currencyRate: targetCurrencyRate,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      },
      analytics: {
        totalSearches: searchAnalytics.totalSearches,
        avgResponseTime: Math.round(searchAnalytics.avgResponseTime)
      }
    };
    
    // Cache the successful result
    cache.set(cacheKey, response, 300); // Cache for 5 minutes
    
    trackSearchAnalytics(searchParams, Date.now() - startTime, true);
    logger.info('Search completed successfully', { 
      resultsCount: enhancedRates.length,
      responseTime: Date.now() - startTime,
      cached: false
    });
    
    res.json(response);
  } catch (error) {
    logger.error("Error searching for hotels with LiteAPI", { error: error.message, stack: error.stack });
    trackSearchAnalytics(searchParams, Date.now() - startTime, false);
    res.status(500).json({ 
      funnyResponse, 
      error: "Error fetching hotel data. Please try again later.",
      code: 'LITEAPI_ERROR',
      hotelData: [] 
    });
  }
});

// New endpoint for price breakdown details
app.get("/api/price-breakdown", async (req, res) => {
  const { basePrice, currency = 'USD', nights = 1 } = req.query;
  
  if (!basePrice || isNaN(parseFloat(basePrice))) {
    return res.status(400).json({
      error: "Valid base price is required",
      code: 'INVALID_PRICE'
    });
  }
  
  try {
    const price = parseFloat(basePrice);
    const breakdown = calculatePriceBreakdown(price, currency.toUpperCase(), parseInt(nights));
    
    // Get currency rates for conversion
    const currencyRates = await getCurrencyRates('USD');
    const availableCurrencies = Object.keys(currencyRates).filter(curr => 
      SUPPORTED_CURRENCIES.includes(curr)
    );
    
    res.json({
      breakdown,
      availableCurrencies,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Price breakdown error:', error.message);
    res.status(500).json({
      error: 'Error calculating price breakdown',
      code: 'CALCULATION_ERROR'
    });
  }
});

// New endpoint for search suggestions
app.get("/api/search-suggestions", async (req, res) => {
  const { query, limit = 5 } = req.query;
  
  if (!query || query.length < 2) {
    return res.status(400).json({
      error: "Query must be at least 2 characters long",
      suggestions: []
    });
  }
  
  try {
    // Get popular destinations from analytics
    const popularCities = Array.from(searchAnalytics.popularDestinations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, parseInt(limit))
      .map(([city, count]) => ({
        city: city.charAt(0).toUpperCase() + city.slice(1),
        searchCount: count,
        suggestion: `Hotels in ${city.charAt(0).toUpperCase() + city.slice(1)}`
      }));
    
    // Add some default suggestions if we don't have enough data
    const defaultSuggestions = [
      { city: 'Paris', suggestion: 'Hotels in Paris for weekend getaway' },
      { city: 'London', suggestion: 'Hotels in London for business trip' },
      { city: 'Tokyo', suggestion: 'Hotels in Tokyo for 2 adults next week' },
      { city: 'New York', suggestion: 'Budget hotels in New York' },
      { city: 'Rome', suggestion: 'Luxury hotels in Rome for honeymoon' }
    ];
    
    const allSuggestions = [...popularCities, ...defaultSuggestions]
      .filter((item, index, self) => 
        index === self.findIndex(s => s.city === item.city)
      )
      .slice(0, parseInt(limit));
    
    res.json({
      suggestions: allSuggestions,
      totalSearches: searchAnalytics.totalSearches,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Search suggestions error:', error.message);
    res.status(500).json({
      error: 'Error generating suggestions',
      suggestions: []
    });
  }
});

// Enhanced search rates endpoint
app.get("/search-rates", async (req, res) => {
  const startTime = Date.now();
  logger.info("Rate endpoint hit with params:", req.query);
  
  const { checkin, checkout, adults, hotelId, environment, currency = 'USD' } = req.query;
  
  // Enhanced validation
  if (!checkin || !checkout || !adults || !hotelId || !environment) {
    return res.status(400).json({
      error: 'Missing required parameters',
      required: ['checkin', 'checkout', 'adults', 'hotelId', 'environment'],
      provided: Object.keys(req.query)
    });
  }
  
  // Validate dates
  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);
  
  if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
    return res.status(400).json({
      error: 'Invalid date format. Use YYYY-MM-DD format.'
    });
  }
  
  if (checkoutDate <= checkinDate) {
    return res.status(400).json({
      error: 'Check-out date must be after check-in date'
    });
  }
  
  const apiKey = environment === "sandbox" ? sandbox_apiKey : prod_apiKey;
  if (!apiKey) {
    logger.error(`API key missing for environment: ${environment}`);
    return res.status(500).json({
      error: `API key not configured for ${environment} environment`
    });
  }
  
  // Check cache
  const cacheKey = `rates_${hotelId}_${checkin}_${checkout}_${adults}_${currency}`;
  const cachedRates = cache.get(cacheKey);
  
  if (cachedRates) {
    logger.info('Returning cached rates', { hotelId, cacheKey });
    return res.json({
      ...cachedRates,
      cached: true,
      responseTime: Date.now() - startTime
    });
  }
  
  const sdk = liteApi(apiKey);

  try {
    // Fetch rates and hotel details in parallel
    const [ratesResponse, hotelsResponse] = await Promise.all([
      retryApiCall(async () => {
        return await sdk.getFullRates({
          hotelIds: [hotelId],
          occupancies: [{ adults: parseInt(adults, 10) }],
          currency: currency.toUpperCase(),
          guestNationality: "US",
          checkin: checkin,
          checkout: checkout,
        });
      }),
      retryApiCall(async () => {
        return await sdk.getHotelDetails(hotelId);
      })
    ]);
    
    const rates = ratesResponse?.data;
    const hotelInfo = hotelsResponse?.data;
    
    logger.info('API responses received', { 
      hotelId, 
      ratesCount: rates?.length || 0,
      hotelInfoExists: !!hotelInfo
    });

    if (!rates || !Array.isArray(rates)) {
      logger.warn("No rates data found", { hotelId, rates });
      return res.json({ 
        hotelInfo, 
        rateInfo: [],
        message: 'No rates available for selected dates',
        responseTime: Date.now() - startTime
      });
    }

    // Calculate nights for enhanced pricing
    const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    
    // Get currency rates for conversion
    const currencyRates = await getCurrencyRates('USD');
    const targetCurrencyRate = currencyRates[currency.toUpperCase()] || 1;

    // Enhanced rate processing
    const rateInfo = rates.flatMap((hotel) =>
      hotel.roomTypes.flatMap((roomType) => {
        const boardTypes = ["RO", "BI"];

        return boardTypes
          .map((boardType) => {
            const filteredRates = roomType.rates.filter((rate) => rate.boardType === boardType);

            const sortedRates = filteredRates.sort((a, b) => {
              if (
                a.cancellationPolicies.refundableTag === "RFN" &&
                b.cancellationPolicies.refundableTag !== "RFN"
              ) {
                return -1;
              } else if (
                b.cancellationPolicies.refundableTag === "RFN" &&
                a.cancellationPolicies.refundableTag !== "RFN"
              ) {
                return 1;
              }
              return 0;
            });

            if (sortedRates.length > 0) {
              const rate = sortedRates[0];
              const basePrice = rate.retailRate.total[0].amount;
              const convertedPrice = basePrice * targetCurrencyRate;
              const priceBreakdown = calculatePriceBreakdown(convertedPrice, currency.toUpperCase(), nights);
              
              return {
                rateName: rate.name,
                offerId: roomType.offerId,
                board: rate.boardName,
                refundableTag: rate.cancellationPolicies.refundableTag,
                retailRate: Math.round(convertedPrice * 100) / 100,
                originalRate: rate.retailRate.suggestedSellingPrice[0].amount * targetCurrencyRate,
                priceBreakdown,
                currency: currency.toUpperCase(),
                averageNightlyRate: Math.round((convertedPrice / nights) * 100) / 100,
                totalNights: nights,
                cancellationPolicy: rate.cancellationPolicies,
                lastUpdated: new Date().toISOString()
              };
            }
            return null;
          })
          .filter((rate) => rate !== null);
      })
    );
    
    const result = {
      hotelInfo: {
        ...hotelInfo,
        lastUpdated: new Date().toISOString()
      },
      rateInfo,
      searchParams: { checkin, checkout, adults, hotelId },
      currency: currency.toUpperCase(),
      currencyRate: targetCurrencyRate,
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
    
    // Cache the result
    cache.set(cacheKey, result, 300); // Cache for 5 minutes
    
    res.json(result);
  } catch (error) {
    logger.error("Error fetching rates", { error: error.message, hotelId });
    res.status(500).json({ 
      error: "Error fetching hotel rates. Please try again later.",
      code: 'RATES_FETCH_ERROR',
      responseTime: Date.now() - startTime
    });
  }
});

// Enhanced prebook endpoint
app.post("/prebook", async (req, res) => {
  const startTime = Date.now();
  logger.info('Prebook request received', { body: req.body });
  
  const { rateId, environment, voucherCode } = req.body;
  
  if (!rateId || !environment) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['rateId', 'environment'],
      provided: Object.keys(req.body)
    });
  }
  
  const apiKey = environment === "sandbox" ? sandbox_apiKey : prod_apiKey;
  if (!apiKey) {
    logger.error(`API key missing for environment: ${environment}`);
    return res.status(500).json({
      error: `API key not configured for ${environment} environment`
    });
  }
  
  const sdk = liteApi(apiKey);
  
  const bodyData = {
    offerId: rateId,
    usePaymentSdk: true,
  };

  if (voucherCode) {
    bodyData.voucherCode = voucherCode;
  }

  try {
    const response = await retryApiCall(async () => {
      return await sdk.preBook(bodyData);
    });
    
    logger.info('Prebook successful', { 
      offerId: rateId, 
      responseTime: Date.now() - startTime 
    });
    
    res.json({ 
      success: response,
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error("Prebook error", { 
      error: error.message, 
      offerId: rateId,
      environment 
    });
    
    res.status(500).json({ 
      error: "Error processing prebook request. Please try again later.",
      code: 'PREBOOK_ERROR',
      responseTime: Date.now() - startTime
    });
  }
});

// Enhanced booking endpoint
app.get("/book", async (req, res) => {
  const { prebookId, guestFirstName, guestLastName, guestEmail, transactionId, environment } = req.query;

  if (!prebookId || !guestFirstName || !guestLastName || !guestEmail || !transactionId || !environment) {
    logger.error('Missing required booking parameters:', req.query);
    return res.status(400).send(renderErrorPage('Missing required booking parameters. Please try again.'));
  }

  // Enhanced email validation
  if (!validator.isEmail(guestEmail)) {
    logger.error('Invalid email format:', guestEmail);
    return res.status(400).send(renderErrorPage('Invalid email address format.'));
  }

  const apiKey = environment === 'sandbox' ? process.env.SAND_API_KEY : process.env.PROD_API_KEY;
  if (!apiKey) {
    logger.error(`API key for environment '${environment}' is not configured.`);
    return res.status(500).send(renderErrorPage('Server configuration error. Please contact support.'));
  }

  const sdk = liteApi(apiKey);

  const bookingPayload = {
    prebookId: prebookId,
    guestInfo: {
      firstName: validator.escape(guestFirstName),
      lastName: validator.escape(guestLastName),
      email: guestEmail,
    },
    transactionId: transactionId,
  };

  try {
    logger.info(`Attempting booking`, { 
      environment, 
      prebookId, 
      transactionId,
      guestEmail 
    });
    
    const bookingResponse = await retryApiCall(async () => {
      return await sdk.book(bookingPayload);
    });

    if (!bookingResponse || bookingResponse.error || !bookingResponse.data) {
      const liteApiError = bookingResponse?.error?.message || 'Unknown error from LiteAPI during booking.';
      logger.error('LiteAPI booking failed', { 
        error: liteApiError, 
        response: bookingResponse 
      });
      return res.status(400).send(renderErrorPage(`Booking failed: ${liteApiError}`, JSON.stringify(bookingResponse?.error, null, 2)));
    }

    logger.info('Booking successful', { 
      bookingId: bookingResponse.data.bookingId,
      guestEmail 
    });
    
    res.send(renderConfirmationPage(bookingResponse.data));

  } catch (error) {
    logger.error('Booking process failed', { 
      error: error.message, 
      stack: error.stack,
      prebookId 
    });
    
    const serverErrorMessage = error.message || "Internal server error during booking.";
    const serverErrorDetails = error.response?.data || error.details || "No additional details.";
    
    res.status(500).send(renderErrorPage(serverErrorMessage, JSON.stringify(serverErrorDetails, null, 2)));
  }
});

// New analytics endpoint
app.get("/api/analytics", (req, res) => {
  const topDestinations = Array.from(searchAnalytics.popularDestinations.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([city, count]) => ({
      city: city.charAt(0).toUpperCase() + city.slice(1),
      searches: count
    }));

  res.json({
    totalSearches: searchAnalytics.totalSearches,
    searchErrors: searchAnalytics.searchErrors,
    avgResponseTime: Math.round(searchAnalytics.avgResponseTime),
    successRate: searchAnalytics.totalSearches > 0 
      ? Math.round(((searchAnalytics.totalSearches - searchAnalytics.searchErrors) / searchAnalytics.totalSearches) * 100)
      : 100,
    topDestinations,
    cacheStats: {
      keys: cache.keys().length,
      hits: cache.getStats().hits || 0,
      misses: cache.getStats().misses || 0
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      deepseek: !!deepseek,
      liteapi_sandbox: !!sandbox_apiKey,
      liteapi_production: !!prod_apiKey,
      cache: cache.keys().length >= 0,
      database: true // Placeholder for when you add a database
    },
    performance: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      avgResponseTime: Math.round(searchAnalytics.avgResponseTime)
    }
  };
  
  // Check if critical services are down
  const criticalServices = ['deepseek', 'liteapi_sandbox'];
  const downServices = criticalServices.filter(service => !health.services[service]);
  
  if (downServices.length > 0) {
    health.status = 'degraded';
    health.issues = downServices.map(service => `${service} unavailable`);
  }
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Serve the client-side application
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

app.use(express.static(path.join(__dirname, "../client")));

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', { 
    error: error.message, 
    stack: error.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// Create HTTP server with WebSocket support for real-time features
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// WebSocket connection for real-time updates
wss.on('connection', (ws, req) => {
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  logger.info('WebSocket connection established', { ip: clientIP });
  
  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to hotel booking service',
    timestamp: new Date().toISOString()
  }));
  
  // Send periodic updates (every 30 seconds)
  const updateInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'analytics_update',
        data: {
          totalSearches: searchAnalytics.totalSearches,
          avgResponseTime: Math.round(searchAnalytics.avgResponseTime)
        },
        timestamp: new Date().toISOString()
      }));
    }
  }, 30000);
  
  ws.on('close', () => {
    clearInterval(updateInterval);
    logger.info('WebSocket connection closed', { ip: clientIP });
  });
  
  ws.on('error', (error) => {
    logger.error('WebSocket error', { error: error.message, ip: clientIP });
  });
});

// Helper functions for rendering HTML responses
function renderErrorPage(errorMessage, errorDetails = '') {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Error</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          margin: 0; 
          padding: 40px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          overflow: hidden;
        }
        .header {
          background: #dc3545;
          color: white;
          padding: 30px;
          text-align: center;
        }
        .content {
          padding: 30px;
        }
        .error { 
          color: #721c24; 
          margin-bottom: 20px;
          font-size: 16px;
          line-height: 1.5;
        }
        .details { 
          background: #f8f9fa; 
          padding: 15px; 
          margin-top: 20px; 
          border-radius: 6px; 
          font-size: 14px;
          border-left: 4px solid #6c757d;
        }
        .btn { 
          background: linear-gradient(45deg, #007bff, #0056b3);
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          display: inline-block; 
          margin-top: 20px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,123,255,0.3);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🚫 Booking Error</h2>
        </div>
        <div class="content">
          <div class="error">
            <p>${errorMessage}</p>
          </div>
          ${errorDetails ? `<div class="details"><strong>Technical Details:</strong><br><pre>${errorDetails}</pre></div>` : ''}
          <a href="/" class="btn">← Back to Search</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function renderConfirmationPage(bookingData) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmed</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          margin: 0; 
          padding: 40px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .container {
          max-width: 700px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(45deg, #28a745, #20c997);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .content {
          padding: 30px;
        }
        .success { 
          color: #155724; 
          margin-bottom: 25px;
        }
        .details { 
          background: #f8f9fa; 
          padding: 25px; 
          margin: 20px 0; 
          border-radius: 8px;
          border-left: 4px solid #28a745;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        .label {
          font-weight: 600;
          color: #495057;
        }
        .value {
          color: #212529;
        }
        .btn { 
          background: linear-gradient(45deg, #28a745, #20c997);
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          display: inline-block; 
          margin-top: 20px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(40,167,69,0.3);
        }
        .booking-id {
          font-size: 18px;
          font-weight: bold;
          color: #28a745;
          text-align: center;
          padding: 15px;
          background: #d4edda;
          border-radius: 6px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🎉 Booking Confirmed!</h2>
          <p>Your reservation has been successfully processed</p>
        </div>
        <div class="content">
          <div class="booking-id">
            Booking ID: ${bookingData.bookingId || 'N/A'}
          </div>
          
          <div class="details">
            <h3 style="margin-top: 0; color: #28a745;">Reservation Details</h3>
            
            <div class="detail-row">
              <span class="label">Status:</span>
              <span class="value">${bookingData.status || 'Confirmed'}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Hotel:</span>
              <span class="value">${bookingData.hotel?.name || 'N/A'}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Check-in:</span>
              <span class="value">${bookingData.checkin ? new Date(bookingData.checkin).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'N/A'}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Check-out:</span>
              <span class="value">${bookingData.checkout ? new Date(bookingData.checkout).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'N/A'}</span>
            </div>
            
            ${bookingData.bookedRooms?.[0] ? `
              <div class="detail-row">
                <span class="label">Guest:</span>
                <span class="value">${bookingData.bookedRooms[0].firstName} ${bookingData.bookedRooms[0].lastName}</span>
              </div>
              
              <div class="detail-row">
                <span class="label">Room Type:</span>
                <span class="value">${bookingData.bookedRooms[0].roomType?.name || 'N/A'}</span>
              </div>
            ` : ''}
            
            <div class="detail-row">
              <span class="label">Confirmation Date:</span>
              <span class="value">${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="/" class="btn">Book Another Hotel</a>
            <div style="margin-top: 20px; font-size: 14px; color: #6c757d;">
              Please save your booking ID for future reference
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`🚀 Enhanced Hotel Booking Server started on port ${PORT}`);
  logger.info(`📊 WebSocket server enabled for real-time features`);
  
  if (!process.env.DEEPSEEK_API_KEY) {
    logger.warn('⚠️  DEEPSEEK_API_KEY is not set. DeepSeek AI features will not work.');
  }
  if (!sandbox_apiKey) {
    logger.warn('⚠️  SAND_API_KEY is not set. LiteAPI sandbox features may not work.');
  }
  if (!prod_apiKey) {
    logger.warn('⚠️  PROD_API_KEY is not set. LiteAPI production features may not work.');
  }
  
  logger.info('🔧 Enhanced features enabled:');
  logger.info('   ✅ Transparent pricing with detailed breakdowns');
  logger.info('   ✅ Multi-currency support with real-time conversion');
  logger.info('   ✅ Advanced caching and performance optimization');
  logger.info('   ✅ Enhanced error handling and retry mechanisms');
  logger.info('   ✅ Real-time WebSocket updates');
  logger.info('   ✅ Comprehensive logging and analytics');
  logger.info('   ✅ Security enhancements and rate limiting');
  logger.info('   ✅ Search suggestions and fallback parsing');
});