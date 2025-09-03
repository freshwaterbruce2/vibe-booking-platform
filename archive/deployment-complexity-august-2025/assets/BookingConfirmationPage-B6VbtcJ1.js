import { l as W, j as i, d as ie } from './index-BipxYy_H.js';
import { r as k, d as oe, c as se, u as ce } from './vendor-VgjaNQN2.js';
import { P as C, B as le } from './booking-BEeZsH1D.js';
import {
  q as Q,
  M as de,
  C as ue,
  U as me,
  f as K,
  P as Z,
  r as he,
  N as fe,
  O as ge,
  Q as ve,
  j as pe,
  p as xe,
  u as ye,
  v as be,
} from './ui-c8TFxX-w.js';
function I(r) {
  '@babel/helpers - typeof';
  return (
    (I =
      typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol'
        ? function (e) {
            return typeof e;
          }
        : function (e) {
            return e &&
              typeof Symbol == 'function' &&
              e.constructor === Symbol &&
              e !== Symbol.prototype
              ? 'symbol'
              : typeof e;
          }),
    I(r)
  );
}
function D(r) {
  if (r === null || r === !0 || r === !1) return NaN;
  var e = Number(r);
  return isNaN(e) ? e : e < 0 ? Math.ceil(e) : Math.floor(e);
}
function w(r, e) {
  if (e.length < r)
    throw new TypeError(
      r + ' argument' + (r > 1 ? 's' : '') + ' required, but only ' + e.length + ' present',
    );
}
function T(r) {
  w(1, arguments);
  var e = Object.prototype.toString.call(r);
  return r instanceof Date || (I(r) === 'object' && e === '[object Date]')
    ? new Date(r.getTime())
    : typeof r == 'number' || e === '[object Number]'
      ? new Date(r)
      : ((typeof r == 'string' || e === '[object String]') &&
          typeof console < 'u' &&
          (console.warn(
            "Starting with v2.0.0-beta.1 date-fns doesn't accept strings as date arguments. Please use `parseISO` to parse strings. See: https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#string-arguments",
          ),
          console.warn(new Error().stack)),
        new Date(NaN));
}
function we(r, e) {
  w(2, arguments);
  var t = T(r).getTime(),
    a = D(e);
  return new Date(t + a);
}
var Ne = {};
function B() {
  return Ne;
}
function je(r) {
  var e = new Date(
    Date.UTC(
      r.getFullYear(),
      r.getMonth(),
      r.getDate(),
      r.getHours(),
      r.getMinutes(),
      r.getSeconds(),
      r.getMilliseconds(),
    ),
  );
  return (e.setUTCFullYear(r.getFullYear()), r.getTime() - e.getTime());
}
function Ce(r) {
  return (
    w(1, arguments),
    r instanceof Date ||
      (I(r) === 'object' && Object.prototype.toString.call(r) === '[object Date]')
  );
}
function Pe(r) {
  if ((w(1, arguments), !Ce(r) && typeof r != 'number')) return !1;
  var e = T(r);
  return !isNaN(Number(e));
}
function Te(r, e) {
  w(2, arguments);
  var t = D(e);
  return we(r, -t);
}
var Oe = 864e5;
function Me(r) {
  w(1, arguments);
  var e = T(r),
    t = e.getTime();
  (e.setUTCMonth(0, 1), e.setUTCHours(0, 0, 0, 0));
  var a = e.getTime(),
    n = t - a;
  return Math.floor(n / Oe) + 1;
}
function q(r) {
  w(1, arguments);
  var e = 1,
    t = T(r),
    a = t.getUTCDay(),
    n = (a < e ? 7 : 0) + a - e;
  return (t.setUTCDate(t.getUTCDate() - n), t.setUTCHours(0, 0, 0, 0), t);
}
function ee(r) {
  w(1, arguments);
  var e = T(r),
    t = e.getUTCFullYear(),
    a = new Date(0);
  (a.setUTCFullYear(t + 1, 0, 4), a.setUTCHours(0, 0, 0, 0));
  var n = q(a),
    o = new Date(0);
  (o.setUTCFullYear(t, 0, 4), o.setUTCHours(0, 0, 0, 0));
  var s = q(o);
  return e.getTime() >= n.getTime() ? t + 1 : e.getTime() >= s.getTime() ? t : t - 1;
}
function Se(r) {
  w(1, arguments);
  var e = ee(r),
    t = new Date(0);
  (t.setUTCFullYear(e, 0, 4), t.setUTCHours(0, 0, 0, 0));
  var a = q(t);
  return a;
}
var ke = 6048e5;
function Ee(r) {
  w(1, arguments);
  var e = T(r),
    t = q(e).getTime() - Se(e).getTime();
  return Math.round(t / ke) + 1;
}
function H(r, e) {
  var t, a, n, o, s, d, h, u;
  w(1, arguments);
  var p = B(),
    v = D(
      (t =
        (a =
          (n =
            (o = e?.weekStartsOn) !== null && o !== void 0
              ? o
              : e == null ||
                  (s = e.locale) === null ||
                  s === void 0 ||
                  (d = s.options) === null ||
                  d === void 0
                ? void 0
                : d.weekStartsOn) !== null && n !== void 0
            ? n
            : p.weekStartsOn) !== null && a !== void 0
          ? a
          : (h = p.locale) === null || h === void 0 || (u = h.options) === null || u === void 0
            ? void 0
            : u.weekStartsOn) !== null && t !== void 0
        ? t
        : 0,
    );
  if (!(v >= 0 && v <= 6)) throw new RangeError('weekStartsOn must be between 0 and 6 inclusively');
  var g = T(r),
    x = g.getUTCDay(),
    y = (x < v ? 7 : 0) + x - v;
  return (g.setUTCDate(g.getUTCDate() - y), g.setUTCHours(0, 0, 0, 0), g);
}
function te(r, e) {
  var t, a, n, o, s, d, h, u;
  w(1, arguments);
  var p = T(r),
    v = p.getUTCFullYear(),
    g = B(),
    x = D(
      (t =
        (a =
          (n =
            (o = e?.firstWeekContainsDate) !== null && o !== void 0
              ? o
              : e == null ||
                  (s = e.locale) === null ||
                  s === void 0 ||
                  (d = s.options) === null ||
                  d === void 0
                ? void 0
                : d.firstWeekContainsDate) !== null && n !== void 0
            ? n
            : g.firstWeekContainsDate) !== null && a !== void 0
          ? a
          : (h = g.locale) === null || h === void 0 || (u = h.options) === null || u === void 0
            ? void 0
            : u.firstWeekContainsDate) !== null && t !== void 0
        ? t
        : 1,
    );
  if (!(x >= 1 && x <= 7))
    throw new RangeError('firstWeekContainsDate must be between 1 and 7 inclusively');
  var y = new Date(0);
  (y.setUTCFullYear(v + 1, 0, x), y.setUTCHours(0, 0, 0, 0));
  var O = H(y, e),
    c = new Date(0);
  (c.setUTCFullYear(v, 0, x), c.setUTCHours(0, 0, 0, 0));
  var l = H(c, e);
  return p.getTime() >= O.getTime() ? v + 1 : p.getTime() >= l.getTime() ? v : v - 1;
}
function Ue(r, e) {
  var t, a, n, o, s, d, h, u;
  w(1, arguments);
  var p = B(),
    v = D(
      (t =
        (a =
          (n =
            (o = e?.firstWeekContainsDate) !== null && o !== void 0
              ? o
              : e == null ||
                  (s = e.locale) === null ||
                  s === void 0 ||
                  (d = s.options) === null ||
                  d === void 0
                ? void 0
                : d.firstWeekContainsDate) !== null && n !== void 0
            ? n
            : p.firstWeekContainsDate) !== null && a !== void 0
          ? a
          : (h = p.locale) === null || h === void 0 || (u = h.options) === null || u === void 0
            ? void 0
            : u.firstWeekContainsDate) !== null && t !== void 0
        ? t
        : 1,
    ),
    g = te(r, e),
    x = new Date(0);
  (x.setUTCFullYear(g, 0, v), x.setUTCHours(0, 0, 0, 0));
  var y = H(x, e);
  return y;
}
var We = 6048e5;
function _e(r, e) {
  w(1, arguments);
  var t = T(r),
    a = H(t, e).getTime() - Ue(t, e).getTime();
  return Math.round(a / We) + 1;
}
function m(r, e) {
  for (var t = r < 0 ? '-' : '', a = Math.abs(r).toString(); a.length < e; ) a = '0' + a;
  return t + a;
}
var S = {
    y: function (e, t) {
      var a = e.getUTCFullYear(),
        n = a > 0 ? a : 1 - a;
      return m(t === 'yy' ? n % 100 : n, t.length);
    },
    M: function (e, t) {
      var a = e.getUTCMonth();
      return t === 'M' ? String(a + 1) : m(a + 1, 2);
    },
    d: function (e, t) {
      return m(e.getUTCDate(), t.length);
    },
    a: function (e, t) {
      var a = e.getUTCHours() / 12 >= 1 ? 'pm' : 'am';
      switch (t) {
        case 'a':
        case 'aa':
          return a.toUpperCase();
        case 'aaa':
          return a;
        case 'aaaaa':
          return a[0];
        case 'aaaa':
        default:
          return a === 'am' ? 'a.m.' : 'p.m.';
      }
    },
    h: function (e, t) {
      return m(e.getUTCHours() % 12 || 12, t.length);
    },
    H: function (e, t) {
      return m(e.getUTCHours(), t.length);
    },
    m: function (e, t) {
      return m(e.getUTCMinutes(), t.length);
    },
    s: function (e, t) {
      return m(e.getUTCSeconds(), t.length);
    },
    S: function (e, t) {
      var a = t.length,
        n = e.getUTCMilliseconds(),
        o = Math.floor(n * Math.pow(10, a - 3));
      return m(o, t.length);
    },
  },
  R = {
    midnight: 'midnight',
    noon: 'noon',
    morning: 'morning',
    afternoon: 'afternoon',
    evening: 'evening',
    night: 'night',
  },
  De = {
    G: function (e, t, a) {
      var n = e.getUTCFullYear() > 0 ? 1 : 0;
      switch (t) {
        case 'G':
        case 'GG':
        case 'GGG':
          return a.era(n, { width: 'abbreviated' });
        case 'GGGGG':
          return a.era(n, { width: 'narrow' });
        case 'GGGG':
        default:
          return a.era(n, { width: 'wide' });
      }
    },
    y: function (e, t, a) {
      if (t === 'yo') {
        var n = e.getUTCFullYear(),
          o = n > 0 ? n : 1 - n;
        return a.ordinalNumber(o, { unit: 'year' });
      }
      return S.y(e, t);
    },
    Y: function (e, t, a, n) {
      var o = te(e, n),
        s = o > 0 ? o : 1 - o;
      if (t === 'YY') {
        var d = s % 100;
        return m(d, 2);
      }
      return t === 'Yo' ? a.ordinalNumber(s, { unit: 'year' }) : m(s, t.length);
    },
    R: function (e, t) {
      var a = ee(e);
      return m(a, t.length);
    },
    u: function (e, t) {
      var a = e.getUTCFullYear();
      return m(a, t.length);
    },
    Q: function (e, t, a) {
      var n = Math.ceil((e.getUTCMonth() + 1) / 3);
      switch (t) {
        case 'Q':
          return String(n);
        case 'QQ':
          return m(n, 2);
        case 'Qo':
          return a.ordinalNumber(n, { unit: 'quarter' });
        case 'QQQ':
          return a.quarter(n, { width: 'abbreviated', context: 'formatting' });
        case 'QQQQQ':
          return a.quarter(n, { width: 'narrow', context: 'formatting' });
        case 'QQQQ':
        default:
          return a.quarter(n, { width: 'wide', context: 'formatting' });
      }
    },
    q: function (e, t, a) {
      var n = Math.ceil((e.getUTCMonth() + 1) / 3);
      switch (t) {
        case 'q':
          return String(n);
        case 'qq':
          return m(n, 2);
        case 'qo':
          return a.ordinalNumber(n, { unit: 'quarter' });
        case 'qqq':
          return a.quarter(n, { width: 'abbreviated', context: 'standalone' });
        case 'qqqqq':
          return a.quarter(n, { width: 'narrow', context: 'standalone' });
        case 'qqqq':
        default:
          return a.quarter(n, { width: 'wide', context: 'standalone' });
      }
    },
    M: function (e, t, a) {
      var n = e.getUTCMonth();
      switch (t) {
        case 'M':
        case 'MM':
          return S.M(e, t);
        case 'Mo':
          return a.ordinalNumber(n + 1, { unit: 'month' });
        case 'MMM':
          return a.month(n, { width: 'abbreviated', context: 'formatting' });
        case 'MMMMM':
          return a.month(n, { width: 'narrow', context: 'formatting' });
        case 'MMMM':
        default:
          return a.month(n, { width: 'wide', context: 'formatting' });
      }
    },
    L: function (e, t, a) {
      var n = e.getUTCMonth();
      switch (t) {
        case 'L':
          return String(n + 1);
        case 'LL':
          return m(n + 1, 2);
        case 'Lo':
          return a.ordinalNumber(n + 1, { unit: 'month' });
        case 'LLL':
          return a.month(n, { width: 'abbreviated', context: 'standalone' });
        case 'LLLLL':
          return a.month(n, { width: 'narrow', context: 'standalone' });
        case 'LLLL':
        default:
          return a.month(n, { width: 'wide', context: 'standalone' });
      }
    },
    w: function (e, t, a, n) {
      var o = _e(e, n);
      return t === 'wo' ? a.ordinalNumber(o, { unit: 'week' }) : m(o, t.length);
    },
    I: function (e, t, a) {
      var n = Ee(e);
      return t === 'Io' ? a.ordinalNumber(n, { unit: 'week' }) : m(n, t.length);
    },
    d: function (e, t, a) {
      return t === 'do' ? a.ordinalNumber(e.getUTCDate(), { unit: 'date' }) : S.d(e, t);
    },
    D: function (e, t, a) {
      var n = Me(e);
      return t === 'Do' ? a.ordinalNumber(n, { unit: 'dayOfYear' }) : m(n, t.length);
    },
    E: function (e, t, a) {
      var n = e.getUTCDay();
      switch (t) {
        case 'E':
        case 'EE':
        case 'EEE':
          return a.day(n, { width: 'abbreviated', context: 'formatting' });
        case 'EEEEE':
          return a.day(n, { width: 'narrow', context: 'formatting' });
        case 'EEEEEE':
          return a.day(n, { width: 'short', context: 'formatting' });
        case 'EEEE':
        default:
          return a.day(n, { width: 'wide', context: 'formatting' });
      }
    },
    e: function (e, t, a, n) {
      var o = e.getUTCDay(),
        s = (o - n.weekStartsOn + 8) % 7 || 7;
      switch (t) {
        case 'e':
          return String(s);
        case 'ee':
          return m(s, 2);
        case 'eo':
          return a.ordinalNumber(s, { unit: 'day' });
        case 'eee':
          return a.day(o, { width: 'abbreviated', context: 'formatting' });
        case 'eeeee':
          return a.day(o, { width: 'narrow', context: 'formatting' });
        case 'eeeeee':
          return a.day(o, { width: 'short', context: 'formatting' });
        case 'eeee':
        default:
          return a.day(o, { width: 'wide', context: 'formatting' });
      }
    },
    c: function (e, t, a, n) {
      var o = e.getUTCDay(),
        s = (o - n.weekStartsOn + 8) % 7 || 7;
      switch (t) {
        case 'c':
          return String(s);
        case 'cc':
          return m(s, t.length);
        case 'co':
          return a.ordinalNumber(s, { unit: 'day' });
        case 'ccc':
          return a.day(o, { width: 'abbreviated', context: 'standalone' });
        case 'ccccc':
          return a.day(o, { width: 'narrow', context: 'standalone' });
        case 'cccccc':
          return a.day(o, { width: 'short', context: 'standalone' });
        case 'cccc':
        default:
          return a.day(o, { width: 'wide', context: 'standalone' });
      }
    },
    i: function (e, t, a) {
      var n = e.getUTCDay(),
        o = n === 0 ? 7 : n;
      switch (t) {
        case 'i':
          return String(o);
        case 'ii':
          return m(o, t.length);
        case 'io':
          return a.ordinalNumber(o, { unit: 'day' });
        case 'iii':
          return a.day(n, { width: 'abbreviated', context: 'formatting' });
        case 'iiiii':
          return a.day(n, { width: 'narrow', context: 'formatting' });
        case 'iiiiii':
          return a.day(n, { width: 'short', context: 'formatting' });
        case 'iiii':
        default:
          return a.day(n, { width: 'wide', context: 'formatting' });
      }
    },
    a: function (e, t, a) {
      var n = e.getUTCHours(),
        o = n / 12 >= 1 ? 'pm' : 'am';
      switch (t) {
        case 'a':
        case 'aa':
          return a.dayPeriod(o, { width: 'abbreviated', context: 'formatting' });
        case 'aaa':
          return a.dayPeriod(o, { width: 'abbreviated', context: 'formatting' }).toLowerCase();
        case 'aaaaa':
          return a.dayPeriod(o, { width: 'narrow', context: 'formatting' });
        case 'aaaa':
        default:
          return a.dayPeriod(o, { width: 'wide', context: 'formatting' });
      }
    },
    b: function (e, t, a) {
      var n = e.getUTCHours(),
        o;
      switch (
        (n === 12 ? (o = R.noon) : n === 0 ? (o = R.midnight) : (o = n / 12 >= 1 ? 'pm' : 'am'), t)
      ) {
        case 'b':
        case 'bb':
          return a.dayPeriod(o, { width: 'abbreviated', context: 'formatting' });
        case 'bbb':
          return a.dayPeriod(o, { width: 'abbreviated', context: 'formatting' }).toLowerCase();
        case 'bbbbb':
          return a.dayPeriod(o, { width: 'narrow', context: 'formatting' });
        case 'bbbb':
        default:
          return a.dayPeriod(o, { width: 'wide', context: 'formatting' });
      }
    },
    B: function (e, t, a) {
      var n = e.getUTCHours(),
        o;
      switch (
        (n >= 17
          ? (o = R.evening)
          : n >= 12
            ? (o = R.afternoon)
            : n >= 4
              ? (o = R.morning)
              : (o = R.night),
        t)
      ) {
        case 'B':
        case 'BB':
        case 'BBB':
          return a.dayPeriod(o, { width: 'abbreviated', context: 'formatting' });
        case 'BBBBB':
          return a.dayPeriod(o, { width: 'narrow', context: 'formatting' });
        case 'BBBB':
        default:
          return a.dayPeriod(o, { width: 'wide', context: 'formatting' });
      }
    },
    h: function (e, t, a) {
      if (t === 'ho') {
        var n = e.getUTCHours() % 12;
        return (n === 0 && (n = 12), a.ordinalNumber(n, { unit: 'hour' }));
      }
      return S.h(e, t);
    },
    H: function (e, t, a) {
      return t === 'Ho' ? a.ordinalNumber(e.getUTCHours(), { unit: 'hour' }) : S.H(e, t);
    },
    K: function (e, t, a) {
      var n = e.getUTCHours() % 12;
      return t === 'Ko' ? a.ordinalNumber(n, { unit: 'hour' }) : m(n, t.length);
    },
    k: function (e, t, a) {
      var n = e.getUTCHours();
      return (
        n === 0 && (n = 24),
        t === 'ko' ? a.ordinalNumber(n, { unit: 'hour' }) : m(n, t.length)
      );
    },
    m: function (e, t, a) {
      return t === 'mo' ? a.ordinalNumber(e.getUTCMinutes(), { unit: 'minute' }) : S.m(e, t);
    },
    s: function (e, t, a) {
      return t === 'so' ? a.ordinalNumber(e.getUTCSeconds(), { unit: 'second' }) : S.s(e, t);
    },
    S: function (e, t) {
      return S.S(e, t);
    },
    X: function (e, t, a, n) {
      var o = n._originalDate || e,
        s = o.getTimezoneOffset();
      if (s === 0) return 'Z';
      switch (t) {
        case 'X':
          return V(s);
        case 'XXXX':
        case 'XX':
          return _(s);
        case 'XXXXX':
        case 'XXX':
        default:
          return _(s, ':');
      }
    },
    x: function (e, t, a, n) {
      var o = n._originalDate || e,
        s = o.getTimezoneOffset();
      switch (t) {
        case 'x':
          return V(s);
        case 'xxxx':
        case 'xx':
          return _(s);
        case 'xxxxx':
        case 'xxx':
        default:
          return _(s, ':');
      }
    },
    O: function (e, t, a, n) {
      var o = n._originalDate || e,
        s = o.getTimezoneOffset();
      switch (t) {
        case 'O':
        case 'OO':
        case 'OOO':
          return 'GMT' + X(s, ':');
        case 'OOOO':
        default:
          return 'GMT' + _(s, ':');
      }
    },
    z: function (e, t, a, n) {
      var o = n._originalDate || e,
        s = o.getTimezoneOffset();
      switch (t) {
        case 'z':
        case 'zz':
        case 'zzz':
          return 'GMT' + X(s, ':');
        case 'zzzz':
        default:
          return 'GMT' + _(s, ':');
      }
    },
    t: function (e, t, a, n) {
      var o = n._originalDate || e,
        s = Math.floor(o.getTime() / 1e3);
      return m(s, t.length);
    },
    T: function (e, t, a, n) {
      var o = n._originalDate || e,
        s = o.getTime();
      return m(s, t.length);
    },
  };
function X(r, e) {
  var t = r > 0 ? '-' : '+',
    a = Math.abs(r),
    n = Math.floor(a / 60),
    o = a % 60;
  if (o === 0) return t + String(n);
  var s = e;
  return t + String(n) + s + m(o, 2);
}
function V(r, e) {
  if (r % 60 === 0) {
    var t = r > 0 ? '-' : '+';
    return t + m(Math.abs(r) / 60, 2);
  }
  return _(r, e);
}
function _(r, e) {
  var t = e || '',
    a = r > 0 ? '-' : '+',
    n = Math.abs(r),
    o = m(Math.floor(n / 60), 2),
    s = m(n % 60, 2);
  return a + o + t + s;
}
var J = function (e, t) {
    switch (e) {
      case 'P':
        return t.date({ width: 'short' });
      case 'PP':
        return t.date({ width: 'medium' });
      case 'PPP':
        return t.date({ width: 'long' });
      case 'PPPP':
      default:
        return t.date({ width: 'full' });
    }
  },
  re = function (e, t) {
    switch (e) {
      case 'p':
        return t.time({ width: 'short' });
      case 'pp':
        return t.time({ width: 'medium' });
      case 'ppp':
        return t.time({ width: 'long' });
      case 'pppp':
      default:
        return t.time({ width: 'full' });
    }
  },
  Re = function (e, t) {
    var a = e.match(/(P+)(p+)?/) || [],
      n = a[1],
      o = a[2];
    if (!o) return J(e, t);
    var s;
    switch (n) {
      case 'P':
        s = t.dateTime({ width: 'short' });
        break;
      case 'PP':
        s = t.dateTime({ width: 'medium' });
        break;
      case 'PPP':
        s = t.dateTime({ width: 'long' });
        break;
      case 'PPPP':
      default:
        s = t.dateTime({ width: 'full' });
        break;
    }
    return s.replace('{{date}}', J(n, t)).replace('{{time}}', re(o, t));
  },
  Ye = { p: re, P: Re },
  $e = ['D', 'DD'],
  Le = ['YY', 'YYYY'];
function Fe(r) {
  return $e.indexOf(r) !== -1;
}
function Ie(r) {
  return Le.indexOf(r) !== -1;
}
function z(r, e, t) {
  if (r === 'YYYY')
    throw new RangeError(
      'Use `yyyy` instead of `YYYY` (in `'
        .concat(e, '`) for formatting years to the input `')
        .concat(
          t,
          '`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md',
        ),
    );
  if (r === 'YY')
    throw new RangeError(
      'Use `yy` instead of `YY` (in `'
        .concat(e, '`) for formatting years to the input `')
        .concat(
          t,
          '`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md',
        ),
    );
  if (r === 'D')
    throw new RangeError(
      'Use `d` instead of `D` (in `'
        .concat(e, '`) for formatting days of the month to the input `')
        .concat(
          t,
          '`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md',
        ),
    );
  if (r === 'DD')
    throw new RangeError(
      'Use `dd` instead of `DD` (in `'
        .concat(e, '`) for formatting days of the month to the input `')
        .concat(
          t,
          '`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md',
        ),
    );
}
var qe = {
    lessThanXSeconds: { one: 'less than a second', other: 'less than {{count}} seconds' },
    xSeconds: { one: '1 second', other: '{{count}} seconds' },
    halfAMinute: 'half a minute',
    lessThanXMinutes: { one: 'less than a minute', other: 'less than {{count}} minutes' },
    xMinutes: { one: '1 minute', other: '{{count}} minutes' },
    aboutXHours: { one: 'about 1 hour', other: 'about {{count}} hours' },
    xHours: { one: '1 hour', other: '{{count}} hours' },
    xDays: { one: '1 day', other: '{{count}} days' },
    aboutXWeeks: { one: 'about 1 week', other: 'about {{count}} weeks' },
    xWeeks: { one: '1 week', other: '{{count}} weeks' },
    aboutXMonths: { one: 'about 1 month', other: 'about {{count}} months' },
    xMonths: { one: '1 month', other: '{{count}} months' },
    aboutXYears: { one: 'about 1 year', other: 'about {{count}} years' },
    xYears: { one: '1 year', other: '{{count}} years' },
    overXYears: { one: 'over 1 year', other: 'over {{count}} years' },
    almostXYears: { one: 'almost 1 year', other: 'almost {{count}} years' },
  },
  He = function (e, t, a) {
    var n,
      o = qe[e];
    return (
      typeof o == 'string'
        ? (n = o)
        : t === 1
          ? (n = o.one)
          : (n = o.other.replace('{{count}}', t.toString())),
      a != null && a.addSuffix ? (a.comparison && a.comparison > 0 ? 'in ' + n : n + ' ago') : n
    );
  };
function G(r) {
  return function () {
    var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {},
      t = e.width ? String(e.width) : r.defaultWidth,
      a = r.formats[t] || r.formats[r.defaultWidth];
    return a;
  };
}
var Be = { full: 'EEEE, MMMM do, y', long: 'MMMM do, y', medium: 'MMM d, y', short: 'MM/dd/yyyy' },
  Ae = { full: 'h:mm:ss a zzzz', long: 'h:mm:ss a z', medium: 'h:mm:ss a', short: 'h:mm a' },
  Ge = {
    full: "{{date}} 'at' {{time}}",
    long: "{{date}} 'at' {{time}}",
    medium: '{{date}}, {{time}}',
    short: '{{date}}, {{time}}',
  },
  Qe = {
    date: G({ formats: Be, defaultWidth: 'full' }),
    time: G({ formats: Ae, defaultWidth: 'full' }),
    dateTime: G({ formats: Ge, defaultWidth: 'full' }),
  },
  Xe = {
    lastWeek: "'last' eeee 'at' p",
    yesterday: "'yesterday at' p",
    today: "'today at' p",
    tomorrow: "'tomorrow at' p",
    nextWeek: "eeee 'at' p",
    other: 'P',
  },
  Ve = function (e, t, a, n) {
    return Xe[e];
  };
function Y(r) {
  return function (e, t) {
    var a = t != null && t.context ? String(t.context) : 'standalone',
      n;
    if (a === 'formatting' && r.formattingValues) {
      var o = r.defaultFormattingWidth || r.defaultWidth,
        s = t != null && t.width ? String(t.width) : o;
      n = r.formattingValues[s] || r.formattingValues[o];
    } else {
      var d = r.defaultWidth,
        h = t != null && t.width ? String(t.width) : r.defaultWidth;
      n = r.values[h] || r.values[d];
    }
    var u = r.argumentCallback ? r.argumentCallback(e) : e;
    return n[u];
  };
}
var Je = { narrow: ['B', 'A'], abbreviated: ['BC', 'AD'], wide: ['Before Christ', 'Anno Domini'] },
  ze = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
    wide: ['1st quarter', '2nd quarter', '3rd quarter', '4th quarter'],
  },
  Ke = {
    narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    abbreviated: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    wide: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
  },
  Ze = {
    narrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    short: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    abbreviated: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    wide: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  et = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'mi',
      noon: 'n',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night',
    },
    wide: {
      am: 'a.m.',
      pm: 'p.m.',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night',
    },
  },
  tt = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'mi',
      noon: 'n',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night',
    },
    wide: {
      am: 'a.m.',
      pm: 'p.m.',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night',
    },
  },
  rt = function (e, t) {
    var a = Number(e),
      n = a % 100;
    if (n > 20 || n < 10)
      switch (n % 10) {
        case 1:
          return a + 'st';
        case 2:
          return a + 'nd';
        case 3:
          return a + 'rd';
      }
    return a + 'th';
  },
  at = {
    ordinalNumber: rt,
    era: Y({ values: Je, defaultWidth: 'wide' }),
    quarter: Y({
      values: ze,
      defaultWidth: 'wide',
      argumentCallback: function (e) {
        return e - 1;
      },
    }),
    month: Y({ values: Ke, defaultWidth: 'wide' }),
    day: Y({ values: Ze, defaultWidth: 'wide' }),
    dayPeriod: Y({
      values: et,
      defaultWidth: 'wide',
      formattingValues: tt,
      defaultFormattingWidth: 'wide',
    }),
  };
function $(r) {
  return function (e) {
    var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
      a = t.width,
      n = (a && r.matchPatterns[a]) || r.matchPatterns[r.defaultMatchWidth],
      o = e.match(n);
    if (!o) return null;
    var s = o[0],
      d = (a && r.parsePatterns[a]) || r.parsePatterns[r.defaultParseWidth],
      h = Array.isArray(d)
        ? it(d, function (v) {
            return v.test(s);
          })
        : nt(d, function (v) {
            return v.test(s);
          }),
      u;
    ((u = r.valueCallback ? r.valueCallback(h) : h),
      (u = t.valueCallback ? t.valueCallback(u) : u));
    var p = e.slice(s.length);
    return { value: u, rest: p };
  };
}
function nt(r, e) {
  for (var t in r) if (r.hasOwnProperty(t) && e(r[t])) return t;
}
function it(r, e) {
  for (var t = 0; t < r.length; t++) if (e(r[t])) return t;
}
function ot(r) {
  return function (e) {
    var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
      a = e.match(r.matchPattern);
    if (!a) return null;
    var n = a[0],
      o = e.match(r.parsePattern);
    if (!o) return null;
    var s = r.valueCallback ? r.valueCallback(o[0]) : o[0];
    s = t.valueCallback ? t.valueCallback(s) : s;
    var d = e.slice(n.length);
    return { value: s, rest: d };
  };
}
var st = /^(\d+)(th|st|nd|rd)?/i,
  ct = /\d+/i,
  lt = {
    narrow: /^(b|a)/i,
    abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
    wide: /^(before christ|before common era|anno domini|common era)/i,
  },
  dt = { any: [/^b/i, /^(a|c)/i] },
  ut = { narrow: /^[1234]/i, abbreviated: /^q[1234]/i, wide: /^[1234](th|st|nd|rd)? quarter/i },
  mt = { any: [/1/i, /2/i, /3/i, /4/i] },
  ht = {
    narrow: /^[jfmasond]/i,
    abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
    wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i,
  },
  ft = {
    narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
    any: [
      /^ja/i,
      /^f/i,
      /^mar/i,
      /^ap/i,
      /^may/i,
      /^jun/i,
      /^jul/i,
      /^au/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i,
    ],
  },
  gt = {
    narrow: /^[smtwf]/i,
    short: /^(su|mo|tu|we|th|fr|sa)/i,
    abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
    wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i,
  },
  vt = {
    narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
    any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i],
  },
  pt = {
    narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
    any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i,
  },
  xt = {
    any: {
      am: /^a/i,
      pm: /^p/i,
      midnight: /^mi/i,
      noon: /^no/i,
      morning: /morning/i,
      afternoon: /afternoon/i,
      evening: /evening/i,
      night: /night/i,
    },
  },
  yt = {
    ordinalNumber: ot({
      matchPattern: st,
      parsePattern: ct,
      valueCallback: function (e) {
        return parseInt(e, 10);
      },
    }),
    era: $({
      matchPatterns: lt,
      defaultMatchWidth: 'wide',
      parsePatterns: dt,
      defaultParseWidth: 'any',
    }),
    quarter: $({
      matchPatterns: ut,
      defaultMatchWidth: 'wide',
      parsePatterns: mt,
      defaultParseWidth: 'any',
      valueCallback: function (e) {
        return e + 1;
      },
    }),
    month: $({
      matchPatterns: ht,
      defaultMatchWidth: 'wide',
      parsePatterns: ft,
      defaultParseWidth: 'any',
    }),
    day: $({
      matchPatterns: gt,
      defaultMatchWidth: 'wide',
      parsePatterns: vt,
      defaultParseWidth: 'any',
    }),
    dayPeriod: $({
      matchPatterns: pt,
      defaultMatchWidth: 'any',
      parsePatterns: xt,
      defaultParseWidth: 'any',
    }),
  },
  bt = {
    code: 'en-US',
    formatDistance: He,
    formatLong: Qe,
    formatRelative: Ve,
    localize: at,
    match: yt,
    options: { weekStartsOn: 0, firstWeekContainsDate: 1 },
  },
  wt = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g,
  Nt = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g,
  jt = /^'([^]*?)'?$/,
  Ct = /''/g,
  Pt = /[a-zA-Z]/;
function P(r, e, t) {
  var a, n, o, s, d, h, u, p, v, g, x, y, O, c;
  w(2, arguments);
  var l = String(e),
    b = B(),
    f =
      (a = (n = void 0) !== null && n !== void 0 ? n : b.locale) !== null && a !== void 0 ? a : bt,
    j = D(
      (o =
        (s =
          (d = (h = void 0) !== null && h !== void 0 ? h : void 0) !== null && d !== void 0
            ? d
            : b.firstWeekContainsDate) !== null && s !== void 0
          ? s
          : (u = b.locale) === null || u === void 0 || (p = u.options) === null || p === void 0
            ? void 0
            : p.firstWeekContainsDate) !== null && o !== void 0
        ? o
        : 1,
    );
  if (!(j >= 1 && j <= 7))
    throw new RangeError('firstWeekContainsDate must be between 1 and 7 inclusively');
  var E = D(
    (v =
      (g =
        (x = (y = void 0) !== null && y !== void 0 ? y : void 0) !== null && x !== void 0
          ? x
          : b.weekStartsOn) !== null && g !== void 0
        ? g
        : (O = b.locale) === null || O === void 0 || (c = O.options) === null || c === void 0
          ? void 0
          : c.weekStartsOn) !== null && v !== void 0
      ? v
      : 0,
  );
  if (!(E >= 0 && E <= 6)) throw new RangeError('weekStartsOn must be between 0 and 6 inclusively');
  if (!f.localize) throw new RangeError('locale must contain localize property');
  if (!f.formatLong) throw new RangeError('locale must contain formatLong property');
  var U = T(r);
  if (!Pe(U)) throw new RangeError('Invalid time value');
  var L = je(U),
    A = Te(U, L),
    ae = { firstWeekContainsDate: j, weekStartsOn: E, locale: f, _originalDate: U },
    ne = l
      .match(Nt)
      .map(function (N) {
        var M = N[0];
        if (M === 'p' || M === 'P') {
          var F = Ye[M];
          return F(N, f.formatLong);
        }
        return N;
      })
      .join('')
      .match(wt)
      .map(function (N) {
        if (N === "''") return "'";
        var M = N[0];
        if (M === "'") return Tt(N);
        var F = De[M];
        if (F)
          return (
            Ie(N) && z(N, e, String(r)),
            Fe(N) && z(N, e, String(r)),
            F(A, N, f.localize, ae)
          );
        if (M.match(Pt))
          throw new RangeError(
            'Format string contains an unescaped latin alphabet character `' + M + '`',
          );
        return N;
      })
      .join('');
  return ne;
}
function Tt(r) {
  var e = r.match(jt);
  return e ? e[1].replace(Ct, "'") : r;
}
const Ot = ({ paymentIntent: r, bookingDetails: e, onClose: t }) => {
    const [a, n] = k.useState(!1),
      [o, s] = k.useState(!1),
      d = C.calculateCommission(e.totalAmount),
      h = e.totalAmount * 0.12,
      u = e.totalAmount - h - d;
    k.useEffect(() => {
      p();
    }, []);
    const p = async () => {
        try {
          setTimeout(() => {
            s(!0);
          }, 2e3);
        } catch (c) {
          W.warn('Confirmation email sending failed, continuing without email', {
            component: 'PaymentConfirmation',
            method: 'sendConfirmationEmail',
            bookingId: r.id,
            error: c instanceof Error ? c.message : 'Unknown error',
            userImpact: 'none',
          });
        }
      },
      v = async () => {
        try {
          n(!0);
          const c = await fetch(`/api/payments/${r.id}/receipt`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
          });
          if (c.ok) {
            const l = await c.blob(),
              b = URL.createObjectURL(l),
              f = document.createElement('a');
            ((f.href = b),
              (f.download = `receipt-${e.confirmationNumber}.pdf`),
              document.body.appendChild(f),
              f.click(),
              document.body.removeChild(f),
              URL.revokeObjectURL(b));
          } else throw new Error('Failed to generate PDF receipt');
        } catch (c) {
          W.error('PDF receipt generation failed', {
            component: 'PaymentConfirmation',
            method: 'generatePDFReceipt',
            paymentIntentId: r.id,
            bookingConfirmation: e.confirmationNumber,
            error: c instanceof Error ? c.message : 'Unknown error',
            userImpact: 'receipt_download_failed',
          });
        } finally {
          n(!1);
        }
      },
      g = (c) =>
        c
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;'),
      x = () => {
        const c = g(e.hotelName),
          l = g(e.roomType),
          b = g(e.guestFirstName),
          f = g(e.guestLastName),
          j = g(e.guestEmail),
          E = g(e.guestPhone),
          U = g(e.confirmationNumber),
          L = e.specialRequests ? g(e.specialRequests) : '',
          A = g(r.id);
        return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - ${U}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
    .confirmation { background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .detail-section { background: #f9fafb; padding: 20px; border-radius: 8px; }
    .detail-section h3 { margin-top: 0; color: #374151; }
    .price-breakdown { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; }
    .price-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .price-row.total { border-top: 2px solid #e5e7eb; font-weight: bold; font-size: 18px; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Vibe Hotels</div>
    <h1>Payment Receipt</h1>
    <p>Thank you for your booking!</p>
  </div>

  <div class="confirmation">
    <h2 style="margin-top: 0; color: #059669;">✓ Payment Confirmed</h2>
    <p><strong>Confirmation Number:</strong> ${U}</p>
    <p><strong>Payment Date:</strong> ${P(new Date(), 'PPP')}</p>
    <p><strong>Transaction ID:</strong> ${A}</p>
  </div>

  <div class="details-grid">
    <div class="detail-section">
      <h3>Booking Details</h3>
      <p><strong>Hotel:</strong> ${c}</p>
      <p><strong>Room Type:</strong> ${l}</p>
      <p><strong>Check-in:</strong> ${P(e.checkIn, 'PPP')}</p>
      <p><strong>Check-out:</strong> ${P(e.checkOut, 'PPP')}</p>
      <p><strong>Nights:</strong> ${e.nights}</p>
      <p><strong>Guests:</strong> ${e.guests}</p>
    </div>

    <div class="detail-section">
      <h3>Guest Information</h3>
      <p><strong>Name:</strong> ${b} ${f}</p>
      <p><strong>Email:</strong> ${j}</p>
      <p><strong>Phone:</strong> ${E}</p>
      ${L ? `<p><strong>Special Requests:</strong> ${L}</p>` : ''}
    </div>
  </div>

  <div class="price-breakdown">
    <h3>Payment Breakdown</h3>
    <div class="price-row">
      <span>Room Rate (${e.nights} nights)</span>
      <span>${C.formatCurrency(u, e.currency)}</span>
    </div>
    <div class="price-row">
      <span>Taxes & Fees</span>
      <span>${C.formatCurrency(h, e.currency)}</span>
    </div>
    <div class="price-row">
      <span>Service Fee</span>
      <span>${C.formatCurrency(d, e.currency)}</span>
    </div>
    <div class="price-row total">
      <span>Total Paid</span>
      <span>${C.formatCurrency(e.totalAmount, e.currency)}</span>
    </div>
  </div>

  <div class="footer">
    <p>This is an official receipt for your hotel booking.</p>
    <p>For questions or support, please contact us at support@vibehotels.com</p>
    <p>Generated on ${P(new Date(), 'PPP')} at ${P(new Date(), 'pp')}</p>
  </div>
</body>
</html>
    `;
      },
      y = () => {
        try {
          const c = window.open('', '_blank');
          if (!c) {
            W.warn('Print window blocked by browser popup blocker', {
              component: 'PaymentConfirmation',
              method: 'printReceipt',
              bookingConfirmation: e.confirmationNumber,
              userImpact: 'print_blocked',
              recommendedAction: 'user_allow_popups',
            });
            return;
          }
          const l = x(),
            b = new Blob([l], { type: 'text/html;charset=utf-8' }),
            f = URL.createObjectURL(b);
          ((c.location.href = f),
            (c.onload = () => {
              try {
                (c.focus(),
                  c.print(),
                  setTimeout(() => {
                    (URL.revokeObjectURL(f), c.close());
                  }, 1e3));
              } catch (j) {
                (W.warn('Browser print operation failed', {
                  component: 'PaymentConfirmation',
                  method: 'printReceipt',
                  bookingConfirmation: e.confirmationNumber,
                  error: j instanceof Error ? j.message : 'Unknown error',
                  userImpact: 'print_failed',
                }),
                  URL.revokeObjectURL(f));
              }
            }),
            setTimeout(() => {
              URL.revokeObjectURL(f);
            }, 1e4));
        } catch (c) {
          W.error('Print receipt generation failed', {
            component: 'PaymentConfirmation',
            method: 'printReceipt',
            bookingConfirmation: e.confirmationNumber,
            error: c instanceof Error ? c.message : 'Unknown error',
            userImpact: 'print_unavailable',
          });
        }
      },
      O = async () => {
        if (navigator.share)
          try {
            await navigator.share({
              title: `Hotel Booking Confirmation - ${e.confirmationNumber}`,
              text: `Your booking at ${e.hotelName} has been confirmed!`,
              url: window.location.href,
            });
          } catch (c) {
            W.info('Native share functionality failed, user likely cancelled', {
              component: 'PaymentConfirmation',
              method: 'shareReceipt',
              bookingConfirmation: e.confirmationNumber,
              error: c instanceof Error ? c.message : 'Unknown error',
              userImpact: 'share_cancelled',
            });
          }
        else {
          const c = `Hotel booking confirmed! 
Confirmation: ${e.confirmationNumber}
Hotel: ${e.hotelName}
Dates: ${P(e.checkIn, 'MMM dd')} - ${P(e.checkOut, 'MMM dd, yyyy')}
Total: ${C.formatCurrency(e.totalAmount, e.currency)}`;
          (navigator.clipboard.writeText(c), alert('Booking details copied to clipboard!'));
        }
      };
    return i.jsxs('div', {
      className: 'max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden',
      children: [
        i.jsxs('div', {
          className: 'bg-gradient-to-r from-green-500 to-green-600 px-6 py-8 text-center',
          children: [
            i.jsx(Q, { className: 'h-16 w-16 text-white mx-auto mb-4' }),
            i.jsx('h1', {
              className: 'text-3xl font-bold text-white mb-2',
              children: 'Payment Successful!',
            }),
            i.jsx('p', {
              className: 'text-green-100 text-lg',
              children: 'Your booking has been confirmed - Earn 5% rewards!',
            }),
          ],
        }),
        i.jsxs('div', {
          className: 'p-6',
          children: [
            i.jsx('div', {
              className: 'bg-accent-50 border border-accent-200 rounded-lg p-6 mb-8',
              children: i.jsxs('div', {
                className: 'flex items-center justify-between',
                children: [
                  i.jsxs('div', {
                    children: [
                      i.jsx('h2', {
                        className: 'text-xl font-semibold text-accent-900 mb-2',
                        children: 'Booking Confirmed',
                      }),
                      i.jsxs('p', {
                        className: 'text-accent-700',
                        children: [
                          i.jsx('strong', { children: 'Confirmation Number:' }),
                          ' ',
                          e.confirmationNumber,
                        ],
                      }),
                      i.jsxs('p', {
                        className: 'text-accent-700',
                        children: [i.jsx('strong', { children: 'Transaction ID:' }), ' ', r.id],
                      }),
                    ],
                  }),
                  i.jsxs('div', {
                    className: 'text-right',
                    children: [
                      i.jsx('p', { className: 'text-sm text-accent-600', children: 'Total Paid' }),
                      i.jsx('p', {
                        className: 'text-2xl font-bold text-accent-900',
                        children: C.formatCurrency(e.totalAmount, e.currency),
                      }),
                    ],
                  }),
                ],
              }),
            }),
            i.jsxs('div', {
              className: 'grid md:grid-cols-2 gap-8 mb-8',
              children: [
                i.jsxs('div', {
                  className: 'space-y-6',
                  children: [
                    i.jsxs('div', {
                      className: 'bg-gray-50 rounded-lg p-6',
                      children: [
                        i.jsxs('h3', {
                          className: 'text-lg font-semibold text-gray-900 mb-4 flex items-center',
                          children: [i.jsx(de, { className: 'h-5 w-5 mr-2' }), 'Hotel Details'],
                        }),
                        i.jsxs('div', {
                          className: 'space-y-2',
                          children: [
                            i.jsx('p', {
                              className: 'font-medium text-gray-900',
                              children: e.hotelName,
                            }),
                            e.hotelAddress &&
                              i.jsx('p', { className: 'text-gray-600', children: e.hotelAddress }),
                            i.jsx('p', { className: 'text-gray-600', children: e.roomType }),
                          ],
                        }),
                      ],
                    }),
                    i.jsxs('div', {
                      className: 'bg-gray-50 rounded-lg p-6',
                      children: [
                        i.jsxs('h3', {
                          className: 'text-lg font-semibold text-gray-900 mb-4 flex items-center',
                          children: [i.jsx(ue, { className: 'h-5 w-5 mr-2' }), 'Stay Details'],
                        }),
                        i.jsxs('div', {
                          className: 'space-y-2',
                          children: [
                            i.jsxs('p', {
                              className: 'text-gray-600',
                              children: [
                                i.jsx('strong', { children: 'Check-in:' }),
                                ' ',
                                P(e.checkIn, 'PPP'),
                              ],
                            }),
                            i.jsxs('p', {
                              className: 'text-gray-600',
                              children: [
                                i.jsx('strong', { children: 'Check-out:' }),
                                ' ',
                                P(e.checkOut, 'PPP'),
                              ],
                            }),
                            i.jsxs('p', {
                              className: 'text-gray-600',
                              children: [
                                i.jsx('strong', { children: 'Duration:' }),
                                ' ',
                                e.nights,
                                ' night',
                                e.nights !== 1 ? 's' : '',
                              ],
                            }),
                            i.jsxs('p', {
                              className: 'text-gray-600 flex items-center',
                              children: [
                                i.jsx(me, { className: 'h-4 w-4 mr-1' }),
                                e.guests,
                                ' guest',
                                e.guests !== 1 ? 's' : '',
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                i.jsxs('div', {
                  className: 'space-y-6',
                  children: [
                    i.jsxs('div', {
                      className: 'bg-gray-50 rounded-lg p-6',
                      children: [
                        i.jsx('h3', {
                          className: 'text-lg font-semibold text-gray-900 mb-4',
                          children: 'Guest Information',
                        }),
                        i.jsxs('div', {
                          className: 'space-y-2',
                          children: [
                            i.jsxs('p', {
                              className: 'text-gray-600',
                              children: [
                                i.jsx('strong', { children: 'Name:' }),
                                ' ',
                                e.guestFirstName,
                                ' ',
                                e.guestLastName,
                              ],
                            }),
                            i.jsxs('p', {
                              className: 'text-gray-600 flex items-center',
                              children: [i.jsx(K, { className: 'h-4 w-4 mr-1' }), e.guestEmail],
                            }),
                            i.jsxs('p', {
                              className: 'text-gray-600 flex items-center',
                              children: [i.jsx(Z, { className: 'h-4 w-4 mr-1' }), e.guestPhone],
                            }),
                          ],
                        }),
                      ],
                    }),
                    i.jsxs('div', {
                      className: 'bg-gray-50 rounded-lg p-6',
                      children: [
                        i.jsxs('h3', {
                          className: 'text-lg font-semibold text-gray-900 mb-4 flex items-center',
                          children: [i.jsx(he, { className: 'h-5 w-5 mr-2' }), 'Payment Details'],
                        }),
                        i.jsxs('div', {
                          className: 'space-y-2',
                          children: [
                            i.jsxs('p', {
                              className: 'text-gray-600',
                              children: [
                                i.jsx('strong', { children: 'Payment Method:' }),
                                ' ',
                                r.payment_method?.card?.brand?.toUpperCase(),
                                '****',
                                r.payment_method?.card?.last4,
                              ],
                            }),
                            i.jsxs('p', {
                              className: 'text-gray-600',
                              children: [
                                i.jsx('strong', { children: 'Payment Date:' }),
                                ' ',
                                P(new Date(r.created * 1e3), 'PPP'),
                              ],
                            }),
                            i.jsxs('p', {
                              className: 'text-gray-600',
                              children: [
                                i.jsx('strong', { children: 'Status:' }),
                                i.jsx('span', {
                                  className:
                                    'ml-1 px-2 py-1 bg-green-100 text-green-800 rounded text-sm',
                                  children: 'Paid',
                                }),
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
            i.jsxs('div', {
              className: 'bg-white border border-gray-200 rounded-lg p-6 mb-8',
              children: [
                i.jsxs('h3', {
                  className: 'text-lg font-semibold text-gray-900 mb-4 flex items-center',
                  children: [i.jsx(fe, { className: 'h-5 w-5 mr-2' }), 'Payment Breakdown'],
                }),
                i.jsxs('div', {
                  className: 'space-y-3',
                  children: [
                    i.jsxs('div', {
                      className: 'flex justify-between items-center',
                      children: [
                        i.jsxs('span', {
                          className: 'text-gray-600',
                          children: ['Room Rate (', e.nights, ' nights)'],
                        }),
                        i.jsx('span', {
                          className: 'font-medium',
                          children: C.formatCurrency(u, e.currency),
                        }),
                      ],
                    }),
                    i.jsxs('div', {
                      className: 'flex justify-between items-center',
                      children: [
                        i.jsx('span', { className: 'text-gray-600', children: 'Taxes & Fees' }),
                        i.jsx('span', {
                          className: 'font-medium',
                          children: C.formatCurrency(h, e.currency),
                        }),
                      ],
                    }),
                    i.jsxs('div', {
                      className: 'flex justify-between items-center',
                      children: [
                        i.jsx('span', {
                          className: 'text-gray-600',
                          children: 'Service Fee (5%) - You earn rewards!',
                        }),
                        i.jsx('span', {
                          className: 'font-medium',
                          children: C.formatCurrency(d, e.currency),
                        }),
                      ],
                    }),
                    i.jsx('div', {
                      className: 'border-t pt-3',
                      children: i.jsxs('div', {
                        className: 'flex justify-between items-center',
                        children: [
                          i.jsx('span', {
                            className: 'text-lg font-semibold text-gray-900',
                            children: 'Total Paid',
                          }),
                          i.jsx('span', {
                            className: 'text-xl font-bold text-green-600',
                            children: C.formatCurrency(e.totalAmount, e.currency),
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            e.specialRequests &&
              i.jsxs('div', {
                className: 'bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8',
                children: [
                  i.jsx('h3', {
                    className: 'text-lg font-semibold text-yellow-800 mb-2',
                    children: 'Special Requests',
                  }),
                  i.jsx('p', { className: 'text-yellow-700', children: e.specialRequests }),
                ],
              }),
            i.jsxs('div', {
              className: 'flex flex-wrap gap-4 justify-center',
              children: [
                i.jsxs('button', {
                  onClick: v,
                  disabled: a,
                  className:
                    'inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50',
                  children: [
                    i.jsx(ge, { className: 'h-5 w-5 mr-2' }),
                    a ? 'Generating...' : 'Download Receipt',
                  ],
                }),
                i.jsxs('button', {
                  onClick: y,
                  className:
                    'inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors',
                  children: [i.jsx(ve, { className: 'h-5 w-5 mr-2' }), 'Print Receipt'],
                }),
                i.jsxs('button', {
                  onClick: O,
                  className:
                    'inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors',
                  children: [i.jsx(pe, { className: 'h-5 w-5 mr-2' }), 'Share Details'],
                }),
                o &&
                  i.jsxs('div', {
                    className:
                      'inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg',
                    children: [i.jsx(Q, { className: 'h-4 w-4 mr-2' }), 'Confirmation email sent'],
                  }),
              ],
            }),
            t &&
              i.jsx('div', {
                className: 'text-center mt-8',
                children: i.jsx('button', {
                  onClick: t,
                  className:
                    'px-8 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors',
                  children: 'Close',
                }),
              }),
          ],
        }),
        i.jsxs('div', {
          className: 'bg-gray-50 px-6 py-4 border-t text-center',
          children: [
            i.jsx('p', {
              className: 'text-sm text-gray-600',
              children: "Save this confirmation for your records. You'll need it for check-in.",
            }),
            i.jsx('p', {
              className: 'text-xs text-gray-500 mt-2',
              children:
                'Questions? Contact us at support@vibehotels.com | Enjoy your 5% rewards on this booking!',
            }),
          ],
        }),
      ],
    });
  },
  Ut = () => {
    const { bookingId: r } = oe(),
      e = se(),
      t = ce(),
      [a, n] = k.useState(null),
      [o, s] = k.useState(null),
      [d, h] = k.useState(!0),
      [u, p] = k.useState(''),
      v = e.state?.paymentIntent;
    k.useEffect(() => {
      if (!r) {
        (p('Booking ID is required'), h(!1));
        return;
      }
      g();
    }, [r]);
    const g = async () => {
        try {
          (h(!0), p(''));
          const c = r || '',
            l = await le.getBooking(c);
          if (!l) throw new Error('Booking not found');
          if (!l) throw new Error('Booking not found');
          if (l.status !== 'confirmed')
            throw new Error(`Booking is not confirmed. Current status: ${l.status}`);
          if (
            (n({
              id: l.id,
              confirmationNumber: l.confirmationNumber || l.id,
              hotelName: l.hotelName,
              roomType: l.roomType || 'Standard',
              checkIn: new Date(l.checkIn),
              checkOut: new Date(l.checkOut),
              guests: l.guests || 1,
              nights: l.nights || 1,
              totalAmount: l.totalAmount,
              currency: l.currency || 'USD',
              guestFirstName: l.guestFirstName || 'Guest',
              guestLastName: l.guestLastName || 'User',
              guestEmail: l.guestEmail || '',
              guestPhone: l.guestPhone || '',
              specialRequests: l.specialRequests,
              status: l.status,
              paymentStatus: l.paymentStatus || 'pending',
            }),
            v)
          )
            s(v);
          else
            try {
              const f = (await C.getBookingPayments(c)).payments.find(
                (j) => j.status === 'completed',
              );
              if (f && f.transactionId) {
                const j = typeof f.amount == 'string' ? parseFloat(f.amount) : (f.amount ?? 0),
                  E = f.createdAt || new Date().toISOString();
                s({
                  id: f.transactionId,
                  status: 'succeeded',
                  amount: Math.round(j * 100),
                  currency: (f.currency || 'usd').toLowerCase(),
                  created: Math.floor(new Date(E).getTime() / 1e3),
                  payment_method: { card: { brand: 'card', last4: '****' } },
                });
              }
            } catch (b) {
              W.info('Payment details unavailable, continuing without payment info', {
                component: 'BookingConfirmationPage',
                method: 'loadBookingDetails',
                bookingId: c,
                error: b instanceof Error ? b.message : 'Unknown error',
                userImpact: 'missing_payment_details',
              });
            }
        } catch (c) {
          const l = c instanceof Error ? c.message : 'Failed to load booking confirmation';
          (p(l),
            ie.error(l),
            setTimeout(() => {
              t('/');
            }, 5e3));
        } finally {
          h(!1);
        }
      },
      x = () => {
        t('/bookings');
      },
      y = () => {
        t('/');
      };
    if (d)
      return i.jsx('div', {
        className: 'min-h-screen bg-gray-50 flex items-center justify-center',
        children: i.jsxs('div', {
          className: 'text-center',
          children: [
            i.jsx(xe, { className: 'h-12 w-12 animate-spin text-primary mx-auto mb-4' }),
            i.jsx('h2', {
              className: 'text-xl font-semibold text-gray-900 mb-2',
              children: 'Loading Confirmation',
            }),
            i.jsx('p', {
              className: 'text-gray-600',
              children: 'Retrieving your booking details...',
            }),
          ],
        }),
      });
    if (u || !a)
      return i.jsx('div', {
        className: 'min-h-screen bg-gray-50 flex items-center justify-center',
        children: i.jsxs('div', {
          className: 'max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center',
          children: [
            i.jsx(ye, { className: 'h-12 w-12 text-red-500 mx-auto mb-4' }),
            i.jsx('h2', {
              className: 'text-xl font-semibold text-gray-900 mb-4',
              children: 'Unable to Load Confirmation',
            }),
            i.jsx('p', { className: 'text-gray-600 mb-6', children: u }),
            i.jsxs('div', {
              className: 'space-y-3',
              children: [
                i.jsx('p', {
                  className: 'text-sm text-gray-500',
                  children: 'Redirecting to home page in a few seconds...',
                }),
                i.jsxs('button', {
                  onClick: y,
                  className:
                    'inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors',
                  children: [i.jsx(be, { className: 'h-4 w-4 mr-2' }), 'Go to Home Page'],
                }),
              ],
            }),
          ],
        }),
      });
    const O = o || {
      id: `confirmation_${a.confirmationNumber}`,
      status: 'succeeded',
      amount: a.totalAmount * 100,
      currency: a.currency.toLowerCase(),
      created: Math.floor(new Date().getTime() / 1e3),
      payment_method: { card: { brand: 'card', last4: '****' } },
    };
    return i.jsx('div', {
      className: 'min-h-screen bg-gray-50 py-8',
      children: i.jsxs('div', {
        className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
        children: [
          i.jsx('nav', {
            className: 'mb-8',
            children: i.jsxs('ol', {
              className: 'flex items-center space-x-2 text-sm text-gray-500',
              children: [
                i.jsx('li', {
                  children: i.jsx('button', {
                    onClick: y,
                    className: 'hover:text-primary transition-colors',
                    children: 'Home',
                  }),
                }),
                i.jsx('li', { children: '/' }),
                i.jsx('li', {
                  children: i.jsx('button', {
                    onClick: () => t('/bookings'),
                    className: 'hover:text-primary transition-colors',
                    children: 'My Bookings',
                  }),
                }),
                i.jsx('li', { children: '/' }),
                i.jsx('li', { className: 'text-gray-900', children: 'Confirmation' }),
              ],
            }),
          }),
          i.jsx(Ot, { paymentIntent: O, bookingDetails: a, onClose: x }),
          i.jsxs('div', {
            className: 'mt-12 bg-white rounded-lg shadow-sm p-6',
            children: [
              i.jsx('h3', {
                className: 'text-lg font-semibold text-gray-900 mb-4',
                children: "What's Next?",
              }),
              i.jsxs('div', {
                className: 'grid md:grid-cols-3 gap-6',
                children: [
                  i.jsxs('div', {
                    className: 'text-center',
                    children: [
                      i.jsx('div', {
                        className:
                          'w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3',
                        children: i.jsx('span', {
                          className: 'text-blue-600 font-bold text-lg',
                          children: '1',
                        }),
                      }),
                      i.jsx('h4', {
                        className: 'font-medium text-gray-900 mb-2',
                        children: 'Check Your Email',
                      }),
                      i.jsxs('p', {
                        className: 'text-sm text-gray-600',
                        children: ["We've sent a detailed confirmation to ", a.guestEmail],
                      }),
                    ],
                  }),
                  i.jsxs('div', {
                    className: 'text-center',
                    children: [
                      i.jsx('div', {
                        className:
                          'w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3',
                        children: i.jsx('span', {
                          className: 'text-green-600 font-bold text-lg',
                          children: '2',
                        }),
                      }),
                      i.jsx('h4', {
                        className: 'font-medium text-gray-900 mb-2',
                        children: 'Prepare for Check-in',
                      }),
                      i.jsxs('p', {
                        className: 'text-sm text-gray-600',
                        children: [
                          'Bring a valid ID and this confirmation number:',
                          i.jsx('strong', { children: a.confirmationNumber }),
                        ],
                      }),
                    ],
                  }),
                  i.jsxs('div', {
                    className: 'text-center',
                    children: [
                      i.jsx('div', {
                        className:
                          'w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3',
                        children: i.jsx('span', {
                          className: 'text-purple-600 font-bold text-lg',
                          children: '3',
                        }),
                      }),
                      i.jsx('h4', {
                        className: 'font-medium text-gray-900 mb-2',
                        children: 'Enjoy Your Stay',
                      }),
                      i.jsx('p', {
                        className: 'text-sm text-gray-600',
                        children: 'Check-in starts at 3:00 PM on your arrival date',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          i.jsxs('div', {
            className: 'mt-8 bg-blue-50 rounded-lg p-6 text-center',
            children: [
              i.jsx('h3', {
                className: 'text-lg font-semibold text-blue-900 mb-2',
                children: 'Need Help?',
              }),
              i.jsx('p', {
                className: 'text-blue-700 mb-4',
                children: 'Our customer support team is here to assist you 24/7',
              }),
              i.jsxs('div', {
                className: 'flex flex-col sm:flex-row gap-4 justify-center',
                children: [
                  i.jsxs('a', {
                    href: 'mailto:support@hotelbooking.com',
                    className:
                      'inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors',
                    children: [i.jsx(K, { className: 'h-4 w-4 mr-2' }), 'Email Support'],
                  }),
                  i.jsxs('a', {
                    href: 'tel:+1-800-HOTELS',
                    className:
                      'inline-flex items-center px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors',
                    children: [i.jsx(Z, { className: 'h-4 w-4 mr-2' }), 'Call +1-800-HOTELS'],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    });
  };
export { Ut as BookingConfirmationPage };
//# sourceMappingURL=BookingConfirmationPage-B6VbtcJ1.js.map
