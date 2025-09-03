import { EmailTemplate } from '../types/email.js';

export interface BookingConfirmationData {
  firstName: string;
  lastName: string;
  bookingId: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalAmount: number;
  confirmationUrl: string;
}

export function createBookingConfirmationEmailTemplate(bookingData: BookingConfirmationData): EmailTemplate {
  const {
    firstName,
    lastName,
    bookingId,
    hotelName,
    checkIn,
    checkOut,
    nights,
    guests,
    totalAmount,
    confirmationUrl
  } = bookingData;

  // Format dates professionally
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format currency professionally
  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  // Pluralization helpers
  const nightsText = nights === 1 ? '1 night' : `${nights} nights`;
  const guestsText = guests === 1 ? '1 guest' : `${guests} guests`;

  const subject = `Booking Confirmed - ${bookingId} - Your Luxury Stay Awaits`;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation - ${bookingId}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f7f3e9;
            line-height: 1.6;
        }
        .container {
            max-width: 650px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 10px 30px rgba(28, 41, 81, 0.15);
        }
        .header {
            background: linear-gradient(135deg, #1c2951 0%, #2a3a6b 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        .logo {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #b8860b;
        }
        .tagline {
            font-size: 18px;
            opacity: 0.9;
        }
        .confirmation-banner {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            padding: 20px;
            text-align: center;
            color: white;
            font-size: 18px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
            color: #333;
        }
        .greeting {
            font-size: 26px;
            font-weight: 600;
            color: #1c2951;
            margin-bottom: 20px;
        }
        .booking-details {
            background: linear-gradient(135deg, #f7f3e9 0%, #f0ede2 100%);
            padding: 30px;
            border-radius: 12px;
            margin: 30px 0;
            border-left: 5px solid #b8860b;
        }
        .booking-details h3 {
            color: #1c2951;
            margin-bottom: 20px;
            font-size: 22px;
            text-align: center;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid rgba(184, 134, 11, 0.2);
        }
        .detail-row:last-child {
            border-bottom: none;
            font-weight: 600;
            font-size: 18px;
            color: #1c2951;
        }
        .detail-label {
            font-weight: 600;
            color: #1c2951;
        }
        .detail-value {
            color: #555;
        }
        .hotel-name {
            font-size: 20px;
            font-weight: 700;
            color: #b8860b;
            text-align: center;
            margin-bottom: 20px;
        }
        .cta-section {
            text-align: center;
            margin: 40px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #b8860b 0%, #d4af37 100%);
            color: white;
            padding: 18px 36px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 8px 12px;
            box-shadow: 0 4px 15px rgba(184, 134, 11, 0.3);
            transition: all 0.3s ease;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(184, 134, 11, 0.4);
        }
        .secondary-button {
            display: inline-block;
            background: linear-gradient(135deg, #1c2951 0%, #2a3a6b 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 15px;
            margin: 8px 12px;
            box-shadow: 0 4px 15px rgba(28, 41, 81, 0.3);
        }
        .instructions-section {
            background: linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%);
            padding: 25px;
            border-radius: 12px;
            margin: 30px 0;
            border-left: 5px solid #2196f3;
        }
        .instructions-section h3 {
            color: #1976d2;
            margin-bottom: 15px;
            font-size: 20px;
        }
        .instructions-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .instructions-list li {
            padding: 8px 0;
            color: #333;
            font-size: 15px;
        }
        .instructions-list li strong {
            color: #1976d2;
        }
        .policies-section {
            background: linear-gradient(135deg, #fff8e1 0%, #f3e5ab 100%);
            padding: 25px;
            border-radius: 12px;
            margin: 30px 0;
            border-left: 5px solid #ff9800;
        }
        .policies-section h3 {
            color: #e65100;
            margin-bottom: 15px;
            font-size: 20px;
        }
        .policy-item {
            margin: 12px 0;
            color: #333;
            font-size: 15px;
        }
        .policy-item strong {
            color: #e65100;
        }
        .footer {
            background-color: #1c2951;
            color: white;
            padding: 30px;
            text-align: center;
            font-size: 14px;
        }
        .footer a {
            color: #b8860b;
            text-decoration: none;
        }
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent 0%, #ddd 50%, transparent 100%);
            margin: 30px 0;
        }
        @media (max-width: 600px) {
            .container {
                margin: 0;
            }
            .header, .content {
                padding: 20px;
            }
            .cta-button, .secondary-button {
                display: block;
                margin: 10px 0;
            }
            .detail-row {
                flex-direction: column;
                align-items: flex-start;
                gap: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏨 Vibe Hotels</div>
            <div class="tagline">Luxury Hospitality Excellence</div>
        </div>
        
        <div class="confirmation-banner">
            ✅ Your booking has been confirmed!
        </div>
        
        <div class="content">
            <div class="greeting">Congratulations, ${firstName}!</div>
            
            <div class="message-text">
                Your luxury stay has been confirmed. We're delighted to welcome you to an extraordinary experience at one of our world-class partner hotels.
            </div>
            
            <div class="booking-details">
                <h3>📋 Booking Details</h3>
                <div class="hotel-name">${hotelName}</div>
                
                <div class="detail-row">
                    <span class="detail-label">Booking Reference:</span>
                    <span class="detail-value"><strong>${bookingId}</strong></span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Guest Name:</span>
                    <span class="detail-value">${firstName} ${lastName}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Check-in Date:</span>
                    <span class="detail-value">${formatDate(checkIn)}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Check-out Date:</span>
                    <span class="detail-value">${formatDate(checkOut)}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">${nightsText}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Guests:</span>
                    <span class="detail-value">${guestsText}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Total Amount:</span>
                    <span class="detail-value">${formatCurrency(totalAmount)}</span>
                </div>
            </div>
            
            <div class="cta-section">
                <a href="${confirmationUrl}" class="cta-button">View Booking Details</a>
                <a href="${confirmationUrl}?action=manage" class="cta-button">Manage Booking</a>
                <a href="${confirmationUrl}?action=contact" class="secondary-button">Contact Hotel</a>
            </div>
            
            <div class="instructions-section">
                <h3>🏨 Check-in Instructions</h3>
                <ul class="instructions-list">
                    <li><strong>Check-in Time:</strong> 3:00 PM (or later)</li>
                    <li><strong>Check-out Time:</strong> 11:00 AM</li>
                    <li><strong>Required Documents:</strong> Valid photo ID and credit card</li>
                    <li><strong>Early Check-in:</strong> Subject to availability - contact the hotel directly</li>
                    <li><strong>Special Requests:</strong> contact the hotel at least 24 hours in advance</li>
                    <li><strong>Transportation:</strong> Hotel concierge can assist with arrangements</li>
                </ul>
            </div>
            
            <div class="policies-section">
                <h3>📋 Important Policies</h3>
                
                <div class="policy-item">
                    <strong>Cancellation Policy:</strong> free cancellation up to 24 hours before check-in. 
                    Cancellations within 24 hours are subject to a one-night charge.
                </div>
                
                <div class="policy-item">
                    <strong>Modification Policy:</strong> You can modify your booking free of charge up to 
                    24 hours before check-in, subject to availability.
                </div>
                
                <div class="policy-item">
                    <strong>No-Show Policy:</strong> Failure to check-in without prior cancellation will 
                    result in full charges for the entire stay.
                </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="message-text">
                We're committed to making your stay exceptional. If you have any questions or special requirements, 
                please don't hesitate to contact us or reach out to the hotel directly.
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Thank you for choosing Vibe Hotels</strong></p>
            <p>Questions about your booking? Contact us at <a href="mailto:bookings@vibehotels.com">bookings@vibehotels.com</a></p>
            <p style="margin-top: 20px; opacity: 0.8;">
                Vibe Hotels | Luxury Hospitality Worldwide<br>
                Booking Reference: ${bookingId}
            </p>
        </div>
    </div>
</body>
</html>`;

  const text = `
BOOKING CONFIRMED - ${bookingId}

Congratulations, ${firstName}!

Your luxury stay has been confirmed. We're delighted to welcome you to an extraordinary experience.

BOOKING DETAILS:
Hotel: ${hotelName}
Booking Reference: ${bookingId}
Guest: ${firstName} ${lastName}
Check-in: ${formatDate(checkIn)} (3:00 PM or later)
Check-out: ${formatDate(checkOut)} (11:00 AM)
Duration: ${nightsText}
Guests: ${guestsText}
Total Amount: ${formatCurrency(totalAmount)}

MANAGE YOUR BOOKING:
View Details: ${confirmationUrl}
Manage Booking: ${confirmationUrl}?action=manage
Contact Hotel: ${confirmationUrl}?action=contact

CHECK-IN INSTRUCTIONS:
• Check-in Time: 3:00 PM (or later)
• Check-out Time: 11:00 AM
• Required: Valid photo ID and credit card
• Early check-in subject to availability
• Contact hotel for special requests 24h in advance

IMPORTANT POLICIES:
• Cancellation Policy: free cancellation up to 24 hours before check-in
• Modification Policy: modify your booking free of charge up to 24 hours before check-in
• No-Show Policy: Full charges apply for failure to check-in without cancellation

We're committed to making your stay exceptional. Questions? Contact us at bookings@vibehotels.com

Thank you for choosing Vibe Hotels - where luxury meets perfection.

Booking Reference: ${bookingId}
Vibe Hotels | Luxury Hospitality Worldwide
`;

  return {
    to: '', // Will be set by the caller
    subject,
    html,
    text,
    from: {
      name: 'Vibe Hotels Reservations',
      email: process.env.FROM_EMAIL || 'bookings@vibehotels.com'
    }
  };
}