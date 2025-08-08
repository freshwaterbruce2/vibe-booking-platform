/**
 * Service Worker for Hotel Booking App - 2025
 * Enhanced offline functionality and PWA features
 */

const CACHE_NAME = 'hotel-booking-2025-v1';
const STATIC_CACHE = 'hotel-booking-static-v1';
const DYNAMIC_CACHE = 'hotel-booking-dynamic-v1';

// Static resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index-2025.html',
  '/styles-2025.css',
  '/app-2025.js',
  '/passion-data.js',
  '/passion-ui.js',
  '/payment-utils.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Dynamic resources to cache on demand
const DYNAMIC_CACHE_PATTERNS = [
  /\/api\/search-hotels/,
  /\/search-rates/,
  /\.(jpg|jpeg|png|webp|svg|gif)$/i
];

// Resources that should always be fetched from network
const NETWORK_FIRST_PATTERNS = [
  /\/api\/search-hotels/,
  /\/prebook/,
  /\/book/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    handleFetchRequest(request, url)
  );
});

// Handle different types of requests with appropriate caching strategies
async function handleFetchRequest(request, url) {
  // Network first for critical API calls
  if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return networkFirst(request);
  }
  
  // Cache first for static assets
  if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset))) {
    return cacheFirst(request);
  }
  
  // Stale while revalidate for dynamic content
  if (DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return staleWhileRevalidate(request);
  }
  
  // Default: network first with cache fallback
  return networkFirst(request);
}

// Cache first strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache first failed:', error);
    return createOfflineResponse(request);
  }
}

// Network first with cache fallback
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses for dynamic content
      if (DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache for:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return createOfflineResponse(request);
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Create offline response for different resource types
function createOfflineResponse(request) {
  const url = new URL(request.url);
  
  // API endpoints
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This feature requires an internet connection',
        cached: false
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Images
  if (request.destination === 'image') {
    return new Response(
      createOfflineImageSVG(),
      {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml' }
      }
    );
  }
  
  // HTML pages
  if (request.destination === 'document') {
    return caches.match('/index-2025.html');
  }
  
  // Default offline response
  return new Response(
    'Offline - This content is not available',
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    }
  );
}

// Create offline image placeholder
function createOfflineImageSVG() {
  return `
    <svg width="400" height="240" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="240" fill="#f3f4f6"/>
      <text x="200" y="120" text-anchor="middle" fill="#9ca3af" font-family="Inter, sans-serif" font-size="16">
        Image unavailable offline
      </text>
    </svg>
  `;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'hotel-search') {
    event.waitUntil(syncHotelSearch());
  } else if (event.tag === 'hotel-booking') {
    event.waitUntil(syncHotelBooking());
  }
});

// Sync hotel search when back online
async function syncHotelSearch() {
  try {
    const pendingSearches = await getStoredData('pending_searches');
    
    for (const search of pendingSearches) {
      try {
        const response = await fetch('/api/search-hotels', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          // Remove from pending searches
          await removeStoredData('pending_searches', search.id);
          
          // Notify clients about successful sync
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'SEARCH_SYNCED',
              data: search
            });
          });
        }
      } catch (error) {
        console.error('Failed to sync search:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Sync hotel booking when back online
async function syncHotelBooking() {
  try {
    const pendingBookings = await getStoredData('pending_bookings');
    
    for (const booking of pendingBookings) {
      try {
        const response = await fetch('/prebook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking.data)
        });
        
        if (response.ok) {
          await removeStoredData('pending_bookings', booking.id);
          
          // Notify clients
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'BOOKING_SYNCED',
              data: booking
            });
          });
        }
      } catch (error) {
        console.error('Failed to sync booking:', error);
      }
    }
  } catch (error) {
    console.error('Background booking sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Hotel booking update',
      icon: '/images/icon-192.png',
      badge: '/images/badge-72.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [
        {
          action: 'view',
          title: 'View Details',
          icon: '/images/view-icon.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/images/dismiss-icon.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Hotel Booking', options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/index-2025.html')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_HOTEL_DATA':
      cacheHotelData(data);
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
      
    case 'UPDATE_CACHE':
      updateCacheStrategy(data);
      break;
  }
});

// Cache hotel data for offline access
async function cacheHotelData(hotelData) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const response = new Response(JSON.stringify(hotelData), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put('/api/cached-hotels', response);
    console.log('Hotel data cached for offline access');
  } catch (error) {
    console.error('Failed to cache hotel data:', error);
  }
}

// Clear all caches
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('All caches cleared');
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
}

// Update cache strategy dynamically
function updateCacheStrategy(strategy) {
  // Update caching behavior based on user preferences or network conditions
  console.log('Cache strategy updated:', strategy);
}

// Utility functions for IndexedDB operations
async function getStoredData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HotelBookingDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
      
      getAllRequest.onerror = () => {
        reject(getAllRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function removeStoredData(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HotelBookingDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => {
        resolve();
      };
      
      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Network status monitoring
self.addEventListener('online', () => {
  console.log('Device is back online');
  // Trigger background sync
  self.registration.sync.register('hotel-search');
  self.registration.sync.register('hotel-booking');
});

self.addEventListener('offline', () => {
  console.log('Device is offline');
});

console.log('Service Worker loaded and ready');