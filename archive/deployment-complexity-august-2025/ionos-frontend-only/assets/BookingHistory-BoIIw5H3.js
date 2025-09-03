import { g as z, r as v, R as T } from './vendor-VgjaNQN2.js';
import { f as ue, e as D, l as V, j as n, g as de, B as Y } from './index-BipxYy_H.js';
import {
  S as fe,
  F as me,
  b as he,
  M as pe,
  C as xe,
  U as ge,
  a as ye,
  P as ve,
  f as Te,
} from './ui-c8TFxX-w.js';
var H, Z;
function be() {
  if (Z) return H;
  Z = 1;
  var e = typeof Element < 'u',
    t = typeof Map == 'function',
    r = typeof Set == 'function',
    s = typeof ArrayBuffer == 'function' && !!ArrayBuffer.isView;
  function i(a, o) {
    if (a === o) return !0;
    if (a && o && typeof a == 'object' && typeof o == 'object') {
      if (a.constructor !== o.constructor) return !1;
      var c, l, u;
      if (Array.isArray(a)) {
        if (((c = a.length), c != o.length)) return !1;
        for (l = c; l-- !== 0; ) if (!i(a[l], o[l])) return !1;
        return !0;
      }
      var f;
      if (t && a instanceof Map && o instanceof Map) {
        if (a.size !== o.size) return !1;
        for (f = a.entries(); !(l = f.next()).done; ) if (!o.has(l.value[0])) return !1;
        for (f = a.entries(); !(l = f.next()).done; )
          if (!i(l.value[1], o.get(l.value[0]))) return !1;
        return !0;
      }
      if (r && a instanceof Set && o instanceof Set) {
        if (a.size !== o.size) return !1;
        for (f = a.entries(); !(l = f.next()).done; ) if (!o.has(l.value[0])) return !1;
        return !0;
      }
      if (s && ArrayBuffer.isView(a) && ArrayBuffer.isView(o)) {
        if (((c = a.length), c != o.length)) return !1;
        for (l = c; l-- !== 0; ) if (a[l] !== o[l]) return !1;
        return !0;
      }
      if (a.constructor === RegExp) return a.source === o.source && a.flags === o.flags;
      if (
        a.valueOf !== Object.prototype.valueOf &&
        typeof a.valueOf == 'function' &&
        typeof o.valueOf == 'function'
      )
        return a.valueOf() === o.valueOf();
      if (
        a.toString !== Object.prototype.toString &&
        typeof a.toString == 'function' &&
        typeof o.toString == 'function'
      )
        return a.toString() === o.toString();
      if (((u = Object.keys(a)), (c = u.length), c !== Object.keys(o).length)) return !1;
      for (l = c; l-- !== 0; ) if (!Object.prototype.hasOwnProperty.call(o, u[l])) return !1;
      if (e && a instanceof Element) return !1;
      for (l = c; l-- !== 0; )
        if (
          !((u[l] === '_owner' || u[l] === '__v' || u[l] === '__o') && a.$$typeof) &&
          !i(a[u[l]], o[u[l]])
        )
          return !1;
      return !0;
    }
    return a !== a && o !== o;
  }
  return (
    (H = function (o, c) {
      try {
        return i(o, c);
      } catch (l) {
        if ((l.message || '').match(/stack|recursion/i))
          return (console.warn('react-fast-compare cannot handle circular refs'), !1);
        throw l;
      }
    }),
    H
  );
}
var we = be();
const je = z(we);
var L, G;
function Ce() {
  if (G) return L;
  G = 1;
  var e = function (t, r, s, i, a, o, c, l) {
    if (!t) {
      var u;
      if (r === void 0)
        u = new Error(
          'Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.',
        );
      else {
        var f = [s, i, a, o, c, l],
          m = 0;
        ((u = new Error(
          r.replace(/%s/g, function () {
            return f[m++];
          }),
        )),
          (u.name = 'Invariant Violation'));
      }
      throw ((u.framesToPop = 1), u);
    }
  };
  return ((L = e), L);
}
var Se = Ce();
const W = z(Se);
var R, J;
function Ae() {
  return (
    J ||
      ((J = 1),
      (R = function (t, r, s, i) {
        var a = s ? s.call(i, t, r) : void 0;
        if (a !== void 0) return !!a;
        if (t === r) return !0;
        if (typeof t != 'object' || !t || typeof r != 'object' || !r) return !1;
        var o = Object.keys(t),
          c = Object.keys(r);
        if (o.length !== c.length) return !1;
        for (var l = Object.prototype.hasOwnProperty.bind(r), u = 0; u < o.length; u++) {
          var f = o[u];
          if (!l(f)) return !1;
          var m = t[f],
            h = r[f];
          if (((a = s ? s.call(i, m, h, f) : void 0), a === !1 || (a === void 0 && m !== h)))
            return !1;
        }
        return !0;
      })),
    R
  );
}
var Ne = Ae();
const Ee = z(Ne);
var re = ((e) => (
    (e.BASE = 'base'),
    (e.BODY = 'body'),
    (e.HEAD = 'head'),
    (e.HTML = 'html'),
    (e.LINK = 'link'),
    (e.META = 'meta'),
    (e.NOSCRIPT = 'noscript'),
    (e.SCRIPT = 'script'),
    (e.STYLE = 'style'),
    (e.TITLE = 'title'),
    (e.FRAGMENT = 'Symbol(react.fragment)'),
    e
  ))(re || {}),
  M = {
    link: { rel: ['amphtml', 'canonical', 'alternate'] },
    script: { type: ['application/ld+json'] },
    meta: {
      charset: '',
      name: ['generator', 'robots', 'description'],
      property: [
        'og:type',
        'og:title',
        'og:url',
        'og:image',
        'og:image:alt',
        'og:description',
        'twitter:url',
        'twitter:title',
        'twitter:description',
        'twitter:image',
        'twitter:image:alt',
        'twitter:card',
        'twitter:site',
      ],
    },
  },
  Q = Object.values(re),
  K = {
    accesskey: 'accessKey',
    charset: 'charSet',
    class: 'className',
    contenteditable: 'contentEditable',
    contextmenu: 'contextMenu',
    'http-equiv': 'httpEquiv',
    itemprop: 'itemProp',
    tabindex: 'tabIndex',
  },
  Oe = Object.entries(K).reduce((e, [t, r]) => ((e[r] = t), e), {}),
  g = 'data-rh',
  j = {
    DEFAULT_TITLE: 'defaultTitle',
    DEFER: 'defer',
    ENCODE_SPECIAL_CHARACTERS: 'encodeSpecialCharacters',
    ON_CHANGE_CLIENT_STATE: 'onChangeClientState',
    TITLE_TEMPLATE: 'titleTemplate',
    PRIORITIZE_SEO_TAGS: 'prioritizeSeoTags',
  },
  C = (e, t) => {
    for (let r = e.length - 1; r >= 0; r -= 1) {
      const s = e[r];
      if (Object.prototype.hasOwnProperty.call(s, t)) return s[t];
    }
    return null;
  },
  $e = (e) => {
    let t = C(e, 'title');
    const r = C(e, j.TITLE_TEMPLATE);
    if ((Array.isArray(t) && (t = t.join('')), r && t)) return r.replace(/%s/g, () => t);
    const s = C(e, j.DEFAULT_TITLE);
    return t || s || void 0;
  },
  Pe = (e) => C(e, j.ON_CHANGE_CLIENT_STATE) || (() => {}),
  k = (e, t) =>
    t
      .filter((r) => typeof r[e] < 'u')
      .map((r) => r[e])
      .reduce((r, s) => ({ ...r, ...s }), {}),
  Ie = (e, t) =>
    t
      .filter((r) => typeof r.base < 'u')
      .map((r) => r.base)
      .reverse()
      .reduce((r, s) => {
        if (!r.length) {
          const i = Object.keys(s);
          for (let a = 0; a < i.length; a += 1) {
            const c = i[a].toLowerCase();
            if (e.indexOf(c) !== -1 && s[c]) return r.concat(s);
          }
        }
        return r;
      }, []),
  De = (e) => console && typeof console.warn == 'function' && console.warn(e),
  S = (e, t, r) => {
    const s = {};
    return r
      .filter((i) =>
        Array.isArray(i[e])
          ? !0
          : (typeof i[e] < 'u' &&
              De(`Helmet: ${e} should be of type "Array". Instead found type "${typeof i[e]}"`),
            !1),
      )
      .map((i) => i[e])
      .reverse()
      .reduce((i, a) => {
        const o = {};
        a.filter((l) => {
          let u;
          const f = Object.keys(l);
          for (let h = 0; h < f.length; h += 1) {
            const p = f[h],
              y = p.toLowerCase();
            (t.indexOf(y) !== -1 &&
              !(u === 'rel' && l[u].toLowerCase() === 'canonical') &&
              !(y === 'rel' && l[y].toLowerCase() === 'stylesheet') &&
              (u = y),
              t.indexOf(p) !== -1 &&
                (p === 'innerHTML' || p === 'cssText' || p === 'itemprop') &&
                (u = p));
          }
          if (!u || !l[u]) return !1;
          const m = l[u].toLowerCase();
          return (s[u] || (s[u] = {}), o[u] || (o[u] = {}), s[u][m] ? !1 : ((o[u][m] = !0), !0));
        })
          .reverse()
          .forEach((l) => i.push(l));
        const c = Object.keys(o);
        for (let l = 0; l < c.length; l += 1) {
          const u = c[l],
            f = { ...s[u], ...o[u] };
          s[u] = f;
        }
        return i;
      }, [])
      .reverse();
  },
  He = (e, t) => {
    if (Array.isArray(e) && e.length) {
      for (let r = 0; r < e.length; r += 1) if (e[r][t]) return !0;
    }
    return !1;
  },
  Le = (e) => ({
    baseTag: Ie(['href'], e),
    bodyAttributes: k('bodyAttributes', e),
    defer: C(e, j.DEFER),
    encode: C(e, j.ENCODE_SPECIAL_CHARACTERS),
    htmlAttributes: k('htmlAttributes', e),
    linkTags: S('link', ['rel', 'href'], e),
    metaTags: S('meta', ['name', 'charset', 'http-equiv', 'property', 'itemprop'], e),
    noscriptTags: S('noscript', ['innerHTML'], e),
    onChangeClientState: Pe(e),
    scriptTags: S('script', ['src', 'innerHTML'], e),
    styleTags: S('style', ['cssText'], e),
    title: $e(e),
    titleAttributes: k('titleAttributes', e),
    prioritizeSeoTags: He(e, j.PRIORITIZE_SEO_TAGS),
  }),
  se = (e) => (Array.isArray(e) ? e.join('') : e),
  Re = (e, t) => {
    const r = Object.keys(e);
    for (let s = 0; s < r.length; s += 1) if (t[r[s]] && t[r[s]].includes(e[r[s]])) return !0;
    return !1;
  },
  _ = (e, t) =>
    Array.isArray(e)
      ? e.reduce((r, s) => (Re(s, t) ? r.priority.push(s) : r.default.push(s), r), {
          priority: [],
          default: [],
        })
      : { default: e, priority: [] },
  X = (e, t) => ({ ...e, [t]: void 0 }),
  Me = ['noscript', 'script', 'style'],
  F = (e, t = !0) =>
    t === !1
      ? String(e)
      : String(e)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;'),
  ae = (e) =>
    Object.keys(e).reduce((t, r) => {
      const s = typeof e[r] < 'u' ? `${r}="${e[r]}"` : `${r}`;
      return t ? `${t} ${s}` : s;
    }, ''),
  ke = (e, t, r, s) => {
    const i = ae(r),
      a = se(t);
    return i ? `<${e} ${g}="true" ${i}>${F(a, s)}</${e}>` : `<${e} ${g}="true">${F(a, s)}</${e}>`;
  },
  _e = (e, t, r = !0) =>
    t.reduce((s, i) => {
      const a = i,
        o = Object.keys(a)
          .filter((u) => !(u === 'innerHTML' || u === 'cssText'))
          .reduce((u, f) => {
            const m = typeof a[f] > 'u' ? f : `${f}="${F(a[f], r)}"`;
            return u ? `${u} ${m}` : m;
          }, ''),
        c = a.innerHTML || a.cssText || '',
        l = Me.indexOf(e) === -1;
      return `${s}<${e} ${g}="true" ${o}${l ? '/>' : `>${c}</${e}>`}`;
    }, ''),
  ne = (e, t = {}) =>
    Object.keys(e).reduce((r, s) => {
      const i = K[s];
      return ((r[i || s] = e[s]), r);
    }, t),
  Fe = (e, t, r) => {
    const s = { key: t, [g]: !0 },
      i = ne(r, s);
    return [T.createElement('title', i, t)];
  },
  I = (e, t) =>
    t.map((r, s) => {
      const i = { key: s, [g]: !0 };
      return (
        Object.keys(r).forEach((a) => {
          const c = K[a] || a;
          if (c === 'innerHTML' || c === 'cssText') {
            const l = r.innerHTML || r.cssText;
            i.dangerouslySetInnerHTML = { __html: l };
          } else i[c] = r[a];
        }),
        T.createElement(e, i)
      );
    }),
  x = (e, t, r = !0) => {
    switch (e) {
      case 'title':
        return {
          toComponent: () => Fe(e, t.title, t.titleAttributes),
          toString: () => ke(e, t.title, t.titleAttributes, r),
        };
      case 'bodyAttributes':
      case 'htmlAttributes':
        return { toComponent: () => ne(t), toString: () => ae(t) };
      default:
        return { toComponent: () => I(e, t), toString: () => _e(e, t, r) };
    }
  },
  qe = ({ metaTags: e, linkTags: t, scriptTags: r, encode: s }) => {
    const i = _(e, M.meta),
      a = _(t, M.link),
      o = _(r, M.script);
    return {
      priorityMethods: {
        toComponent: () => [
          ...I('meta', i.priority),
          ...I('link', a.priority),
          ...I('script', o.priority),
        ],
        toString: () =>
          `${x('meta', i.priority, s)} ${x('link', a.priority, s)} ${x('script', o.priority, s)}`,
      },
      metaTags: i.default,
      linkTags: a.default,
      scriptTags: o.default,
    };
  },
  Be = (e) => {
    const {
      baseTag: t,
      bodyAttributes: r,
      encode: s = !0,
      htmlAttributes: i,
      noscriptTags: a,
      styleTags: o,
      title: c = '',
      titleAttributes: l,
      prioritizeSeoTags: u,
    } = e;
    let { linkTags: f, metaTags: m, scriptTags: h } = e,
      p = { toComponent: () => {}, toString: () => '' };
    return (
      u && ({ priorityMethods: p, linkTags: f, metaTags: m, scriptTags: h } = qe(e)),
      {
        priority: p,
        base: x('base', t, s),
        bodyAttributes: x('bodyAttributes', r, s),
        htmlAttributes: x('htmlAttributes', i, s),
        link: x('link', f, s),
        meta: x('meta', m, s),
        noscript: x('noscript', a, s),
        script: x('script', h, s),
        style: x('style', o, s),
        title: x('title', { title: c, titleAttributes: l }, s),
      }
    );
  },
  q = Be,
  P = [],
  le = !!(typeof window < 'u' && window.document && window.document.createElement),
  B = class {
    instances = [];
    canUseDOM = le;
    context;
    value = {
      setHelmet: (e) => {
        this.context.helmet = e;
      },
      helmetInstances: {
        get: () => (this.canUseDOM ? P : this.instances),
        add: (e) => {
          (this.canUseDOM ? P : this.instances).push(e);
        },
        remove: (e) => {
          const t = (this.canUseDOM ? P : this.instances).indexOf(e);
          (this.canUseDOM ? P : this.instances).splice(t, 1);
        },
      },
    };
    constructor(e, t) {
      ((this.context = e),
        (this.canUseDOM = t || !1),
        t ||
          (e.helmet = q({
            baseTag: [],
            bodyAttributes: {},
            htmlAttributes: {},
            linkTags: [],
            metaTags: [],
            noscriptTags: [],
            scriptTags: [],
            styleTags: [],
            title: '',
            titleAttributes: {},
          })));
    }
  },
  Ue = {},
  ie = T.createContext(Ue),
  ze = class oe extends v.Component {
    static canUseDOM = le;
    helmetData;
    constructor(t) {
      (super(t), (this.helmetData = new B(this.props.context || {}, oe.canUseDOM)));
    }
    render() {
      return T.createElement(ie.Provider, { value: this.helmetData.value }, this.props.children);
    }
  },
  w = (e, t) => {
    const r = document.head || document.querySelector('head'),
      s = r.querySelectorAll(`${e}[${g}]`),
      i = [].slice.call(s),
      a = [];
    let o;
    return (
      t &&
        t.length &&
        t.forEach((c) => {
          const l = document.createElement(e);
          for (const u in c)
            if (Object.prototype.hasOwnProperty.call(c, u))
              if (u === 'innerHTML') l.innerHTML = c.innerHTML;
              else if (u === 'cssText')
                l.styleSheet
                  ? (l.styleSheet.cssText = c.cssText)
                  : l.appendChild(document.createTextNode(c.cssText));
              else {
                const f = u,
                  m = typeof c[f] > 'u' ? '' : c[f];
                l.setAttribute(u, m);
              }
          (l.setAttribute(g, 'true'),
            i.some((u, f) => ((o = f), l.isEqualNode(u))) ? i.splice(o, 1) : a.push(l));
        }),
      i.forEach((c) => c.parentNode?.removeChild(c)),
      a.forEach((c) => r.appendChild(c)),
      { oldTags: i, newTags: a }
    );
  },
  U = (e, t) => {
    const r = document.getElementsByTagName(e)[0];
    if (!r) return;
    const s = r.getAttribute(g),
      i = s ? s.split(',') : [],
      a = [...i],
      o = Object.keys(t);
    for (const c of o) {
      const l = t[c] || '';
      (r.getAttribute(c) !== l && r.setAttribute(c, l), i.indexOf(c) === -1 && i.push(c));
      const u = a.indexOf(c);
      u !== -1 && a.splice(u, 1);
    }
    for (let c = a.length - 1; c >= 0; c -= 1) r.removeAttribute(a[c]);
    i.length === a.length
      ? r.removeAttribute(g)
      : r.getAttribute(g) !== o.join(',') && r.setAttribute(g, o.join(','));
  },
  Ke = (e, t) => {
    (typeof e < 'u' && document.title !== e && (document.title = se(e)), U('title', t));
  },
  ee = (e, t) => {
    const {
      baseTag: r,
      bodyAttributes: s,
      htmlAttributes: i,
      linkTags: a,
      metaTags: o,
      noscriptTags: c,
      onChangeClientState: l,
      scriptTags: u,
      styleTags: f,
      title: m,
      titleAttributes: h,
    } = e;
    (U('body', s), U('html', i), Ke(m, h));
    const p = {
        baseTag: w('base', r),
        linkTags: w('link', a),
        metaTags: w('meta', o),
        noscriptTags: w('noscript', c),
        scriptTags: w('script', u),
        styleTags: w('style', f),
      },
      y = {},
      N = {};
    (Object.keys(p).forEach((b) => {
      const { newTags: E, oldTags: O } = p[b];
      (E.length && (y[b] = E), O.length && (N[b] = p[b].oldTags));
    }),
      t && t(),
      l(e, y, N));
  },
  A = null,
  Ve = (e) => {
    (A && cancelAnimationFrame(A),
      e.defer
        ? (A = requestAnimationFrame(() => {
            ee(e, () => {
              A = null;
            });
          }))
        : (ee(e), (A = null)));
  },
  Ye = Ve,
  te = class extends v.Component {
    rendered = !1;
    shouldComponentUpdate(e) {
      return !Ee(e, this.props);
    }
    componentDidUpdate() {
      this.emitChange();
    }
    componentWillUnmount() {
      const { helmetInstances: e } = this.props.context;
      (e.remove(this), this.emitChange());
    }
    emitChange() {
      const { helmetInstances: e, setHelmet: t } = this.props.context;
      let r = null;
      const s = Le(
        e.get().map((i) => {
          const a = { ...i.props };
          return (delete a.context, a);
        }),
      );
      (ze.canUseDOM ? Ye(s) : q && (r = q(s)), t(r));
    }
    init() {
      if (this.rendered) return;
      this.rendered = !0;
      const { helmetInstances: e } = this.props.context;
      (e.add(this), this.emitChange());
    }
    render() {
      return (this.init(), null);
    }
  },
  Je = class extends v.Component {
    static defaultProps = { defer: !0, encodeSpecialCharacters: !0, prioritizeSeoTags: !1 };
    shouldComponentUpdate(e) {
      return !je(X(this.props, 'helmetData'), X(e, 'helmetData'));
    }
    mapNestedChildrenToProps(e, t) {
      if (!t) return null;
      switch (e.type) {
        case 'script':
        case 'noscript':
          return { innerHTML: t };
        case 'style':
          return { cssText: t };
        default:
          throw new Error(
            `<${e.type} /> elements are self-closing and can not contain children. Refer to our API for more information.`,
          );
      }
    }
    flattenArrayTypeChildren(e, t, r, s) {
      return {
        ...t,
        [e.type]: [...(t[e.type] || []), { ...r, ...this.mapNestedChildrenToProps(e, s) }],
      };
    }
    mapObjectTypeChildren(e, t, r, s) {
      switch (e.type) {
        case 'title':
          return { ...t, [e.type]: s, titleAttributes: { ...r } };
        case 'body':
          return { ...t, bodyAttributes: { ...r } };
        case 'html':
          return { ...t, htmlAttributes: { ...r } };
        default:
          return { ...t, [e.type]: { ...r } };
      }
    }
    mapArrayTypeChildrenToProps(e, t) {
      let r = { ...t };
      return (
        Object.keys(e).forEach((s) => {
          r = { ...r, [s]: e[s] };
        }),
        r
      );
    }
    warnOnInvalidChildren(e, t) {
      return (
        W(
          Q.some((r) => e.type === r),
          typeof e.type == 'function'
            ? 'You may be attempting to nest <Helmet> components within each other, which is not allowed. Refer to our API for more information.'
            : `Only elements types ${Q.join(', ')} are allowed. Helmet does not support rendering <${e.type}> elements. Refer to our API for more information.`,
        ),
        W(
          !t || typeof t == 'string' || (Array.isArray(t) && !t.some((r) => typeof r != 'string')),
          `Helmet expects a string as a child of <${e.type}>. Did you forget to wrap your children in braces? ( <${e.type}>{\`\`}</${e.type}> ) Refer to our API for more information.`,
        ),
        !0
      );
    }
    mapChildrenToProps(e, t) {
      let r = {};
      return (
        T.Children.forEach(e, (s) => {
          if (!s || !s.props) return;
          const { children: i, ...a } = s.props,
            o = Object.keys(a).reduce((l, u) => ((l[Oe[u] || u] = a[u]), l), {});
          let { type: c } = s;
          switch (
            (typeof c == 'symbol' ? (c = c.toString()) : this.warnOnInvalidChildren(s, i), c)
          ) {
            case 'Symbol(react.fragment)':
              t = this.mapChildrenToProps(i, t);
              break;
            case 'link':
            case 'meta':
            case 'noscript':
            case 'script':
            case 'style':
              r = this.flattenArrayTypeChildren(s, r, o, i);
              break;
            default:
              t = this.mapObjectTypeChildren(s, t, o, i);
              break;
          }
        }),
        this.mapArrayTypeChildrenToProps(r, t)
      );
    }
    render() {
      const { children: e, ...t } = this.props;
      let r = { ...t },
        { helmetData: s } = t;
      if ((e && (r = this.mapChildrenToProps(e, r)), s && !(s instanceof B))) {
        const i = s;
        ((s = new B(i.context, !0)), delete r.helmetData);
      }
      return s
        ? T.createElement(te, { ...r, context: s.value })
        : T.createElement(ie.Consumer, null, (i) => T.createElement(te, { ...r, context: i }));
    }
  };
const Qe = ({ className: e = '' }) => {
  const { user: t } = ue(),
    [r, s] = v.useState([]),
    [i, a] = v.useState(null),
    [o, c] = v.useState(!0),
    [l, u] = v.useState(''),
    [f, m] = v.useState('all'),
    [h, p] = v.useState(!1);
  v.useEffect(() => {
    t?.id && y();
  }, [t?.id]);
  const y = async () => {
      if (t?.id)
        try {
          c(!0);
          const [d, $] = await Promise.all([D.getUserBookings(t.id), D.getBookingStats(t.id)]);
          (s(d),
            a($),
            V.info('Booking history loaded successfully:', {
              userId: t.id,
              bookingCount: d.length,
            }));
        } catch (d) {
          V.error('Failed to load booking history:', d);
        } finally {
          c(!1);
        }
    },
    N = async (d) => {
      (await D.cancelBooking(d, 'Cancelled by user')) && (await y());
    },
    b = (d) => {
      switch (d.toLowerCase()) {
        case 'confirmed':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'cancelled':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'completed':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'checked_in':
          return 'bg-purple-100 text-purple-800 border-purple-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    },
    E = (d) => {
      switch (d.toLowerCase()) {
        case 'completed':
          return 'text-green-600';
        case 'pending':
          return 'text-yellow-600';
        case 'failed':
          return 'text-red-600';
        case 'refunded':
          return 'text-blue-600';
        default:
          return 'text-gray-600';
      }
    },
    O = r.filter((d) => {
      const $ =
          d.hotelName.toLowerCase().includes(l.toLowerCase()) ||
          d.confirmationNumber.toLowerCase().includes(l.toLowerCase()) ||
          d.hotelCity?.toLowerCase().includes(l.toLowerCase()),
        ce = f === 'all' || d.status === f;
      return $ && ce;
    });
  return t
    ? o
      ? n.jsx('div', {
          className: `flex justify-center py-12 ${e}`,
          children: n.jsx(de, { size: 'lg' }),
        })
      : n.jsxs('div', {
          className: `space-y-6 ${e}`,
          children: [
            n.jsxs('div', {
              className:
                'bg-gradient-to-br from-slate-50 to-cream-50 rounded-2xl p-6 border border-slate-200',
              children: [
                n.jsx('h2', {
                  className:
                    'text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6',
                  children: 'My Booking History',
                }),
                i &&
                  n.jsxs('div', {
                    className: 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-6',
                    children: [
                      n.jsxs('div', {
                        className: 'text-center',
                        children: [
                          n.jsx('div', {
                            className: 'text-2xl font-bold text-luxury-navy',
                            children: i.totalBookings,
                          }),
                          n.jsx('div', {
                            className: 'text-sm text-slate-600',
                            children: 'Total Bookings',
                          }),
                        ],
                      }),
                      n.jsxs('div', {
                        className: 'text-center',
                        children: [
                          n.jsx('div', {
                            className: 'text-2xl font-bold text-green-600',
                            children: i.upcomingBookings,
                          }),
                          n.jsx('div', {
                            className: 'text-sm text-slate-600',
                            children: 'Upcoming',
                          }),
                        ],
                      }),
                      n.jsxs('div', {
                        className: 'text-center',
                        children: [
                          n.jsx('div', {
                            className: 'text-2xl font-bold text-blue-600',
                            children: i.completedBookings,
                          }),
                          n.jsx('div', {
                            className: 'text-sm text-slate-600',
                            children: 'Completed',
                          }),
                        ],
                      }),
                      n.jsxs('div', {
                        className: 'text-center',
                        children: [
                          n.jsxs('div', {
                            className: 'text-2xl font-bold text-luxury-gold',
                            children: ['$', i.totalSpent.toLocaleString()],
                          }),
                          n.jsx('div', {
                            className: 'text-sm text-slate-600',
                            children: 'Total Spent',
                          }),
                        ],
                      }),
                    ],
                  }),
                n.jsxs('div', {
                  className: 'space-y-4',
                  children: [
                    n.jsxs('div', {
                      className: 'flex flex-col sm:flex-row gap-4',
                      children: [
                        n.jsxs('div', {
                          className: 'relative flex-1',
                          children: [
                            n.jsx(fe, {
                              className:
                                'absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400',
                            }),
                            n.jsx('input', {
                              type: 'text',
                              placeholder: 'Search by hotel name, confirmation number, or city...',
                              value: l,
                              onChange: (d) => u(d.target.value),
                              className:
                                'w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-luxury-navy focus:border-luxury-navy transition-all',
                            }),
                          ],
                        }),
                        n.jsxs(Y, {
                          variant: 'outline',
                          size: 'md',
                          onClick: () => p(!h),
                          className: 'flex items-center gap-2',
                          children: [
                            n.jsx(me, { className: 'w-4 h-4' }),
                            'Filters',
                            n.jsx(he, {
                              className: `w-4 h-4 transition-transform ${h ? 'rotate-180' : ''}`,
                            }),
                          ],
                        }),
                      ],
                    }),
                    h &&
                      n.jsx('div', {
                        className:
                          'flex flex-wrap gap-2 p-4 bg-white rounded-xl border border-slate-200',
                        children: ['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(
                          (d) =>
                            n.jsx(
                              'button',
                              {
                                onClick: () => m(d),
                                className: `px-4 py-2 rounded-lg text-sm font-medium transition-all ${f === d ? 'bg-luxury-navy text-white shadow-luxury' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`,
                                children:
                                  d === 'all'
                                    ? 'All Bookings'
                                    : d.charAt(0).toUpperCase() + d.slice(1),
                              },
                              d,
                            ),
                        ),
                      }),
                  ],
                }),
              ],
            }),
            O.length === 0
              ? n.jsx('div', {
                  className: 'text-center py-12',
                  children: n.jsxs('div', {
                    className:
                      'bg-gradient-to-br from-slate-50 to-cream-50 rounded-2xl p-8 border border-slate-200',
                    children: [
                      n.jsx('h3', {
                        className: 'text-xl font-semibold text-slate-800 mb-2',
                        children:
                          l || f !== 'all' ? 'No bookings match your search' : 'No bookings yet',
                      }),
                      n.jsx('p', {
                        className: 'text-slate-600',
                        children:
                          l || f !== 'all'
                            ? 'Try adjusting your filters or search terms'
                            : 'Start exploring our amazing hotels and make your first booking!',
                      }),
                    ],
                  }),
                })
              : n.jsx('div', {
                  className: 'space-y-4',
                  children: O.map((d) =>
                    n.jsx(
                      'div',
                      {
                        className:
                          'bg-white rounded-2xl border border-slate-200 shadow-luxury hover:shadow-luxury-md transition-shadow overflow-hidden',
                        children: n.jsxs('div', {
                          className: 'p-6',
                          children: [
                            n.jsxs('div', {
                              className:
                                'flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6',
                              children: [
                                n.jsxs('div', {
                                  className: 'flex gap-4',
                                  children: [
                                    n.jsx('div', {
                                      className: 'flex-shrink-0',
                                      children: n.jsx('img', {
                                        src:
                                          d.hotelImage ||
                                          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=120&h=90&fit=crop&crop=center',
                                        alt: d.hotelName,
                                        className:
                                          'w-20 h-16 sm:w-24 sm:h-18 object-cover rounded-xl',
                                      }),
                                    }),
                                    n.jsxs('div', {
                                      className: 'flex-1 min-w-0',
                                      children: [
                                        n.jsxs('div', {
                                          className: 'flex items-start justify-between mb-2',
                                          children: [
                                            n.jsxs('div', {
                                              children: [
                                                n.jsx('h3', {
                                                  className:
                                                    'text-lg font-semibold text-slate-900 truncate',
                                                  children: d.hotelName,
                                                }),
                                                n.jsxs('div', {
                                                  className:
                                                    'flex items-center text-slate-600 text-sm mt-1',
                                                  children: [
                                                    n.jsx(pe, { className: 'w-4 h-4 mr-1' }),
                                                    d.hotelCity,
                                                  ],
                                                }),
                                              ],
                                            }),
                                            n.jsxs('div', {
                                              className: 'flex flex-col items-end gap-2 ml-4',
                                              children: [
                                                n.jsx('span', {
                                                  className: `px-3 py-1 rounded-full text-xs font-medium border ${b(d.status)}`,
                                                  children:
                                                    d.status.charAt(0).toUpperCase() +
                                                    d.status.slice(1),
                                                }),
                                                n.jsx('div', {
                                                  className: `text-xs font-medium ${E(d.paymentStatus)}`,
                                                  children:
                                                    d.paymentStatus.charAt(0).toUpperCase() +
                                                    d.paymentStatus.slice(1),
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                        n.jsxs('div', {
                                          className: 'text-sm text-slate-600 space-y-1',
                                          children: [
                                            n.jsxs('div', {
                                              className: 'flex items-center',
                                              children: [
                                                n.jsx(xe, { className: 'w-4 h-4 mr-2' }),
                                                new Date(d.checkIn).toLocaleDateString(),
                                                ' - ',
                                                new Date(d.checkOut).toLocaleDateString(),
                                                n.jsxs('span', {
                                                  className: 'ml-2 text-slate-500',
                                                  children: [
                                                    '(',
                                                    d.nights,
                                                    ' night',
                                                    d.nights > 1 ? 's' : '',
                                                    ')',
                                                  ],
                                                }),
                                              ],
                                            }),
                                            n.jsxs('div', {
                                              className: 'flex items-center',
                                              children: [
                                                n.jsx(ge, { className: 'w-4 h-4 mr-2' }),
                                                d.guests.adults,
                                                ' adult',
                                                d.guests.adults > 1 ? 's' : '',
                                                d.guests.children > 0 &&
                                                  `, ${d.guests.children} child${d.guests.children > 1 ? 'ren' : ''}`,
                                              ],
                                            }),
                                            n.jsxs('div', {
                                              className: 'flex items-center',
                                              children: [
                                                n.jsx(ye, { className: 'w-4 h-4 mr-2' }),
                                                'Booked on ',
                                                new Date(d.createdAt).toLocaleDateString(),
                                              ],
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                n.jsxs('div', {
                                  className: 'lg:text-right space-y-3',
                                  children: [
                                    n.jsxs('div', {
                                      children: [
                                        n.jsx('div', {
                                          className: 'text-xs text-slate-500 mb-1',
                                          children: 'Confirmation Number',
                                        }),
                                        n.jsx('div', {
                                          className:
                                            'font-mono text-sm font-semibold text-luxury-navy',
                                          children: d.confirmationNumber,
                                        }),
                                      ],
                                    }),
                                    n.jsxs('div', {
                                      children: [
                                        n.jsx('div', {
                                          className: 'text-xs text-slate-500 mb-1',
                                          children: 'Total Amount',
                                        }),
                                        n.jsxs('div', {
                                          className: 'text-xl font-bold text-luxury-gold',
                                          children: [
                                            d.currency,
                                            ' $',
                                            d.totalAmount.toLocaleString(),
                                          ],
                                        }),
                                      ],
                                    }),
                                    n.jsxs('div', {
                                      className: 'flex flex-col sm:flex-row lg:flex-col gap-2 pt-2',
                                      children: [
                                        d.isCancellable &&
                                          d.status === 'confirmed' &&
                                          n.jsx(Y, {
                                            variant: 'outline',
                                            size: 'sm',
                                            onClick: () => N(d.id),
                                            className:
                                              'text-red-600 border-red-200 hover:bg-red-50',
                                            children: 'Cancel Booking',
                                          }),
                                        d.status === 'confirmed' &&
                                          n.jsxs('div', {
                                            className: 'flex gap-2',
                                            children: [
                                              n.jsxs('a', {
                                                href: `tel:${d.guestInfo.phone}`,
                                                className:
                                                  'flex items-center gap-1 px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors',
                                                children: [
                                                  n.jsx(ve, { className: 'w-3 h-3' }),
                                                  'Call Hotel',
                                                ],
                                              }),
                                              n.jsxs('a', {
                                                href: `mailto:${d.guestInfo.email}`,
                                                className:
                                                  'flex items-center gap-1 px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors',
                                                children: [
                                                  n.jsx(Te, { className: 'w-3 h-3' }),
                                                  'Email',
                                                ],
                                              }),
                                            ],
                                          }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            d.specialRequests &&
                              n.jsxs('div', {
                                className: 'mt-4 pt-4 border-t border-slate-100',
                                children: [
                                  n.jsx('div', {
                                    className: 'text-xs text-slate-500 mb-1',
                                    children: 'Special Requests',
                                  }),
                                  n.jsx('div', {
                                    className: 'text-sm text-slate-700 bg-slate-50 rounded-lg p-3',
                                    children: d.specialRequests,
                                  }),
                                ],
                              }),
                          ],
                        }),
                      },
                      d.id,
                    ),
                  ),
                }),
          ],
        })
    : n.jsx('div', {
        className: `text-center py-12 ${e}`,
        children: n.jsxs('div', {
          className:
            'bg-gradient-to-br from-slate-50 to-cream-50 rounded-2xl p-8 border border-slate-200',
          children: [
            n.jsx('h3', {
              className: 'text-xl font-semibold text-slate-800 mb-2',
              children: 'Sign in to view your bookings',
            }),
            n.jsx('p', {
              className: 'text-slate-600',
              children: 'Access your booking history and manage your reservations',
            }),
          ],
        }),
      });
};
export { Qe as B, Je as H };
//# sourceMappingURL=BookingHistory-BoIIw5H3.js.map
