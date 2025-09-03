import { j as e, L as o } from './index-BipxYy_H.js';
import {
  A as r,
  d as n,
  a2 as d,
  T as c,
  n as l,
  a3 as m,
  a4 as x,
  a5 as b,
} from './ui-c8TFxX-w.js';
import './vendor-VgjaNQN2.js';
const h = [
  {
    name: 'Silver Elite',
    icon: l,
    color: 'from-slate-400 to-slate-600',
    requirements: '10 nights/year',
    benefits: [
      '10% off all bookings',
      'Free room upgrade (when available)',
      'Late checkout until 2 PM',
      'Welcome drink on arrival',
    ],
  },
  {
    name: 'Gold Elite',
    icon: m,
    color: 'from-amber-400 to-amber-600',
    requirements: '25 nights/year',
    benefits: [
      '15% off all bookings',
      'Guaranteed room upgrade',
      'Late checkout until 4 PM',
      'Free breakfast included',
      'Priority customer service',
      'Exclusive member rates',
    ],
  },
  {
    name: 'Platinum Elite',
    icon: x,
    color: 'from-purple-500 to-purple-700',
    requirements: '50 nights/year',
    benefits: [
      '20% off all bookings',
      'Suite upgrade when available',
      'Late checkout anytime',
      'Free breakfast & dinner',
      'Airport transfers included',
      'Dedicated concierge service',
      'Access to exclusive lounges',
      'Complimentary spa credits',
    ],
    featured: !0,
  },
  {
    name: 'Diamond Elite',
    icon: b,
    color: 'from-blue-600 to-indigo-700',
    requirements: '100 nights/year',
    benefits: [
      '25% off all bookings',
      'Guaranteed suite upgrade',
      'Flexible cancellation anytime',
      'All meals included',
      'Unlimited spa access',
      'Personal travel advisor',
      'Exclusive event invitations',
      'Annual luxury gift',
      'Private jet lounge access',
    ],
  },
];
function g() {
  return e.jsx(o, {
    children: e.jsxs('div', {
      className: 'min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900',
      children: [
        e.jsxs('div', {
          className: 'relative overflow-hidden',
          children: [
            e.jsx('div', {
              className: 'absolute inset-0 bg-gradient-to-br from-amber-500/20 to-purple-600/20',
            }),
            e.jsxs('div', {
              className: 'relative max-w-7xl mx-auto px-4 py-20 text-center',
              children: [
                e.jsxs('div', {
                  className:
                    'inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm text-amber-300 px-4 py-2 rounded-full text-sm font-semibold mb-6',
                  children: [e.jsx(r, { className: 'w-4 h-4' }), 'EXCLUSIVE MEMBERSHIP PROGRAM'],
                }),
                e.jsx('h1', {
                  className: 'text-5xl md:text-6xl font-bold text-white mb-6',
                  children: 'Elite Rewards',
                }),
                e.jsx('p', {
                  className: 'text-xl text-slate-300 max-w-3xl mx-auto mb-12',
                  children:
                    "Join the world's most rewarding hotel loyalty program. Earn points, unlock exclusive perks, and experience luxury like never before.",
                }),
                e.jsx('button', {
                  className:
                    'px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-amber-500/25 transform hover:scale-105',
                  children: "Join Now - It's Free",
                }),
              ],
            }),
          ],
        }),
        e.jsx('div', {
          className: 'max-w-7xl mx-auto px-4 py-16',
          children: e.jsx('div', {
            className: 'grid grid-cols-1 md:grid-cols-4 gap-8',
            children: [
              { number: '10M+', label: 'Active Members', icon: n },
              { number: '5,000+', label: 'Partner Hotels', icon: r },
              { number: '$2B+', label: 'Rewards Given', icon: d },
              { number: '150+', label: 'Countries', icon: c },
            ].map((t, s) => {
              const a = t.icon;
              return e.jsxs(
                'div',
                {
                  className: 'text-center',
                  children: [
                    e.jsx(a, { className: 'w-8 h-8 text-amber-400 mx-auto mb-4' }),
                    e.jsx('div', {
                      className: 'text-3xl font-bold text-white mb-2',
                      children: t.number,
                    }),
                    e.jsx('div', { className: 'text-slate-400', children: t.label }),
                  ],
                },
                s,
              );
            }),
          }),
        }),
        e.jsxs('div', {
          className: 'max-w-7xl mx-auto px-4 py-16',
          children: [
            e.jsxs('div', {
              className: 'text-center mb-12',
              children: [
                e.jsx('h2', {
                  className: 'text-4xl font-bold text-white mb-4',
                  children: 'Membership Tiers',
                }),
                e.jsx('p', {
                  className: 'text-xl text-slate-300',
                  children: 'The more you stay, the more you earn',
                }),
              ],
            }),
            e.jsx('div', {
              className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8',
              children: h.map((t) => {
                const s = t.icon;
                return e.jsxs(
                  'div',
                  {
                    className: `
                    relative rounded-2xl overflow-hidden
                    ${t.featured ? 'ring-2 ring-amber-400 shadow-2xl shadow-amber-500/20 transform scale-105' : 'shadow-xl'}
                  `,
                    children: [
                      t.featured &&
                        e.jsx('div', {
                          className:
                            'absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg',
                          children: 'MOST POPULAR',
                        }),
                      e.jsxs('div', {
                        className: `bg-gradient-to-br ${t.color} p-8 text-white`,
                        children: [
                          e.jsx(s, { className: 'w-12 h-12 mb-4' }),
                          e.jsx('h3', { className: 'text-2xl font-bold mb-2', children: t.name }),
                          e.jsx('p', { className: 'text-sm opacity-90', children: t.requirements }),
                        ],
                      }),
                      e.jsx('div', {
                        className: 'bg-white/10 backdrop-blur-sm p-6',
                        children: e.jsx('ul', {
                          className: 'space-y-3',
                          children: t.benefits.map((a, i) =>
                            e.jsxs(
                              'li',
                              {
                                className: 'flex items-start gap-2 text-white/90 text-sm',
                                children: [
                                  e.jsx(l, {
                                    className: 'w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5',
                                  }),
                                  e.jsx('span', { children: a }),
                                ],
                              },
                              i,
                            ),
                          ),
                        }),
                      }),
                    ],
                  },
                  t.name,
                );
              }),
            }),
          ],
        }),
        e.jsx('div', {
          className: 'max-w-7xl mx-auto px-4 py-16',
          children: e.jsxs('div', {
            className:
              'bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-3xl p-12',
            children: [
              e.jsx('h2', {
                className: 'text-3xl font-bold text-white mb-8 text-center',
                children: 'How It Works',
              }),
              e.jsx('div', {
                className: 'grid grid-cols-1 md:grid-cols-3 gap-8',
                children: [
                  {
                    step: '1',
                    title: 'Join Free',
                    description: 'Sign up in seconds and start earning points immediately',
                  },
                  {
                    step: '2',
                    title: 'Book & Earn',
                    description: 'Earn 10 points for every dollar spent on hotel bookings',
                  },
                  {
                    step: '3',
                    title: 'Unlock Rewards',
                    description:
                      'Redeem points for free nights, upgrades, and exclusive experiences',
                  },
                ].map((t) =>
                  e.jsxs(
                    'div',
                    {
                      className: 'text-center',
                      children: [
                        e.jsx('div', {
                          className:
                            'w-16 h-16 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4',
                          children: t.step,
                        }),
                        e.jsx('h3', {
                          className: 'text-xl font-bold text-white mb-2',
                          children: t.title,
                        }),
                        e.jsx('p', { className: 'text-slate-300', children: t.description }),
                      ],
                    },
                    t.step,
                  ),
                ),
              }),
            ],
          }),
        }),
        e.jsxs('div', {
          className: 'max-w-4xl mx-auto px-4 py-20 text-center',
          children: [
            e.jsx('h2', {
              className: 'text-4xl font-bold text-white mb-6',
              children: 'Start Your Journey to Elite Status',
            }),
            e.jsx('p', {
              className: 'text-xl text-slate-300 mb-8',
              children:
                'Join millions of travelers who enjoy exclusive benefits and unforgettable experiences',
            }),
            e.jsxs('div', {
              className: 'flex flex-col sm:flex-row gap-4 justify-center',
              children: [
                e.jsx('button', {
                  className:
                    'px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-amber-500/25',
                  children: 'Create Free Account',
                }),
                e.jsx('button', {
                  className:
                    'px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-bold text-lg border border-white/30',
                  children: 'Learn More',
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
}
export { g as default };
//# sourceMappingURL=RewardsPage-K-DRt_6S.js.map
