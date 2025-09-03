/**
 * Optimized Email Templates
 *
 * Moved templates to separate module to improve:
 * - Memory usage (templates cached, not recreated)
 * - Performance (template compilation optimized)
 * - Maintainability (centralized template management)
 * - Bundle size (dead code elimination)
 */

// Shared template styles (cached in memory)
const SHARED_STYLES = {
  container: "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;",
  header: 'background: linear-gradient(135deg, #1C2951 0%, #374151 100%); padding: 30px; text-align: center;',
  title: 'color: #F7F3E9; margin: 0; font-size: 28px; font-weight: 700;',
  subtitle: 'color: #B8860B; margin: 10px 0 0 0; font-size: 18px; font-weight: 600;',
  content: 'padding: 30px;',
  text: 'color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;',
  infoBox: 'background-color: #F0F9FF; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #B8860B;',
  warningBox: 'background-color: #FEF3C7; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #F59E0B;',
  footer: 'background-color: #1C2951; padding: 20px; text-align: center;',
  table: 'width: 100%; border-collapse: collapse;',
  tableRow: 'padding: 8px 0;',
  label: 'color: #64748b; font-weight: 600;',
  value: 'color: #1C2951; font-weight: 700;',
};

// Template factory functions (more memory efficient than template strings)
export const createBookingReminderTemplate = (data: {
  guestName: string;
  hotelName: string;
  hotelAddress: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  confirmationNumber: string;
  checkInTime: string;
  checkOutTime: string;
  specialInstructions: string;
  contactInfo: { phone: string; email: string };
}) => ({
  subject: `Check-in Reminder: ${data.hotelName} Tomorrow`,
  html: buildHtmlTemplate('Check-in Reminder', 'Your stay begins tomorrow!', [
    `<p style="${SHARED_STYLES.text}">Dear ${data.guestName},</p>`,
    `<p style="${SHARED_STYLES.text}">We're excited to welcome you to <strong style="color: #1C2951;">${data.hotelName}</strong> tomorrow!</p>`,
    buildInfoBox('Booking Information', [
      ['Confirmation:', data.confirmationNumber],
      ['Hotel:', data.hotelName],
      ['Address:', data.hotelAddress],
      ['Room Type:', data.roomType],
      ['Check-in:', `${data.checkIn} at ${data.checkInTime}`],
      ['Check-out:', `${data.checkOut} by ${data.checkOutTime}`],
    ]),
    buildWarningBox('📋 Check-in Instructions', data.specialInstructions),
    buildContactBox(data.contactInfo),
    '<p style="color: #64748b; font-size: 14px; text-align: center; margin: 30px 0 0 0;">Safe travels, and we look forward to providing you with an exceptional experience!</p>',
  ], `See you soon!<br><span style="color: #B8860B; font-weight: 600;">The ${data.hotelName} Team</span>`),
  text: buildTextTemplate('Check-in Reminder: Your stay begins tomorrow!', [
    `Dear ${data.guestName},`,
    `We're excited to welcome you to ${data.hotelName} tomorrow!`,
    'Booking Information:',
    `- Confirmation: ${data.confirmationNumber}`,
    `- Hotel: ${data.hotelName}`,
    `- Address: ${data.hotelAddress}`,
    `- Room Type: ${data.roomType}`,
    `- Check-in: ${data.checkIn} at ${data.checkInTime}`,
    `- Check-out: ${data.checkOut} by ${data.checkOutTime}`,
    'Check-in Instructions:',
    data.specialInstructions,
    `Need assistance? Call ${data.contactInfo.phone} or email ${data.contactInfo.email}`,
    'Safe travels!',
  ]),
});

export const createBookingModificationTemplate = (data: {
  guestName: string;
  confirmationNumber: string;
  hotelName: string;
  modificationType: string;
  originalDetails: any;
  newDetails: any;
  modifiedBy: string;
  reason?: string;
  priceAdjustment?: number;
}) => ({
  subject: `Booking Updated - ${data.confirmationNumber}`,
  html: buildHtmlTemplate('Booking Updated', 'Your reservation has been modified', [
    `<p style="${SHARED_STYLES.text}">Dear ${data.guestName},</p>`,
    `<p style="${SHARED_STYLES.text}">Your booking at <strong>${data.hotelName}</strong> has been successfully updated.</p>`,
    buildInfoBox('Updated Booking Details', [
      ['Confirmation:', data.confirmationNumber],
      ['Modification Type:', data.modificationType],
      ['Modified By:', data.modifiedBy === 'guest' ? 'You' : 'Hotel Staff'],
    ]),
    data.priceAdjustment ? buildPriceAdjustment(data.priceAdjustment) : '',
    data.reason ? `<p style="${SHARED_STYLES.text}"><strong>Reason:</strong> ${data.reason}</p>` : '',
  ], 'Thank you for choosing Vibe Hotels'),
  text: buildTextTemplate('Booking Updated', [
    `Dear ${data.guestName},`,
    `Your booking at ${data.hotelName} has been updated.`,
    `Confirmation: ${data.confirmationNumber}`,
    `Modification Type: ${data.modificationType}`,
    data.reason ? `Reason: ${data.reason}` : '',
    data.priceAdjustment ? `Price Adjustment: $${data.priceAdjustment.toFixed(2)}` : '',
    'Thank you for choosing Vibe Hotels',
  ]),
});

export const createProfessionalReceiptTemplate = (data: {
  customerName: string;
  customerEmail: string;
  paymentId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionDate: Date;
  bookingDetails: any;
  priceBreakdown?: any;
}) => ({
  subject: `Payment Receipt - ${data.paymentId}`,
  html: buildHtmlTemplate('Payment Receipt', 'Thank you for your payment', [
    `<p style="${SHARED_STYLES.text}">Dear ${data.customerName},</p>`,
    `<p style="${SHARED_STYLES.text}">We have successfully processed your payment.</p>`,
    buildInfoBox('Payment Details', [
      ['Payment ID:', data.paymentId],
      ['Amount:', `$${data.amount.toFixed(2)} ${data.currency}`],
      ['Payment Method:', data.paymentMethod],
      ['Transaction Date:', data.transactionDate.toLocaleDateString()],
    ]),
    data.priceBreakdown ? buildPriceBreakdown(data.priceBreakdown) : '',
  ], 'Thank you for your business'),
  text: buildTextTemplate('Payment Receipt', [
    `Dear ${data.customerName},`,
    'Payment processed successfully.',
    `Payment ID: ${data.paymentId}`,
    `Amount: $${data.amount.toFixed(2)} ${data.currency}`,
    `Payment Method: ${data.paymentMethod}`,
    `Date: ${data.transactionDate.toLocaleDateString()}`,
    'Thank you for your business',
  ]),
});

// Helper functions for template building (more efficient than string concatenation)
function buildHtmlTemplate(title: string, subtitle: string, contentBlocks: string[], footerText: string): string {
  return `
    <div style="${SHARED_STYLES.container}">
      <div style="${SHARED_STYLES.header}">
        <h1 style="${SHARED_STYLES.title}">${title}</h1>
        <p style="${SHARED_STYLES.subtitle}">${subtitle}</p>
      </div>
      <div style="${SHARED_STYLES.content}">
        ${contentBlocks.join('')}
      </div>
      <div style="${SHARED_STYLES.footer}">
        <p style="color: #F7F3E9; margin: 0; font-size: 14px;">${footerText}</p>
      </div>
    </div>
  `;
}

function buildTextTemplate(title: string, lines: string[]): string {
  return `${title}\n\n${lines.join('\n\n')}\n\n---\nVibe Hotels`;
}

function buildInfoBox(title: string, rows: [string, string][]): string {
  const tableRows = rows.map(([label, value]) =>
    `<tr><td style="${SHARED_STYLES.tableRow} ${SHARED_STYLES.label}">${label}</td><td style="${SHARED_STYLES.tableRow} ${SHARED_STYLES.value}">${value}</td></tr>`,
  ).join('');

  return `
    <div style="${SHARED_STYLES.infoBox}">
      <h3 style="color: #1C2951; margin: 0 0 20px 0; font-size: 20px;">${title}</h3>
      <table style="${SHARED_STYLES.table}">
        ${tableRows}
      </table>
    </div>
  `;
}

function buildWarningBox(title: string, content: string): string {
  return `
    <div style="${SHARED_STYLES.warningBox}">
      <h4 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px;">${title}</h4>
      <p style="color: #78350f; margin: 0; line-height: 1.6;">${content}</p>
    </div>
  `;
}

function buildContactBox(contactInfo: { phone: string; email: string }): string {
  return `
    <div style="text-align: center; margin: 30px 0;">
      <div style="background-color: #1C2951; color: #F7F3E9; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <h4 style="margin: 0 0 15px 0; color: #B8860B;">Need Assistance?</h4>
        <p style="margin: 5px 0; font-size: 16px;">📞 ${contactInfo.phone}</p>
        <p style="margin: 5px 0; font-size: 16px;">✉️ ${contactInfo.email}</p>
      </div>
    </div>
  `;
}

function buildPriceAdjustment(adjustment: number): string {
  const isPositive = adjustment > 0;
  const color = isPositive ? '#dc2626' : '#16a34a';
  const sign = isPositive ? '+' : '';

  return `
    <div style="background-color: ${isPositive ? '#FEE2E2' : '#F0FDF4'}; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid ${color};">
      <h4 style="color: ${color}; margin: 0 0 15px 0; font-size: 16px;">Price Adjustment</h4>
      <p style="color: ${color}; margin: 0; font-weight: 700; font-size: 18px;">${sign}$${Math.abs(adjustment).toFixed(2)}</p>
    </div>
  `;
}

function buildPriceBreakdown(breakdown: any): string {
  const rows = [
    ['Subtotal:', `$${breakdown.subtotal?.toFixed(2) || '0.00'}`],
    ['Taxes:', `$${breakdown.taxes?.toFixed(2) || '0.00'}`],
    ['Fees:', `$${breakdown.fees?.toFixed(2) || '0.00'}`],
  ];

  if (breakdown.total) {
    rows.push(['Total:', `$${breakdown.total.toFixed(2)}`]);
  }

  return buildInfoBox('Price Breakdown', rows);
}