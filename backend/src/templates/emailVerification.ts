export const createEmailVerificationTemplate = (
  firstName: string,
  verificationUrl: string
) => {
  const subject = 'Verify your email address - Vibe Hotels';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - Vibe Hotels</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: linear-gradient(135deg, #1c2951 0%, #2c4065 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .subtitle { font-size: 16px; opacity: 0.9; }
            .button { display: inline-block; background: linear-gradient(135deg, #b8860b 0%, #d4af37 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: transform 0.2s; }
            .button:hover { transform: translateY(-2px); }
            .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #6c757d; font-size: 14px; border-top: 1px solid #e9ecef; }
            .highlight { color: #1c2951; font-weight: 600; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏨 Vibe Hotels</div>
                <div class="subtitle">Luxury Travel Experience</div>
            </div>
            <div class="content">
                <h1 style="color: #1c2951; margin-bottom: 20px;">Welcome to Vibe Hotels, ${firstName}!</h1>
                
                <p>Thank you for creating your account with Vibe Hotels. To complete your registration and start booking luxury accommodations, please verify your email address.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" class="button">Verify Email Address</a>
                </div>
                
                <p><strong>What's next?</strong></p>
                <ul style="color: #495057; margin-left: 20px;">
                    <li>Browse our collection of premium hotels worldwide</li>
                    <li>Enjoy personalized recommendations based on your travel preferences</li>
                    <li>Access exclusive member rates and benefits</li>
                    <li>Track your booking history and manage reservations</li>
                </ul>
                
                <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
                    <strong>Need help?</strong> If you didn't create this account or have any questions, please contact our support team.
                </p>
                
                <p style="color: #6c757d; font-size: 14px;">
                    This verification link will expire in 24 hours for security reasons.
                </p>
            </div>
            <div class="footer">
                <p>&copy; 2025 Vibe Hotels. All rights reserved.</p>
                <p>Luxury accommodations • Premium service • Unforgettable experiences</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const text = `
Welcome to Vibe Hotels, ${firstName}!

Thank you for creating your account with Vibe Hotels. To complete your registration and start booking luxury accommodations, please verify your email address.

Click this link to verify your email: ${verificationUrl}

What's next?
• Browse our collection of premium hotels worldwide
• Enjoy personalized recommendations based on your travel preferences  
• Access exclusive member rates and benefits
• Track your booking history and manage reservations

This verification link will expire in 24 hours for security reasons.

If you didn't create this account or have any questions, please contact our support team.

© 2025 Vibe Hotels. All rights reserved.
Luxury accommodations • Premium service • Unforgettable experiences
  `;

  return { subject, html, text };
};