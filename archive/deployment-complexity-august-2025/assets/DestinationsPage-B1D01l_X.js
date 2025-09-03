import { u as l, j as e } from './index-Bz50S9TB.js';
import { u as n } from './vendor-VgjaNQN2.js';
import { U as c, M as o, T as d, n as h } from './ui-c8TFxX-w.js';
const m = [
    {
      id: 1,
      city: 'Las Vegas',
      state: 'Nevada',
      country: 'USA',
      image: 'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=800',
      hotels: 852,
      avgPrice: 145,
      rating: 4.5,
      trending: !0,
      description: 'Entertainment capital with world-class casinos and shows',
      popularFor: ['Casinos', 'Shows', 'Nightlife', 'Weddings'],
    },
    {
      id: 2,
      city: 'New York',
      state: 'New York',
      country: 'USA',
      image: 'https://images.unsplash.com/photo-1543716091-a840c05249ec?w=800',
      hotels: 1403,
      avgPrice: 225,
      rating: 4.6,
      trending: !0,
      description: 'The city that never sleeps - culture, dining, and Broadway',
      popularFor: ['Museums', 'Broadway', 'Shopping', 'Dining'],
    },
    {
      id: 3,
      city: 'Miami',
      state: 'Florida',
      country: 'USA',
      image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800',
      hotels: 678,
      avgPrice: 189,
      rating: 4.4,
      trending: !1,
      description: 'Beach paradise with Art Deco architecture and vibrant nightlife',
      popularFor: ['Beaches', 'Art Deco', 'Cuban Food', 'Nightlife'],
    },
    {
      id: 4,
      city: 'Los Angeles',
      state: 'California',
      country: 'USA',
      image: 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800',
      hotels: 923,
      avgPrice: 175,
      rating: 4.3,
      trending: !0,
      description: 'Hollywood glamour meets beach vibes in the City of Angels',
      popularFor: ['Hollywood', 'Beaches', 'Theme Parks', 'Celebrity Tours'],
    },
    {
      id: 5,
      city: 'Orlando',
      state: 'Florida',
      country: 'USA',
      image: 'https://images.unsplash.com/photo-1597466599360-3b9775841aec?w=800',
      hotels: 567,
      avgPrice: 135,
      rating: 4.5,
      trending: !1,
      description: 'Theme park capital with Disney World and Universal Studios',
      popularFor: ['Disney World', 'Universal', 'Water Parks', 'Family Fun'],
    },
    {
      id: 6,
      city: 'San Francisco',
      state: 'California',
      country: 'USA',
      image: 'https://images.unsplash.com/photo-1521747116042-5a810fda9664?w=800',
      hotels: 412,
      avgPrice: 245,
      rating: 4.7,
      trending: !1,
      description: 'Tech hub with iconic Golden Gate Bridge and cable cars',
      popularFor: ['Golden Gate', 'Alcatraz', 'Wine Country', 'Tech Tours'],
    },
    {
      id: 7,
      city: 'Chicago',
      state: 'Illinois',
      country: 'USA',
      image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800',
      hotels: 489,
      avgPrice: 165,
      rating: 4.4,
      trending: !0,
      description: 'Architectural marvels and deep-dish pizza by Lake Michigan',
      popularFor: ['Architecture', 'Museums', 'Deep Dish Pizza', 'Jazz'],
    },
    {
      id: 8,
      city: 'Nashville',
      state: 'Tennessee',
      country: 'USA',
      image: 'https://images.unsplash.com/photo-1545178803-4056771d60a3?w=800',
      hotels: 312,
      avgPrice: 145,
      rating: 4.6,
      trending: !0,
      description: 'Music City USA - Country music capital with honky-tonks',
      popularFor: ['Country Music', 'Live Music', 'BBQ', 'Whiskey'],
    },
  ],
  u = () => {
    const t = n(),
      { setQuery: i } = l(),
      r = (s) => {
        (i(s), t('/search'));
      };
    return e.jsxs('div', {
      className: 'min-h-screen bg-gray-50',
      children: [
        e.jsx('div', {
          className: 'bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16',
          children: e.jsxs('div', {
            className: 'container mx-auto px-4',
            children: [
              e.jsx('h1', {
                className: 'text-4xl md:text-5xl font-bold mb-4',
                children: 'Popular Destinations',
              }),
              e.jsx('p', {
                className: 'text-xl text-blue-100 max-w-3xl',
                children:
                  'Discover amazing hotels in top cities across the United States. From vibrant nightlife to peaceful beaches, find your perfect getaway.',
              }),
            ],
          }),
        }),
        e.jsx('div', {
          className: 'bg-white border-b',
          children: e.jsx('div', {
            className: 'container mx-auto px-4 py-6',
            children: e.jsxs('div', {
              className: 'flex flex-wrap items-center justify-between gap-4',
              children: [
                e.jsxs('div', {
                  className: 'flex items-center gap-8',
                  children: [
                    e.jsxs('div', {
                      className: 'flex items-center gap-2',
                      children: [
                        e.jsx(c, { className: 'h-5 w-5 text-gray-500' }),
                        e.jsxs('span', {
                          className: 'text-sm text-gray-600',
                          children: [e.jsx('strong', { children: '2.5M+' }), ' travelers served'],
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'flex items-center gap-2',
                      children: [
                        e.jsx(o, { className: 'h-5 w-5 text-gray-500' }),
                        e.jsxs('span', {
                          className: 'text-sm text-gray-600',
                          children: [e.jsx('strong', { children: '50+' }), ' destinations'],
                        }),
                      ],
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'flex items-center gap-2 text-orange-600',
                  children: [
                    e.jsx(d, { className: 'h-5 w-5' }),
                    e.jsx('span', {
                      className: 'text-sm font-medium',
                      children: '5 trending right now',
                    }),
                  ],
                }),
              ],
            }),
          }),
        }),
        e.jsx('div', {
          className: 'container mx-auto px-4 py-12',
          children: e.jsx('div', {
            className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
            children: m.map((s) =>
              e.jsxs(
                'div',
                {
                  onClick: () => r(s.city),
                  className:
                    'group cursor-pointer bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden',
                  children: [
                    e.jsxs('div', {
                      className: 'relative h-48 overflow-hidden',
                      children: [
                        e.jsx('img', {
                          src: s.image,
                          alt: s.city,
                          className:
                            'w-full h-full object-cover group-hover:scale-110 transition-transform duration-300',
                        }),
                        s.trending &&
                          e.jsx('div', {
                            className:
                              'absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold',
                            children: 'TRENDING',
                          }),
                        e.jsxs('div', {
                          className:
                            'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4',
                          children: [
                            e.jsx('h3', {
                              className: 'text-white text-xl font-bold',
                              children: s.city,
                            }),
                            e.jsx('p', { className: 'text-white/80 text-sm', children: s.state }),
                          ],
                        }),
                      ],
                    }),
                    e.jsxs('div', {
                      className: 'p-4',
                      children: [
                        e.jsx('p', {
                          className: 'text-gray-600 text-sm mb-3 line-clamp-2',
                          children: s.description,
                        }),
                        e.jsxs('div', {
                          className: 'flex items-center justify-between mb-3',
                          children: [
                            e.jsxs('div', {
                              className: 'text-sm',
                              children: [
                                e.jsx('span', {
                                  className: 'font-semibold text-gray-900',
                                  children: s.hotels,
                                }),
                                e.jsx('span', { className: 'text-gray-500', children: ' hotels' }),
                              ],
                            }),
                            e.jsxs('div', {
                              className: 'flex items-center gap-1',
                              children: [
                                e.jsx(h, { className: 'h-4 w-4 text-yellow-500 fill-current' }),
                                e.jsx('span', {
                                  className: 'text-sm font-semibold',
                                  children: s.rating,
                                }),
                              ],
                            }),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'flex items-center justify-between border-t pt-3',
                          children: [
                            e.jsxs('div', {
                              children: [
                                e.jsx('p', {
                                  className: 'text-xs text-gray-500',
                                  children: 'Avg. per night',
                                }),
                                e.jsxs('p', {
                                  className: 'text-lg font-bold text-blue-600',
                                  children: ['$', s.avgPrice],
                                }),
                              ],
                            }),
                            e.jsx('button', {
                              className:
                                'bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors',
                              children: 'View Hotels',
                            }),
                          ],
                        }),
                        e.jsx('div', {
                          className: 'mt-3 flex flex-wrap gap-1',
                          children: s.popularFor
                            .slice(0, 3)
                            .map((a) =>
                              e.jsx(
                                'span',
                                {
                                  className: 'text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded',
                                  children: a,
                                },
                                a,
                              ),
                            ),
                        }),
                      ],
                    }),
                  ],
                },
                s.id,
              ),
            ),
          }),
        }),
        e.jsx('div', {
          className: 'bg-blue-50 py-12',
          children: e.jsxs('div', {
            className: 'container mx-auto px-4 text-center',
            children: [
              e.jsx('h2', {
                className: 'text-2xl font-bold mb-4',
                children: "Can't find your destination?",
              }),
              e.jsx('p', {
                className: 'text-gray-600 mb-6',
                children: 'We have hotels in over 200 cities worldwide. Search for any location!',
              }),
              e.jsx('button', {
                onClick: () => t('/search'),
                className:
                  'bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors',
                children: 'Search All Destinations',
              }),
            ],
          }),
        }),
      ],
    });
  };
export { u as DestinationsPage };
//# sourceMappingURL=DestinationsPage-B1D01l_X.js.map
