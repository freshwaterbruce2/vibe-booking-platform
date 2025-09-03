import { EmailTemplate } from '../types/email.js';

export interface PasswordResetEmailData {
  firstName: string;
  resetUrl: string;
  expiresInHours: number;
}

export function createPasswordResetEmailTemplate(
  firstName: string, 
  resetUrl: string, 
  expiresInHours: number
): EmailTemplate {
  
  const subject = 'Reset Your Vibe Hotels Password';
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - Vibe Hotels</title>
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
        .message-text {
            font-size: 16px;
            margin-bottom: 30px;
            color: #555;
        }
        .security-notice {
            background: linear-gradient(135deg, #fff3cd 0%, #fef7d3 100%);
            padding: 20px;
            border-radius: 12px;
            border-left: 5px solid #b8860b;
            margin: 20px 0;
        }
        .security-notice h3 {
            color: #856404;
            margin-bottom: 10px;
            font-size: 18px;
        }
        .security-notice p {
            color: #856404;
            margin: 0;
            font-size: 14px;
        }
        .cta-section {
            text-align: center;
            margin: 40px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            color: white;
            padding: 18px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
            transition: all 0.3s ease;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
        }
        .expiry-info {
            text-align: center;
            margin: 20px 0;
            font-size: 14px;
            color: #666;
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
            .cta-button {
                display: block;
                margin: 10px 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔐 Vibe Hotels</div>
            <div class="tagline">Secure Account Recovery</div>
        </div>
        
        <div class="content">
            <div class="greeting">Hello ${firstName},</div>
            
            <div class="message-text">
                We received a request to reset your password for your Vibe Hotels account. If you made this request, click the button below to create a new password.
            </div>
            
            <div class="cta-section">
                <a href="${resetUrl}" class="cta-button">Reset My Password</a>
            </div>
            
            <div class="expiry-info">
                <strong>This link expires in ${expiresInHours} hour${expiresInHours > 1 ? 's' : ''}</strong>
            </div>
            
            <div class="divider"></div>
            
            <div class="security-notice">
                <h3>🛡️ Security Notice</h3>
                <p>
                    If you didn't request this password reset, please ignore this email. Your account remains secure and no changes have been made. 
                    Consider updating your password if you believe your account may be compromised.
                </p>
            </div>
            
            <div class="message-text">
                For your security, this password reset link can only be used once. If you need to request another reset, simply visit our login page and click "Forgot Password" again.
            </div>
        </div>
        
        <div class="footer">
            <p>Thank you for choosing Vibe Hotels</p>
            <p>Questions? Contact us at <a href="mailto:support@vibehotels.com">support@vibehotels.com</a></p>
            <p style="margin-top: 20px; opacity: 0.8;">
                Vibe Hotels Security Team<br>
                This is an automated security message
            </p>
        </div>
    </div>
</body>
</html>`;

  const text = `
Reset Your Vibe Hotels Password

Hello ${firstName},

We received a request to reset your password for your Vibe Hotels account. If you made this request, visit this link to create a new password:

${resetUrl}

This link expires in ${expiresInHours} hour${expiresInHours > 1 ? 's' : ''}.

SECURITY NOTICE:
If you didn't request this password reset, please ignore this email. Your account remains secure and no changes have been made. Consider updating your password if you believe your account may be compromised.

For your security, this password reset link can only be used once. If you need to request another reset, simply visit our login page and click "Forgot Password" again.

Thank you for choosing Vibe Hotels

Questions? Contact us at support@vibehotels.com

Vibe Hotels Security Team
This is an automated security message
`;

  return {
    to: '', // Will be set by the caller
    subject,
    html,
    text,
    from: {
      name: 'Vibe Hotels Security',
      email: process.env.FROM_EMAIL || 'security@vibehotels.com'
    }
  };
}