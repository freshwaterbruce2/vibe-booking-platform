import { u as b, j as e, B as l, c as v } from './index-BipxYy_H.js';
import j from './SearchResults-CCSWTb5_.js';
import { r as k } from './vendor-VgjaNQN2.js';
import { F as f, E as N, X as w, n as R } from './ui-c8TFxX-w.js';
import './UrgencyIndicator-DsGkK3UM.js';
const A = ({ isVisible: x = !0, onToggleVisibility: n, className: m = '' }) => {
  const { filters: s, setFilters: o } = b(),
    [h, d] = k.useState('relevance'),
    t = (r, a) => {
      o({ [r]: a });
    },
    p = (r) => {
      const a = s.amenities,
        i = a.includes(r) ? a.filter((c) => c !== r) : [...a, r];
      t('amenities', i);
    },
    u = (r) => {
      const a = s.starRating,
        i = a.includes(r) ? a.filter((c) => c !== r) : [...a, r];
      t('starRating', i);
    },
    y = () => {
      (o({
        priceRange: [0, 1e3],
        starRating: [],
        amenities: [],
        location: {},
        accessibility: { wheelchairAccessible: !1, hearingAccessible: !1, visualAccessible: !1 },
        sustainability: !1,
        passions: [],
      }),
        d('relevance'));
    };
  if (!x)
    return e.jsxs(l, {
      onClick: n,
      variant: 'outline',
      className: 'flex items-center gap-2',
      children: [e.jsx(f, { className: 'w-4 h-4' }), 'Show Filters'],
    });
  const g = [
    s.starRating.length > 0,
    s.amenities.length > 0,
    s.priceRange[0] > 0 || s.priceRange[1] < 1e3,
    s.passions.length > 0,
    s.sustainability,
    Object.values(s.accessibility).some(Boolean),
  ].filter(Boolean).length;
  return e.jsxs('div', {
    className: v(
      'bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6',
      m,
    ),
    children: [
      e.jsxs('div', {
        className: 'flex justify-between items-center mb-6',
        children: [
          e.jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              e.jsx(N, { className: 'w-5 h-5 text-gray-600 dark:text-gray-400' }),
              e.jsx('h3', {
                className: 'text-lg font-semibold text-gray-900 dark:text-white',
                children: 'Filters',
              }),
              g > 0 &&
                e.jsx('span', {
                  className:
                    'bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full',
                  children: g,
                }),
            ],
          }),
          e.jsxs('div', {
            className: 'flex gap-2',
            children: [
              e.jsx(l, {
                onClick: y,
                variant: 'ghost',
                size: 'sm',
                className: 'text-primary-600 hover:text-primary-800',
                children: 'Clear All',
              }),
              n &&
                e.jsx(l, {
                  onClick: n,
                  variant: 'ghost',
                  size: 'icon',
                  className: 'text-gray-500 hover:text-gray-700',
                  children: e.jsx(w, { className: 'w-4 h-4' }),
                }),
            ],
          }),
        ],
      }),
      e.jsxs('div', {
        className: 'space-y-6',
        children: [
          e.jsxs('div', {
            children: [
              e.jsx('label', {
                className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2',
                children: 'Sort By',
              }),
              e.jsxs('select', {
                value: h,
                onChange: (r) => d(r.target.value),
                className:
                  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                children: [
                  e.jsx('option', { value: 'relevance', children: 'Relevance' }),
                  e.jsx('option', { value: 'price-low', children: 'Price: Low to High' }),
                  e.jsx('option', { value: 'price-high', children: 'Price: High to Low' }),
                  e.jsx('option', { value: 'rating', children: 'Guest Rating' }),
                  e.jsx('option', { value: 'distance', children: 'Distance' }),
                  e.jsx('option', { value: 'passion', children: 'Passion Match' }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            children: [
              e.jsx('label', {
                className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2',
                children: 'Price Range (per night)',
              }),
              e.jsxs('div', {
                className: 'space-y-2',
                children: [
                  e.jsxs('div', {
                    className: 'flex items-center gap-2',
                    children: [
                      e.jsx('input', {
                        type: 'number',
                        min: '0',
                        max: '2000',
                        value: s.priceRange[0],
                        onChange: (r) =>
                          t('priceRange', [parseInt(r.target.value) || 0, s.priceRange[1]]),
                        className:
                          'w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:ring-2 focus:ring-primary-500',
                        placeholder: 'Min',
                      }),
                      e.jsx('span', {
                        className: 'text-gray-500 dark:text-gray-400',
                        children: 'to',
                      }),
                      e.jsx('input', {
                        type: 'number',
                        min: '0',
                        max: '2000',
                        value: s.priceRange[1],
                        onChange: (r) =>
                          t('priceRange', [s.priceRange[0], parseInt(r.target.value) || 2e3]),
                        className:
                          'w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:ring-2 focus:ring-primary-500',
                        placeholder: 'Max',
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'text-xs text-gray-500 dark:text-gray-400',
                    children: ['$', s.priceRange[0], ' - $', s.priceRange[1], ' per night'],
                  }),
                ],
              }),
            ],
          }),
          e.jsxs('div', {
            children: [
              e.jsx('label', {
                className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3',
                children: 'Star Rating',
              }),
              e.jsx('div', {
                className: 'space-y-3',
                children: [5, 4, 3, 2, 1].map((r) =>
                  e.jsxs(
                    'label',
                    {
                      className:
                        'flex items-center cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors',
                      children: [
                        e.jsx('input', {
                          type: 'checkbox',
                          checked: s.starRating.includes(r),
                          onChange: () => u(r),
                          className:
                            'mr-3 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 focus:ring-2',
                        }),
                        e.jsxs('div', {
                          className: 'flex items-center',
                          children: [
                            e.jsx('div', {
                              className: 'flex items-center mr-2',
                              children: [...Array(r)].map((a, i) =>
                                e.jsx(R, { className: 'w-4 h-4 text-yellow-400 fill-current' }, i),
                              ),
                            }),
                            e.jsxs('span', {
                              className:
                                'text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white',
                              children: [r, ' star', r > 1 ? 's' : '', ' & up'],
                            }),
                          ],
                        }),
                      ],
                    },
                    r,
                  ),
                ),
              }),
            ],
          }),
          e.jsxs('div', {
            children: [
              e.jsx('label', {
                className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3',
                children: 'Amenities',
              }),
              e.jsx('div', {
                className: 'grid grid-cols-1 gap-2 max-h-48 overflow-y-auto',
                children: [
                  'Free WiFi',
                  'Swimming Pool',
                  'Gym/Fitness Center',
                  'Spa & Wellness',
                  'Restaurant',
                  'Room Service',
                  'Pet Friendly',
                  'Business Center',
                  'Free Parking',
                  'Airport Shuttle',
                  'Beach Access',
                  'Air Conditioning',
                  'Concierge Service',
                  'Laundry Service',
                  'Meeting Rooms',
                ].map((r) =>
                  e.jsxs(
                    'label',
                    {
                      className:
                        'flex items-center cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors',
                      children: [
                        e.jsx('input', {
                          type: 'checkbox',
                          checked: s.amenities.includes(r),
                          onChange: () => p(r),
                          className:
                            'mr-3 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 focus:ring-2',
                        }),
                        e.jsx('span', {
                          className:
                            'text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white',
                          children: r,
                        }),
                      ],
                    },
                    r,
                  ),
                ),
              }),
            ],
          }),
          e.jsxs('div', {
            children: [
              e.jsx('label', {
                className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3',
                children: 'Travel Passions',
              }),
              e.jsx('div', {
                className: 'space-y-2',
                children: [
                  'Gourmet Foodie',
                  'Outdoor Adventure',
                  'Cultural Explorer',
                  'Luxury Relaxation',
                  'Family Fun',
                  'Business Travel',
                  'Romantic Getaway',
                ].map((r) =>
                  e.jsxs(
                    'label',
                    {
                      className:
                        'flex items-center cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors',
                      children: [
                        e.jsx('input', {
                          type: 'checkbox',
                          checked: s.passions.includes(r),
                          onChange: () => {
                            const a = s.passions,
                              i = a.includes(r) ? a.filter((c) => c !== r) : [...a, r];
                            t('passions', i);
                          },
                          className:
                            'mr-3 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 focus:ring-2',
                        }),
                        e.jsx('span', {
                          className:
                            'text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white',
                          children: r,
                        }),
                      ],
                    },
                    r,
                  ),
                ),
              }),
            ],
          }),
          e.jsxs('div', {
            children: [
              e.jsx('label', {
                className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3',
                children: 'Accessibility',
              }),
              e.jsxs('div', {
                className: 'space-y-2',
                children: [
                  e.jsxs('label', {
                    className:
                      'flex items-center cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors',
                    children: [
                      e.jsx('input', {
                        type: 'checkbox',
                        checked: s.accessibility.wheelchairAccessible,
                        onChange: (r) =>
                          t('accessibility', {
                            ...s.accessibility,
                            wheelchairAccessible: r.target.checked,
                          }),
                        className:
                          'mr-3 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 focus:ring-2',
                      }),
                      e.jsx('span', {
                        className:
                          'text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white',
                        children: 'Wheelchair Accessible',
                      }),
                    ],
                  }),
                  e.jsxs('label', {
                    className:
                      'flex items-center cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors',
                    children: [
                      e.jsx('input', {
                        type: 'checkbox',
                        checked: s.accessibility.hearingAccessible,
                        onChange: (r) =>
                          t('accessibility', {
                            ...s.accessibility,
                            hearingAccessible: r.target.checked,
                          }),
                        className:
                          'mr-3 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 focus:ring-2',
                      }),
                      e.jsx('span', {
                        className:
                          'text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white',
                        children: 'Hearing Accessible',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          e.jsx('div', {
            children: e.jsxs('label', {
              className:
                'flex items-center cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors',
              children: [
                e.jsx('input', {
                  type: 'checkbox',
                  checked: s.sustainability,
                  onChange: (r) => t('sustainability', r.target.checked),
                  className:
                    'mr-3 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 focus:ring-2',
                }),
                e.jsxs('div', {
                  children: [
                    e.jsx('span', {
                      className:
                        'text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white',
                      children: 'Eco-Friendly Hotels',
                    }),
                    e.jsx('p', {
                      className: 'text-xs text-gray-500 dark:text-gray-400',
                      children: 'Hotels with green certifications',
                    }),
                  ],
                }),
              ],
            }),
          }),
        ],
      }),
    ],
  });
};
function E() {
  return e.jsx('div', {
    className: 'container mx-auto px-4 py-8',
    children: e.jsxs('div', {
      className: 'grid grid-cols-1 lg:grid-cols-4 gap-8',
      children: [
        e.jsx('aside', { className: 'lg:col-span-1', children: e.jsx(A, {}) }),
        e.jsx('main', {
          className: 'lg:col-span-3',
          'data-testid': 'search-results',
          children: e.jsx(j, {}),
        }),
      ],
    }),
  });
}
export { E as SearchResultsPage };
//# sourceMappingURL=SearchResultsPage-CM9LTcfZ.js.map
