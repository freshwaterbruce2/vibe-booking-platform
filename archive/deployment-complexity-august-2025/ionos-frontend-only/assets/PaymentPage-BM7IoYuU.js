import { d as o, j as e, S as p } from './index-BipxYy_H.js';
import { d as j, u as k, r } from './vendor-VgjaNQN2.js';
import { B as w, P as v } from './booking-BEeZsH1D.js';
import { K as S, g as h, q as P, u as B } from './ui-c8TFxX-w.js';
const A = () => {
  const { bookingId: a } = j(),
    i = k(),
    [t, b] = r.useState(null),
    [y, c] = r.useState(!0),
    [m, d] = r.useState(''),
    [u, x] = r.useState('idle'),
    l = r.useCallback(async () => {
      try {
        if ((c(!0), !a)) return;
        const s = await w.getBooking(a);
        if (!s) throw new Error('Booking not found');
        if (!['pending', 'payment_failed'].includes(s.status))
          throw new Error(`Booking not payable. Status: ${s.status}`);
        b({
          id: s.id,
          confirmationNumber: s.confirmationNumber || s.id,
          hotelName: s.hotelName,
          roomType: s.roomType || 'Standard',
          checkIn: new Date(s.checkIn),
          checkOut: new Date(s.checkOut),
          guests: s.guests || 1,
          nights: s.nights || 1,
          totalAmount: s.totalAmount,
          currency: s.currency || 'USD',
          guestFirstName: s.guestFirstName || 'Guest',
          guestLastName: s.guestLastName || 'User',
          guestEmail: s.guestEmail || '',
          guestPhone: s.guestPhone || '',
          status: s.status,
          paymentStatus: s.paymentStatus || 'pending',
        });
      } catch (s) {
        const n = s instanceof Error ? s.message : 'Failed to load booking details';
        (d(n), o.error(n));
      } finally {
        c(!1);
      }
    }, [a]);
  r.useEffect(() => {
    if (!a) {
      (d('Booking ID is required'), c(!1));
      return;
    }
    l();
  }, [a, l]);
  const f = async (s) => {
      try {
        (x('success'),
          o.success('Payment completed successfully!', {
            description:
              'Your booking has been confirmed. You will receive a confirmation email shortly.',
            duration: 5e3,
          }),
          await l(),
          setTimeout(() => {
            i(`/booking/confirmation/${a}`, { state: { paymentIntent: s } });
          }, 3e3));
      } catch (n) {
        (console.error('Error handling payment success:', n),
          o.error(
            'Payment completed but there was an issue updating your booking. Please contact support.',
          ));
      }
    },
    N = (s) => {
      (x('error'), o.error('Payment failed', { description: s, duration: 1e4 }));
    },
    g = () => {
      i(a ? `/booking/${a}` : '/');
    };
  return y
    ? e.jsx('div', {
        className: 'min-h-screen bg-gray-50 flex items-center justify-center',
        children: e.jsxs('div', {
          className: 'text-center',
          children: [
            e.jsx('div', {
              className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto',
            }),
            e.jsx('p', { className: 'mt-4 text-gray-600', children: 'Loading booking details...' }),
          ],
        }),
      })
    : m || !t
      ? e.jsx('div', {
          className: 'min-h-screen bg-gray-50 flex items-center justify-center',
          children: e.jsx('div', {
            className: 'max-w-md mx-auto bg-white rounded-lg shadow-lg p-6',
            children: e.jsxs('div', {
              className: 'text-center',
              children: [
                e.jsx(S, { className: 'h-12 w-12 text-red-500 mx-auto mb-4' }),
                e.jsx('h2', {
                  className: 'text-xl font-semibold text-gray-900 mb-2',
                  children: 'Unable to Load Payment',
                }),
                e.jsx('p', { className: 'text-gray-600 mb-6', children: m }),
                e.jsxs('button', {
                  onClick: g,
                  className:
                    'inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors',
                  children: [e.jsx(h, { className: 'h-4 w-4 mr-2' }), 'Go Back'],
                }),
              ],
            }),
          }),
        })
      : u === 'success'
        ? e.jsx('div', {
            className: 'min-h-screen bg-gray-50 flex items-center justify-center',
            children: e.jsx('div', {
              className: 'max-w-md mx-auto bg-white rounded-lg shadow-lg p-6',
              children: e.jsxs('div', {
                className: 'text-center',
                children: [
                  e.jsx(P, { className: 'h-12 w-12 text-green-500 mx-auto mb-4' }),
                  e.jsx('h2', {
                    className: 'text-xl font-semibold text-gray-900 mb-2',
                    children: 'Payment Successful!',
                  }),
                  e.jsx('p', {
                    className: 'text-gray-600 mb-2',
                    children: 'Your booking has been confirmed.',
                  }),
                  e.jsxs('p', {
                    className: 'text-sm text-gray-500 mb-6',
                    children: [
                      'Confirmation Number: ',
                      e.jsx('span', {
                        className: 'font-mono font-medium',
                        children: t.confirmationNumber,
                      }),
                    ],
                  }),
                  e.jsx('div', {
                    className: 'animate-pulse text-blue-600 text-sm',
                    children: 'Redirecting to confirmation page...',
                  }),
                ],
              }),
            }),
          })
        : u === 'processing'
          ? e.jsx('div', {
              className: 'min-h-screen bg-gray-50 flex items-center justify-center',
              children: e.jsx('div', {
                className: 'max-w-md mx-auto bg-white rounded-lg shadow-lg p-6',
                children: e.jsxs('div', {
                  className: 'text-center',
                  children: [
                    e.jsx(B, { className: 'h-12 w-12 text-yellow-500 mx-auto mb-4' }),
                    e.jsx('h2', {
                      className: 'text-xl font-semibold text-gray-900 mb-2',
                      children: 'Payment Processing',
                    }),
                    e.jsx('p', {
                      className: 'text-gray-600 mb-6',
                      children: 'Your payment is being processed. Please do not refresh this page.',
                    }),
                    e.jsx('div', {
                      className:
                        'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto',
                    }),
                  ],
                }),
              }),
            })
          : e.jsx('div', {
              className: 'min-h-screen bg-gray-50 py-8',
              children: e.jsxs('div', {
                className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
                children: [
                  e.jsxs('div', {
                    className: 'mb-8',
                    children: [
                      e.jsxs('button', {
                        onClick: g,
                        className:
                          'inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors',
                        children: [
                          e.jsx(h, { className: 'h-4 w-4 mr-2' }),
                          'Back to Booking Details',
                        ],
                      }),
                      e.jsx('div', {
                        className: 'bg-white rounded-lg shadow-sm p-6',
                        children: e.jsxs('div', {
                          className: 'flex items-center justify-between',
                          children: [
                            e.jsxs('div', {
                              children: [
                                e.jsx('h1', {
                                  className: 'text-2xl font-bold text-gray-900',
                                  children: 'Complete Your Payment',
                                }),
                                e.jsxs('p', {
                                  className: 'text-gray-600 mt-1',
                                  children: ['Booking #', t.confirmationNumber],
                                }),
                              ],
                            }),
                            e.jsxs('div', {
                              className: 'text-right',
                              children: [
                                e.jsx('p', {
                                  className: 'text-sm text-gray-500',
                                  children: 'Total Amount',
                                }),
                                e.jsx('p', {
                                  className: 'text-2xl font-bold text-blue-600',
                                  children: v.formatCurrency(t.totalAmount, t.currency),
                                }),
                              ],
                            }),
                          ],
                        }),
                      }),
                    ],
                  }),
                  e.jsx(p, {
                    bookingId: t.id,
                    amount: t.totalAmount,
                    currency: t.currency,
                    onSuccess: f,
                    onError: (s) => N(s.message),
                    bookingDetails: {
                      hotelName: t.hotelName,
                      checkIn: t.checkIn.toISOString(),
                      checkOut: t.checkOut.toISOString(),
                      guests: t.guests,
                    },
                  }),
                ],
              }),
            });
};
export { A as PaymentPage };
//# sourceMappingURL=PaymentPage-BM7IoYuU.js.map
