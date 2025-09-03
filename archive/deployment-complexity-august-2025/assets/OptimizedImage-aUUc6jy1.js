import { l as j, j as e } from './index-BipxYy_H.js';
import { r as s } from './vendor-VgjaNQN2.js';
function M(a, u = {}) {
  const { threshold: m = 0, root: n = null, rootMargin: o = '0%', freezeOnceVisible: r = !1 } = u,
    [i, g] = s.useState(),
    [f, x] = s.useState(!1),
    c = i?.isIntersecting && r,
    p = ([l]) => {
      c || (g(l), x(l.isIntersecting));
    };
  return (
    s.useEffect(() => {
      const l = a?.current;
      if (!!!window.IntersectionObserver || c || !l) return;
      const t = { threshold: m, root: n, rootMargin: o },
        d = new IntersectionObserver(p, t);
      return (d.observe(l), () => d.disconnect());
    }, [a, m, n, o, c]),
    { isIntersecting: f, entry: i }
  );
}
const B = ({
  src: a,
  alt: u,
  className: m = '',
  width: n,
  height: o,
  fallbackSrc:
    r = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
  priority: i = !1,
  onLoad: g,
  onError: f,
  loading: x = 'lazy',
  sizes: c,
  srcSet: p,
  aspectRatio: l,
  objectFit: y = 'cover',
}) => {
  const [t, d] = s.useState(i ? a : ''),
    [b, S] = s.useState(!1),
    [v, z] = s.useState(!1),
    [w, N] = s.useState(0),
    E = s.useRef(null),
    { isIntersecting: I } = M(E, { threshold: 0.1, rootMargin: '50px' });
  s.useEffect(() => {
    (I || i) &&
      !t &&
      !v &&
      (N(Date.now()),
      d(a),
      j.debug('Image loading started', {
        component: 'OptimizedImage',
        src: a,
        priority: i,
        isIntersecting: I,
      }));
  }, [I, i, a, t, v]);
  const R = (O) => {
      S(!0);
      const h = Date.now() - w;
      (j.debug('Image loaded successfully', {
        component: 'OptimizedImage',
        src: t,
        loadTime: `${h}ms`,
      }),
        g?.());
    },
    $ = (O) => {
      z(!0);
      const h = Date.now() - w;
      (j.warn('Image failed to load, using fallback', {
        component: 'OptimizedImage',
        originalSrc: a,
        fallbackSrc: r,
        loadTime: `${h}ms`,
      }),
        t !== r && r && (d(r), z(!1)),
        f?.(O.nativeEvent));
    },
    L = {
      aspectRatio: l || (n && o ? `${n}/${o}` : void 0),
      width: n ? `${n}px` : void 0,
      height: o ? `${o}px` : void 0,
    },
    T = { objectFit: y, transition: 'opacity 0.3s ease-in-out', opacity: b ? 1 : 0 };
  return e.jsxs('div', {
    className: `relative overflow-hidden bg-gray-100 ${m}`,
    style: L,
    children: [
      !b &&
        e.jsx('div', {
          className:
            'absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200',
          children: e.jsxs('div', {
            className: 'flex flex-col items-center text-gray-400',
            children: [
              e.jsx('svg', {
                className: 'w-8 h-8 animate-pulse',
                fill: 'currentColor',
                viewBox: '0 0 20 20',
                children: e.jsx('path', {
                  fillRule: 'evenodd',
                  d: 'M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z',
                  clipRule: 'evenodd',
                }),
              }),
              e.jsx('span', { className: 'text-xs mt-1', children: 'Loading...' }),
            ],
          }),
        }),
      t &&
        e.jsx('img', {
          ref: E,
          src: t,
          alt: u,
          width: n,
          height: o,
          loading: x,
          sizes: c,
          srcSet: p,
          style: T,
          className: 'w-full h-full',
          onLoad: R,
          onError: $,
          decoding: 'async',
        }),
      v &&
        t === r &&
        e.jsx('div', {
          className: 'absolute inset-0 flex items-center justify-center bg-gray-200',
          children: e.jsxs('div', {
            className: 'flex flex-col items-center text-gray-500',
            children: [
              e.jsx('svg', {
                className: 'w-8 h-8',
                fill: 'currentColor',
                viewBox: '0 0 20 20',
                children: e.jsx('path', {
                  fillRule: 'evenodd',
                  d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z',
                  clipRule: 'evenodd',
                }),
              }),
              e.jsx('span', { className: 'text-xs mt-1', children: 'Failed to load' }),
            ],
          }),
        }),
    ],
  });
};
export { B as O };
//# sourceMappingURL=OptimizedImage-aUUc6jy1.js.map
