/**
 * Optimized Search Input Component
 * 
 * High-performance search input with debouncing, suggestions,
 * and optimized re-rendering for better UX
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Search, MapPin, Clock, TrendingUp, X, Loader2 } from 'lucide-react';
import { useSearchStore } from '@/store/searchStore';
import { 
  useSearchSuggestions,
  useSearchMetrics
} from '@/store/selectors/searchSelectors';
import { 
  useDebounce, 
  usePerformanceMonitor,
  useThrottle
} from '@/utils/frontendOptimization';
import { Button } from '../ui/Button';
import { cn } from '@/utils/cn';

interface OptimizedSearchInputProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  autoFocus?: boolean;
  showMetrics?: boolean;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'suggestion' | 'trending';
  icon?: React.ComponentType<{ className?: string }>;
  metadata?: string;
}

const OptimizedSearchInput: React.FC<OptimizedSearchInputProps> = ({
  placeholder = 'Search hotels, cities, or destinations...',
  onSearch,
  onFocus,
  onBlur,
  className = '',
  autoFocus = false,
  showMetrics = false
}) => {
  usePerformanceMonitor('OptimizedSearchInput');

  // Store state
  const { 
    query, 
    naturalLanguageQuery,
    loading,
    setQuery, 
    setNaturalLanguageQuery,
    performSearch 
  } = useSearchStore();

  // Search suggestions from store selectors
  const suggestions = useSearchSuggestions();
  const { cacheHitRate, metrics } = useSearchMetrics();

  // Local state
  const [inputValue, setInputValue] = useState(query || naturalLanguageQuery || '');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced values for performance
  const debouncedQuery = useDebounce(inputValue, 300);
  const throttledInputValue = useThrottle(inputValue, 100);

  // Mock suggestions data - would come from API in production
  const mockSuggestions: SearchSuggestion[] = useMemo(() => [
    // Recent searches
    { id: 'recent-1', text: 'Miami Beach Hotels', type: 'recent', icon: Clock },
    { id: 'recent-2', text: 'Tokyo Business Hotels', type: 'recent', icon: Clock },
    
    // Popular destinations
    { id: 'popular-1', text: 'New York, USA', type: 'popular', icon: MapPin, metadata: 'Popular' },
    { id: 'popular-2', text: 'Paris, France', type: 'popular', icon: MapPin, metadata: 'Popular' },
    { id: 'popular-3', text: 'Bali, Indonesia', type: 'popular', icon: MapPin, metadata: 'Popular' },
    
    // Trending searches
    { id: 'trending-1', text: 'Luxury Beach Resorts', type: 'trending', icon: TrendingUp, metadata: '+45%' },
    { id: 'trending-2', text: 'Mountain Spa Retreats', type: 'trending', icon: TrendingUp, metadata: '+32%' },
    
    // API suggestions
    ...suggestions.map((suggestion, index) => ({
      id: `api-${index}`,
      text: suggestion,
      type: 'suggestion' as const,
      icon: Search
    }))
  ], [suggestions]);

  // Filtered suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!throttledInputValue.trim()) return mockSuggestions.slice(0, 8);
    
    return mockSuggestions.filter(suggestion =>
      suggestion.text.toLowerCase().includes(throttledInputValue.toLowerCase())
    ).slice(0, 6);
  }, [throttledInputValue, mockSuggestions]);

  // Handle search execution
  const executeSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    
    try {
      // Update store
      setQuery(searchQuery);
      setNaturalLanguageQuery(searchQuery);
      
      // Perform optimized search with caching
      await performSearch({ 
        query: searchQuery, 
        useCache: true, 
        timeout: 5000 
      });
      
      // Callback
      onSearch?.(searchQuery);
      
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [setQuery, setNaturalLanguageQuery, performSearch, onSearch]);

  // Debounced search effect
  useEffect(() => {
    if (debouncedQuery && debouncedQuery !== query) {
      executeSearch(debouncedQuery);
    }
  }, [debouncedQuery, query, executeSearch]);

  // Input handlers
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedIndex(-1);
    
    // Show suggestions when typing
    if (value.trim().length > 0) {
      setShowSuggestions(true);
    }
  }, []);

  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
    setShowSuggestions(true);
    onFocus?.();
  }, [onFocus]);

  const handleInputBlur = useCallback(() => {
    // Delay blur to allow suggestion clicks
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
      onBlur?.();
    }, 150);
  }, [onBlur]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const selectedSuggestion = filteredSuggestions[selectedIndex];
          setInputValue(selectedSuggestion.text);
          executeSearch(selectedSuggestion.text);
        } else {
          executeSearch(inputValue);
        }
        setShowSuggestions(false);
        break;
        
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [showSuggestions, filteredSuggestions, selectedIndex, inputValue, executeSearch]);

  // Suggestion click handler
  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    setInputValue(suggestion.text);
    executeSearch(suggestion.text);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, [executeSearch]);

  // Clear input
  const handleClear = useCallback(() => {
    setInputValue('');
    setQuery('');
    setNaturalLanguageQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [setQuery, setNaturalLanguageQuery]);

  // Auto focus effect
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className={cn('relative w-full max-w-2xl mx-auto', className)}>
      {/* Search input container */}
      <div className={cn(
        'relative flex items-center bg-white border-2 rounded-xl transition-all duration-300 shadow-lg',
        isFocused 
          ? 'border-luxury-navy shadow-luxury-lg ring-4 ring-luxury-navy/10' 
          : 'border-gray-200 hover:border-gray-300',
        'focus-within:border-luxury-navy focus-within:shadow-luxury-lg'
      )}>
        {/* Search icon */}
        <div className="flex items-center justify-center pl-4 pr-3">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-luxury-navy animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </div>

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'flex-1 py-4 pr-4 text-lg bg-transparent border-0 outline-none',
            'placeholder:text-gray-400 text-gray-900',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          disabled={loading}
        />

        {/* Clear button */}
        {inputValue && (
          <button
            onClick={handleClear}
            className="flex items-center justify-center w-8 h-8 mr-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}

        {/* Search button */}
        <Button
          onClick={() => executeSearch(inputValue)}
          disabled={!inputValue.trim() || isSearching}
          className="mr-2 bg-luxury-navy hover:bg-luxury-navy/90 text-white px-6"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className={cn(
            'absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200',
            'rounded-xl shadow-luxury-lg z-50 max-h-96 overflow-y-auto',
            'animate-in fade-in-0 slide-in-from-top-2 duration-200'
          )}
        >
          <div className="py-2">
            {filteredSuggestions.map((suggestion, index) => {
              const IconComponent = suggestion.icon || Search;
              const isSelected = index === selectedIndex;
              
              return (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors',
                    isSelected && 'bg-luxury-navy/5 text-luxury-navy'
                  )}
                >
                  <IconComponent className={cn(
                    'w-4 h-4 flex-shrink-0',
                    suggestion.type === 'trending' ? 'text-green-500' :
                    suggestion.type === 'recent' ? 'text-gray-400' :
                    suggestion.type === 'popular' ? 'text-blue-500' :
                    'text-gray-400'
                  )} />
                  
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {suggestion.text}
                  </span>
                  
                  {suggestion.metadata && (
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full',
                      suggestion.type === 'trending' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    )}>
                      {suggestion.metadata}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Performance metrics (development only) */}
      {showMetrics && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-gray-500 bg-blue-50 p-2 rounded">
          Cache Hit Rate: {cacheHitRate.toFixed(1)}% | 
          Total Searches: {metrics.totalSearches} |
          Input Debounced: {debouncedQuery !== inputValue ? 'Yes' : 'No'}
        </div>
      )}
    </div>
  );
};

export { OptimizedSearchInput };
export default OptimizedSearchInput;