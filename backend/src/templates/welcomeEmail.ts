import { EmailTemplate } from '../types/email.js';

export interface WelcomeEmailData {
  firstName: string;
  lastName: string;
  email: string;
}

export function createWelcomeEmailTemplate(firstName: string, lastName: string, email: string): EmailTemplate {
  const frontendUrl = process.env.FRONTEND_URL || 'https://vibe-booking.netlify.app';
  
  const subject = 'Welcome to Vibe Hotels - Your Luxury Journey Begins';
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Vibe Hotels</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f7f3e9;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
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
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #b8860b;
        }
        .tagline {
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
            color: #333;
        }
        .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #1c2951;
            margin-bottom: 20px;
        }
        .welcome-text {
            font-size: 16px;
            margin-bottom: 30px;
            color: #555;
        }
        .benefits {
            background: linear-gradient(135deg, #f7f3e9 0%, #f0ede2 100%);
            padding: 30px;
            border-radius: 12px;
            margin: 30px 0;
            border-left: 5px solid #b8860b;
        }
        .benefits h3 {
            color: #1c2951;
            margin-bottom: 20px;
            font-size: 20px;
        }
        .benefit-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .benefit-list li {
            padding: 10px 0;
            border-bottom: 1px solid rgba(184, 134, 11, 0.2);
            font-size: 15px;
        }
        .benefit-list li:last-child {
            border-bottom: none;
        }
        .cta-section {
            text-align: center;
            margin: 40px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #b8860b 0%, #d4af37 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 10px;
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
            font-size: 16px;
            margin: 10px;
            box-shadow: 0 4px 15px rgba(28, 41, 81, 0.3);
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
        .hotel-emoji {
            font-size: 24px;
            margin-bottom: 10px;
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
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="hotel-emoji">🏨</div>
            <div class="logo">Vibe Hotels</div>
            <div class="tagline">Luxury Redefined</div>
        </div>
        
        <div class="content">
            <div class="greeting">Welcome, ${firstName}!</div>
            
            <div class="welcome-text">
                We're thrilled to have you join the Vibe Hotels family. Your journey into luxury hospitality begins now, where every stay is crafted to exceed your expectations.
            </div>
            
            <div class="benefits">
                <h3>Your Exclusive Member Benefits</h3>
                <ul class="benefit-list">
                    <li><strong>Exclusive member rates</strong> - Save up to 20% on all bookings</li>
                    <li><strong>Personalized recommendations</strong> - AI-powered suggestions tailored to you</li>
                    <li><strong>Premium loyalty rewards</strong> - Earn points with every stay</li>
                    <li><strong>Priority booking access</strong> - First access to special offers and exclusive luxury suites</li>
                    <li><strong>24/7 premium concierge support</strong> - Dedicated assistance whenever you need it</li>
                </ul>
            </div>
            
            <div class="cta-section">
                <a href="${frontendUrl}/search" class="cta-button">Browse Hotels</a>
                <a href="${frontendUrl}/profile" class="secondary-button">Complete Profile</a>
            </div>
            
            <div class="welcome-text">
                Whether you're seeking a romantic getaway, business travel accommodation, or a family vacation, our curated selection of luxury hotels worldwide ensures your perfect match.
            </div>
        </div>
        
        <div class="footer">
            <p>Thank you for choosing Vibe Hotels</p>
            <p>Questions? Contact us at <a href="mailto:support@vibehotels.com">support@vibehotels.com</a></p>
            <p style="margin-top: 20px; opacity: 0.8;">
                Vibe Hotels | Luxury Hospitality Worldwide<br>
                This email was sent to ${email}
            </p>
        </div>
    </div>
</body>
</html>`;

  const text = `
Welcome to Vibe Hotels, ${firstName}!

We're thrilled to have you join the Vibe Hotels family. Your journey into luxury hospitality begins now.

Your Exclusive Member Benefits:
• Exclusive member rates - Save up to 20% on all bookings
• Personalized recommendations - AI-powered suggestions tailored to you  
• Premium loyalty rewards - Earn points with every stay
• Priority booking access - First access to special offers and luxury suites
• 24/7 concierge support - Dedicated assistance whenever you need it

Ready to explore? Visit ${frontendUrl}/search to browse our luxury hotels worldwide.
Complete your profile at ${frontendUrl}/profile for personalized experiences.

Whether you're seeking a romantic getaway, business travel accommodation, or a family vacation, our curated selection ensures your perfect match.

Thank you for choosing Vibe Hotels - where luxury meets perfection.

Questions? Contact us at support@vibehotels.com

Vibe Hotels | Luxury Hospitality Worldwide
This email was sent to ${email}
`;

  return {
    to: email,
    subject,
    html,
    text,
    from: {
      name: 'Vibe Hotels',
      email: process.env.FROM_EMAIL || 'welcome@vibehotels.com'
    }
  };
}