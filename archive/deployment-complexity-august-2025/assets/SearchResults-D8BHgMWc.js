import { u as f, b as v, j as e, c, C as g, B as l } from './index-Bz50S9TB.js';
import { r as N, u as b } from './vendor-VgjaNQN2.js';
import { T as w, U as o } from './UrgencyIndicator-DZQl-k6B.js';
import {
  M as h,
  H as k,
  j as R,
  W as S,
  I as P,
  J as M,
  h as C,
  m as F,
  n as E,
} from './ui-c8TFxX-w.js';
const T = ({ onHotelSelect: m, className: d = '' }) => {
    const p = b(),
      { results: x, loading: y, pagination: s } = f(),
      { setSelectedHotel: u } = v(),
      j = (a) =>
        e.jsxs('div', {
          className: 'flex items-center gap-1',
          children: [
            [...Array(5)].map((i, t) =>
              e.jsx(
                E,
                {
                  className: c(
                    'w-4 h-4',
                    t < Math.floor(a) ? 'text-yellow-400 fill-current' : 'text-gray-300',
                  ),
                },
                t,
              ),
            ),
            e.jsx('span', {
              className: 'ml-1 text-sm font-medium text-gray-700 dark:text-gray-300',
              children: a.toFixed(1),
            }),
          ],
        }),
      n = (a, i = 'USD') =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: i }).format(a);
    return y
      ? e.jsxs('div', {
          className: c('space-y-6', d),
          children: [
            e.jsxs('div', {
              className: 'flex items-center justify-between',
              children: [
                e.jsx('h3', {
                  className: 'text-xl font-semibold text-gray-900 dark:text-white',
                  children: 'Searching hotels...',
                }),
                e.jsx('div', {
                  className: 'animate-pulse h-4 bg-gray-300 dark:bg-gray-600 rounded w-24',
                }),
              ],
            }),
            e.jsx('div', {
              className: 'grid gap-6',
              children: [1, 2, 3, 4, 5, 6].map((a) =>
                e.jsx(
                  g,
                  {
                    className: 'animate-pulse',
                    children: e.jsxs('div', {
                      className: 'flex flex-col lg:flex-row gap-6 p-6',
                      children: [
                        e.jsx('div', {
                          className:
                            'w-full lg:w-80 h-48 lg:h-32 bg-gray-300 dark:bg-gray-600 rounded-lg',
                        }),
                        e.jsxs('div', {
                          className: 'flex-1 space-y-3',
                          children: [
                            e.jsx('div', {
                              className: 'h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4',
                            }),
                            e.jsx('div', {
                              className: 'h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2',
                            }),
                            e.jsx('div', {
                              className: 'h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3',
                            }),
                            e.jsx('div', {
                              className: 'flex gap-2',
                              children: [1, 2, 3].map((i) =>
                                e.jsx(
                                  'div',
                                  {
                                    className: 'h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-16',
                                  },
                                  i,
                                ),
                              ),
                            }),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'text-right space-y-2',
                          children: [
                            e.jsx('div', {
                              className: 'h-8 bg-gray-300 dark:bg-gray-600 rounded w-20',
                            }),
                            e.jsx('div', {
                              className: 'h-4 bg-gray-300 dark:bg-gray-600 rounded w-16',
                            }),
                          ],
                        }),
                      ],
                    }),
                  },
                  a,
                ),
              ),
            }),
          ],
        })
      : x.length === 0
        ? e.jsx('div', {
            className: c('text-center py-12', d),
            children: e.jsxs('div', {
              className: 'max-w-md mx-auto',
              children: [
                e.jsx('div', {
                  className:
                    'w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center',
                  children: e.jsx(h, { className: 'w-8 h-8 text-gray-400' }),
                }),
                e.jsx('h3', {
                  className: 'text-xl font-semibold text-gray-900 dark:text-white mb-2',
                  children: 'No hotels found',
                }),
                e.jsx('p', {
                  className: 'text-gray-600 dark:text-gray-400 mb-6',
                  children: 'Try adjusting your search criteria or explore different dates',
                }),
                e.jsx(l, {
                  variant: 'outline',
                  className: 'text-primary-600',
                  children: 'Modify Search',
                }),
              ],
            }),
          })
        : e.jsxs('div', {
            className: c('space-y-6', d),
            children: [
              e.jsxs('div', {
                className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
                children: [
                  e.jsxs('div', {
                    children: [
                      e.jsxs('h3', {
                        className: 'text-xl font-semibold text-gray-900 dark:text-white',
                        children: [s?.total || x.length, ' hotels found'],
                      }),
                      s &&
                        e.jsxs('p', {
                          className: 'text-sm text-gray-600 dark:text-gray-400',
                          children: [
                            'Showing ',
                            (s.page - 1) * s.limit + 1,
                            '-',
                            Math.min(s.page * s.limit, s.total),
                            ' of ',
                            s.total,
                          ],
                        }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'flex items-center gap-2',
                    children: [
                      e.jsx('span', {
                        className: 'text-sm text-gray-600 dark:text-gray-400',
                        children: 'Sort by:',
                      }),
                      e.jsxs('select', {
                        className:
                          'text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                        children: [
                          e.jsx('option', { value: 'relevance', children: 'Relevance' }),
                          e.jsx('option', { value: 'price-low', children: 'Price: Low to High' }),
                          e.jsx('option', { value: 'price-high', children: 'Price: High to Low' }),
                          e.jsx('option', { value: 'rating', children: 'Guest Rating' }),
                          e.jsx('option', { value: 'passion', children: 'Passion Match' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              e.jsx('div', {
                className: 'grid gap-6',
                children: x.map((a) => {
                  const i = a.images?.find((r) => r.isPrimary) || a.images?.[0],
                    t = a.passionScore ? Math.max(...Object.values(a.passionScore)) : 0;
                  return e.jsxs(
                    g,
                    {
                      className: c(
                        'group hover:shadow-2xl hover:scale-[1.01] transition-all duration-500 cursor-pointer overflow-hidden shadow-lg bg-white transform animate-fadeInUp',
                        t > 0.8 ? 'border-2 border-primary ring-2 ring-primary/20' : 'border-0',
                      ),
                      onClick: () => m && m(a),
                      children: [
                        t > 0.8 &&
                          e.jsx('div', {
                            className:
                              'bg-gradient-to-r from-primary to-primary-600 text-white px-4 py-2 text-center',
                            children: e.jsx('span', {
                              className: 'text-sm font-bold',
                              children: '⭐ FEATURED DEAL - Perfect Match for You!',
                            }),
                          }),
                        e.jsxs('div', {
                          className: 'flex flex-col lg:flex-row gap-0',
                          children: [
                            e.jsxs('div', {
                              className:
                                'relative w-full lg:w-96 h-48 sm:h-56 lg:h-48 overflow-hidden',
                              children: [
                                e.jsx('img', {
                                  src:
                                    i?.url ||
                                    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop',
                                  alt: i?.alt || a.name,
                                  className:
                                    'w-full h-full object-cover group-hover:scale-110 transition-transform duration-500',
                                  onError: (r) => {
                                    r.target.src =
                                      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop';
                                  },
                                }),
                                e.jsxs('div', {
                                  className: 'absolute top-3 left-3 flex flex-col gap-2',
                                  children: [
                                    t > 0.7 &&
                                      e.jsx(w, {
                                        type: 'favorite',
                                        text: `${Math.round(t * 100)}% Match`,
                                        className: 'shadow-lg',
                                      }),
                                    e.jsx(o, {
                                      type: 'viewing',
                                      count: Math.floor(Math.random() * 15) + 5,
                                      className: 'shadow-lg',
                                    }),
                                  ],
                                }),
                                a.availability.lowAvailability &&
                                  e.jsx('div', {
                                    className: 'absolute top-3 right-3',
                                    children: e.jsx(o, {
                                      type: 'limited',
                                      count: Math.floor(Math.random() * 3) + 1,
                                      className: 'shadow-lg',
                                    }),
                                  }),
                                e.jsx('div', {
                                  className: 'absolute bottom-3 left-3',
                                  children: e.jsx(o, {
                                    type: 'recently_booked',
                                    timeframe: `${Math.floor(Math.random() * 6) + 1} hours ago`,
                                    className: 'shadow-lg',
                                  }),
                                }),
                                e.jsxs('div', {
                                  className:
                                    'absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                                  children: [
                                    e.jsx(l, {
                                      variant: 'secondary',
                                      size: 'icon',
                                      className: 'w-8 h-8 bg-white/90 hover:bg-white text-gray-700',
                                      onClick: (r) => {
                                        r.stopPropagation();
                                      },
                                      children: e.jsx(k, { className: 'w-4 h-4' }),
                                    }),
                                    e.jsx(l, {
                                      variant: 'secondary',
                                      size: 'icon',
                                      className: 'w-8 h-8 bg-white/90 hover:bg-white text-gray-700',
                                      onClick: (r) => {
                                        r.stopPropagation();
                                      },
                                      children: e.jsx(R, { className: 'w-4 h-4' }),
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            e.jsx('div', {
                              className: 'flex-1 p-4 sm:p-6',
                              children: e.jsxs('div', {
                                className: 'flex flex-col h-full',
                                children: [
                                  e.jsxs('div', {
                                    className:
                                      'flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-3 sm:gap-0',
                                    children: [
                                      e.jsxs('div', {
                                        className: 'flex-1 min-w-0',
                                        children: [
                                          e.jsx('h4', {
                                            className:
                                              'text-lg sm:text-xl font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-2',
                                            children: a.name,
                                          }),
                                          e.jsxs('div', {
                                            className:
                                              'flex items-center gap-1 text-gray-600 dark:text-gray-400 mt-1',
                                            children: [
                                              e.jsx(h, { className: 'w-4 h-4 flex-shrink-0' }),
                                              e.jsxs('span', {
                                                className: 'text-sm truncate',
                                                children: [
                                                  a.location.neighborhood || a.location.city,
                                                  ', ',
                                                  a.location.country,
                                                ],
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                      e.jsxs('div', {
                                        className:
                                          'text-center sm:text-right sm:ml-4 order-first sm:order-last',
                                        children: [
                                          a.deals &&
                                            a.deals.length > 0 &&
                                            e.jsx('div', {
                                              className: 'mb-2',
                                              children: e.jsxs('span', {
                                                className:
                                                  'bg-accent text-white text-xs font-bold px-2 py-1 rounded-full',
                                                children: [
                                                  a.deals[0].discountPercent,
                                                  '% OFF TODAY',
                                                ],
                                              }),
                                            }),
                                          a.priceRange.originalPrice &&
                                            a.priceRange.originalPrice > a.priceRange.avgNightly &&
                                            e.jsx('div', {
                                              className: 'text-sm text-gray-400 line-through',
                                              children: n(
                                                a.priceRange.originalPrice,
                                                a.priceRange.currency,
                                              ),
                                            }),
                                          e.jsx('div', {
                                            className:
                                              'text-3xl font-bold text-gray-900 dark:text-white',
                                            children: n(
                                              a.priceRange.avgNightly,
                                              a.priceRange.currency,
                                            ),
                                          }),
                                          e.jsx('div', {
                                            className: 'text-sm text-gray-500 dark:text-gray-400',
                                            children: 'per night',
                                          }),
                                          e.jsxs('div', {
                                            className: 'text-xs text-gray-400 mt-1',
                                            children: [
                                              n(a.priceRange.avgNightly * 3, a.priceRange.currency),
                                              ' total (3 nights)',
                                            ],
                                          }),
                                          a.priceRange.originalPrice &&
                                            a.priceRange.originalPrice > a.priceRange.avgNightly &&
                                            e.jsxs('div', {
                                              className: 'text-xs font-medium text-accent mt-1',
                                              children: [
                                                'Save ',
                                                n(
                                                  a.priceRange.originalPrice -
                                                    a.priceRange.avgNightly,
                                                  a.priceRange.currency,
                                                ),
                                              ],
                                            }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  e.jsxs('div', {
                                    className: 'flex items-center gap-3 mb-3',
                                    children: [
                                      j(a.rating),
                                      e.jsxs('span', {
                                        className: 'text-sm text-gray-600 dark:text-gray-400',
                                        children: [
                                          '(',
                                          a.reviewCount.toLocaleString(),
                                          ' reviews)',
                                        ],
                                      }),
                                      a.sustainabilityScore &&
                                        a.sustainabilityScore > 0.8 &&
                                        e.jsx('span', {
                                          className:
                                            'bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full',
                                          children: 'Eco-Friendly',
                                        }),
                                    ],
                                  }),
                                  e.jsx('p', {
                                    className:
                                      'text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2',
                                    children: a.description,
                                  }),
                                  e.jsxs('div', {
                                    className: 'grid grid-cols-2 gap-2 mb-4',
                                    children: [
                                      e.jsxs('div', {
                                        className: 'flex items-center gap-2 text-sm text-gray-600',
                                        children: [
                                          e.jsx(S, { className: 'w-4 h-4 text-blue-500' }),
                                          e.jsx('span', { children: 'Free WiFi' }),
                                        ],
                                      }),
                                      e.jsxs('div', {
                                        className: 'flex items-center gap-2 text-sm text-gray-600',
                                        children: [
                                          e.jsx(P, { className: 'w-4 h-4 text-green-500' }),
                                          e.jsx('span', { children: 'Free Parking' }),
                                        ],
                                      }),
                                      e.jsxs('div', {
                                        className: 'flex items-center gap-2 text-sm text-gray-600',
                                        children: [
                                          e.jsx(M, { className: 'w-4 h-4 text-amber-500' }),
                                          e.jsx('span', { children: 'Breakfast' }),
                                        ],
                                      }),
                                      e.jsxs('div', {
                                        className: 'flex items-center gap-2 text-sm text-gray-600',
                                        children: [
                                          e.jsx(C, { className: 'w-4 h-4 text-purple-500' }),
                                          e.jsx('span', { children: 'Spa' }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  e.jsxs('div', {
                                    className: 'flex flex-wrap gap-1 mb-4',
                                    children: [
                                      a.amenities
                                        .slice(0, 3)
                                        .map((r) =>
                                          e.jsx(
                                            'span',
                                            {
                                              className:
                                                'inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200',
                                              children: r.name,
                                            },
                                            r.id,
                                          ),
                                        ),
                                      a.amenities.length > 3 &&
                                        e.jsxs('span', {
                                          className:
                                            'px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-200',
                                          children: ['+', a.amenities.length - 3, ' more'],
                                        }),
                                    ],
                                  }),
                                  e.jsxs('div', {
                                    className: 'flex flex-col gap-3 mt-auto',
                                    children: [
                                      a.topReview &&
                                        e.jsxs('div', {
                                          className: 'p-3 bg-gray-50 dark:bg-gray-800 rounded-lg',
                                          children: [
                                            e.jsxs('p', {
                                              className:
                                                'text-sm italic text-gray-700 dark:text-gray-300 line-clamp-2',
                                              children: ['"', a.topReview.quote, '"'],
                                            }),
                                            e.jsxs('p', {
                                              className:
                                                'text-xs text-gray-500 dark:text-gray-400 mt-1',
                                              children: ['- ', a.topReview.author],
                                            }),
                                          ],
                                        }),
                                      e.jsxs('div', {
                                        className:
                                          'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0',
                                        children: [
                                          e.jsxs('div', {
                                            className:
                                              'hidden sm:flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400',
                                            children: [
                                              a.virtualTourUrl &&
                                                e.jsxs('button', {
                                                  className:
                                                    'hover:text-primary-600 transition-colors flex items-center gap-1',
                                                  children: [
                                                    e.jsx(F, { className: 'w-4 h-4' }),
                                                    'Virtual Tour',
                                                  ],
                                                }),
                                              e.jsx('button', {
                                                className:
                                                  'hover:text-primary-600 transition-colors',
                                                children: 'View on Map',
                                              }),
                                            ],
                                          }),
                                          e.jsxs('div', {
                                            className: 'flex flex-col sm:flex-row gap-2 sm:gap-2',
                                            children: [
                                              e.jsx(l, {
                                                variant: 'outline',
                                                size: 'sm',
                                                className:
                                                  'sm:hidden w-full text-gray-600 hover:text-primary-600 order-2 sm:order-1',
                                                children: 'View Details & Map',
                                              }),
                                              e.jsx(l, {
                                                variant: 'outline',
                                                size: 'sm',
                                                className:
                                                  'hidden sm:block text-gray-600 hover:text-primary-600',
                                                children: 'View Details',
                                              }),
                                              e.jsx(l, {
                                                size: 'sm',
                                                className:
                                                  'w-full sm:w-auto bg-primary text-white hover:bg-primary-600 px-6 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 order-1 sm:order-2 h-12 sm:h-auto text-lg sm:text-sm',
                                                onClick: (r) => {
                                                  (r.stopPropagation(), u(a), p('/booking'));
                                                },
                                                children: 'Book Now',
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            }),
                          ],
                        }),
                      ],
                    },
                    a.id,
                  );
                }),
              }),
              s &&
                s.totalPages > 1 &&
                e.jsxs('div', {
                  className: 'flex items-center justify-center gap-2 mt-8',
                  children: [
                    e.jsx(l, {
                      variant: 'outline',
                      disabled: s.page === 1,
                      onClick: () => {},
                      children: 'Previous',
                    }),
                    e.jsx('div', {
                      className: 'flex gap-1',
                      children: Array.from({ length: Math.min(5, s.totalPages) }, (a, i) => {
                        const t = i + 1;
                        return e.jsx(
                          l,
                          {
                            variant: s.page === t ? 'primary' : 'outline',
                            size: 'sm',
                            className: 'w-10',
                            onClick: () => {},
                            children: t,
                          },
                          t,
                        );
                      }),
                    }),
                    e.jsx(l, {
                      variant: 'outline',
                      disabled: s.page === s.totalPages,
                      onClick: () => {},
                      children: 'Next',
                    }),
                  ],
                }),
            ],
          });
  },
  B = N.memo(T);
export { T as SearchResults, B as default };
//# sourceMappingURL=SearchResults-D8BHgMWc.js.map
