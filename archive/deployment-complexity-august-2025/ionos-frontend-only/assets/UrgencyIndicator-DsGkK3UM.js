import { j as e, c as s } from './index-BipxYy_H.js';
import { H as g, a as d, U as i, Z as b, n as p, d as x, T as m, ac as C } from './ui-c8TFxX-w.js';
const u = {
    security: {
      icon: x,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
    rating: {
      icon: p,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    speed: {
      icon: b,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    popular: {
      icon: i,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    instant: {
      icon: d,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    favorite: {
      icon: g,
      color: 'text-primary',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
    },
  },
  h = ({ type: r, text: l, subtext: n, className: t }) => {
    const o = u[r],
      c = o.icon;
    return e.jsxs('div', {
      className: s(
        'inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium',
        o.bgColor,
        o.borderColor,
        o.color,
        t,
      ),
      children: [
        e.jsx(c, { className: 'w-4 h-4' }),
        e.jsx('span', { children: l }),
        n && e.jsxs('span', { className: 'text-xs opacity-75', children: ['• ', n] }),
      ],
    });
  },
  y = {
    viewing: {
      icon: C,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      getText: (r) => `${r} people viewing`,
    },
    recently_booked: {
      icon: d,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      getText: (r, l) => `Booked ${l || '2 hours ago'}`,
    },
    trending: {
      icon: m,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      getText: () => 'Trending today',
    },
    limited: {
      icon: i,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      getText: (r) => `Only ${r} rooms left`,
    },
  },
  j = ({ type: r, count: l = 0, timeframe: n, className: t }) => {
    const o = y[r],
      c = o.icon,
      a = o.getText(l, n);
    return e.jsxs('div', {
      className: s(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium animate-pulse',
        o.bgColor,
        o.borderColor,
        o.color,
        t,
      ),
      children: [e.jsx(c, { className: 'w-3.5 h-3.5' }), e.jsx('span', { children: a })],
    });
  };
export { h as T, j as U };
//# sourceMappingURL=UrgencyIndicator-DsGkK3UM.js.map
