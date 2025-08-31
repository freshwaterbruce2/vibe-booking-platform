import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * Privacy Policy API endpoint
 */
router.get('/privacy-policy', (req: Request, res: Response) => {
  try {
    const privacyPolicy = {
      title: 'Vibe Booking Privacy Policy',
      lastUpdated: '2025-08-26',
      version: '2.0',
      effective: '2025-08-26',
      sections: {
        overview: {
          title: 'Privacy Overview',
          content: {
            commitment: 'Vibe Booking is committed to protecting your privacy and ensuring the security of your personal data. We comply with GDPR, CCPA, and other applicable privacy laws.',
            principles: [
              'We only collect data necessary for providing our services',
              'We never sell your personal data to third parties',
              'You have full control over your data and privacy settings',
              'We comply with all applicable privacy regulations'
            ]
          }
        },
        dataCollection: {
          title: 'Data We Collect',
          content: {
            accountInfo: [
              'Name, email address, and phone number',
              'Secure password (encrypted and hashed)',
              'Profile preferences and booking history',
              'Communication preferences'
            ],
            bookingInfo: [
              'Hotel preferences and search criteria',
              'Booking dates and guest information',
              'Special requests and accessibility needs',
              'Payment information (processed securely via Square)'
            ],
            usageData: [
              'Pages visited and features used',
              'Search queries and filters applied',
              'Device information and browser type',
              'IP address and general location (city/country)'
            ],
            paymentNote: 'We never store credit card numbers or sensitive payment data on our servers. All payment processing is handled securely by Square with PCI-DSS compliance.'
          }
        },
        dataUsage: {
          title: 'How We Use Your Data',
          content: {
            primary: [
              'Process and manage your hotel bookings',
              'Send booking confirmations and updates',
              'Provide customer support and assistance',
              'Process payments and refunds securely'
            ],
            improvement: [
              'Personalize your booking experience',
              'Recommend hotels based on your preferences',
              'Improve our website and mobile app',
              'Analyze usage patterns to enhance features'
            ],
            communication: [
              'Send important account and booking notifications',
              'Provide customer support via email or phone',
              'Send promotional offers (with your consent)',
              'Notify about policy changes or updates'
            ],
            legal: [
              'Comply with applicable laws and regulations',
              'Prevent fraud and ensure platform security',
              'Respond to legal requests when required',
              'Maintain audit trails for financial transactions'
            ]
          }
        },
        dataSharing: {
          title: 'Data Sharing',
          content: {
            promise: 'We never sell your personal data. We only share information when necessary to provide our services or as required by law.',
            serviceProviders: {
              hotels: 'Booking details for reservation processing',
              paymentProcessors: 'Square for secure payment handling',
              emailService: 'SendGrid for transactional emails',
              analytics: 'Aggregated, non-personal usage data'
            },
            legal: [
              'Court orders or legal process',
              'Law enforcement requests with valid warrants',
              'Protection of our legal rights and property',
              'Prevention of fraud or illegal activities'
            ]
          }
        },
        cookies: {
          title: 'Cookies & Tracking',
          content: {
            essential: {
              description: 'Required for basic platform functionality',
              types: [
                'Authentication and login status',
                'Shopping cart and booking session',
                'Security and fraud prevention',
                'Language and region preferences'
              ]
            },
            analytics: {
              description: 'Help us understand how you use our platform',
              types: [
                'Page views and popular content',
                'User journey and navigation patterns',
                'Performance and error tracking',
                'Feature usage statistics'
              ],
              optOut: 'You can opt-out of analytics cookies in your browser settings.'
            },
            marketing: {
              description: 'Used for personalized marketing (with your consent)',
              types: [
                'Personalized hotel recommendations',
                'Retargeting for abandoned bookings',
                'Email marketing personalization',
                'Social media integration'
              ],
              control: 'Manage marketing cookies through our cookie consent banner.'
            }
          }
        },
        rights: {
          title: 'Your Privacy Rights',
          content: {
            description: 'Under GDPR, CCPA, and other privacy laws, you have comprehensive rights regarding your personal data.',
            categories: {
              access: [
                'Request a copy of your data',
                'Download your booking history',
                'View data processing activities',
                'Export data in common formats'
              ],
              correction: [
                'Update your profile information',
                'Correct inaccurate data',
                'Modify communication preferences',
                'Change privacy settings'
              ],
              deletion: [
                'Request account deletion',
                'Remove specific data entries',
                'Clear browsing and search history',
                'Withdraw consent for processing'
              ],
              restriction: [
                'Object to marketing communications',
                'Restrict certain data processing',
                'Opt-out of analytics tracking',
                'Limit automated decision-making'
              ]
            },
            exercise: {
              description: 'Contact us to exercise your privacy rights',
              email: 'privacy@vibebooking.com',
              form: '/privacy-request',
              responseTime: 'We will respond to your request within 30 days as required by law.'
            }
          }
        },
        contact: {
          title: 'Contact Information',
          content: {
            privacyTeam: {
              email: 'privacy@vibebooking.com',
              description: 'For privacy-related inquiries'
            },
            supportLine: {
              phone: '+1 (555) VIBE-BOOK',
              hours: 'Mon-Fri, 9AM-6PM EST'
            },
            mailingAddress: {
              company: 'Vibe Booking Privacy Office',
              address1: '123 Luxury Lane, Suite 456',
              address2: 'San Francisco, CA 94102',
              country: 'United States'
            },
            dpo: {
              email: 'dpo@vibebooking.com',
              description: 'For EU residents or GDPR-specific inquiries'
            }
          }
        }
      },
      compliance: {
        gdpr: true,
        ccpa: true,
        pipeda: true,
        lgpd: true
      },
      jurisdiction: 'United States',
      governingLaw: 'California',
      languages: ['en-US']
    };

    res.json({
      success: true,
      data: privacyPolicy,
      meta: {
        timestamp: new Date().toISOString(),
        version: privacyPolicy.version,
        contentLength: JSON.stringify(privacyPolicy).length
      }
    });

  } catch (error: any) {
    logger.error('Privacy policy API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve privacy policy',
      message: 'Internal server error'
    });
  }
});

/**
 * Terms of Service API endpoint
 */
router.get('/terms-of-service', (req: Request, res: Response) => {
  try {
    const termsOfService = {
      title: 'Vibe Booking Terms of Service',
      lastUpdated: '2025-08-26',
      version: '2.0',
      effective: '2025-08-26',
      sections: {
        agreement: {
          title: 'Agreement to Terms',
          content: 'By accessing and using Vibe Booking platform, you agree to be bound by these Terms of Service and all applicable laws and regulations.'
        },
        services: {
          title: 'Description of Services',
          content: {
            description: 'Vibe Booking provides a luxury hotel booking platform that connects travelers with premium accommodations worldwide.',
            features: [
              'Hotel search and comparison',
              'Secure online booking and payment processing',
              'Customer support and assistance',
              'Personalized recommendations',
              'Booking management and modifications'
            ]
          }
        },
        userAccounts: {
          title: 'User Accounts and Responsibilities',
          content: {
            registration: 'You must provide accurate information when creating an account and maintain the security of your login credentials.',
            responsibilities: [
              'Provide accurate and current information',
              'Maintain the security of your account',
              'Comply with all applicable laws',
              'Respect the rights of other users',
              'Report any security breaches immediately'
            ],
            prohibited: [
              'Creating fake or fraudulent accounts',
              'Sharing account credentials with others',
              'Using automated systems to access the platform',
              'Attempting to circumvent security measures'
            ]
          }
        },
        booking: {
          title: 'Booking Terms and Conditions',
          content: {
            process: 'All bookings are subject to hotel availability and confirmation. Rates and availability may change until booking confirmation is received.',
            payment: {
              processor: 'Square',
              commission: '5% platform commission applies to all successful bookings',
              currency: 'USD',
              authorization: 'Payment authorization occurs at booking time'
            },
            confirmation: 'Booking confirmations are sent via email and should be presented at hotel check-in.',
            modifications: 'Booking modifications are subject to hotel policies and may incur additional fees.',
            cancellation: 'Cancellation policies vary by hotel and rate type. Please review carefully before booking.'
          }
        },
        payments: {
          title: 'Payment Terms',
          content: {
            accepted: ['Credit Cards (Visa, Mastercard, American Express, Discover)', 'Debit Cards', 'Digital Wallets (Apple Pay, Google Pay)'],
            processing: 'All payments are processed securely through Square with PCI-DSS compliance.',
            commission: '5% platform commission is included in the total booking price.',
            refunds: 'Refunds are processed according to hotel cancellation policies and may take 5-10 business days.',
            disputes: 'Payment disputes should be reported within 60 days of the transaction date.'
          }
        },
        cancellation: {
          title: 'Cancellation and Refund Policy',
          content: {
            general: 'Cancellation policies are determined by individual hotels and vary by rate type and booking date.',
            refundable: 'Refundable rates allow free cancellation up to specified deadlines.',
            nonRefundable: 'Non-refundable rates offer lower prices but do not allow cancellations or refunds.',
            processing: 'Approved refunds are processed within 5-10 business days to the original payment method.',
            exceptions: 'Exceptional circumstances (natural disasters, travel restrictions) may qualify for special consideration.'
          }
        },
        liability: {
          title: 'Limitation of Liability',
          content: {
            platform: 'Vibe Booking acts as an intermediary between travelers and hotels. We are not responsible for hotel services, accommodations, or experiences.',
            limitations: [
              'We do not guarantee hotel availability or service quality',
              'Hotel ratings and descriptions are provided by third parties',
              'We are not liable for indirect, incidental, or consequential damages',
              'Our liability is limited to the amount paid for booking services'
            ],
            userResponsibility: 'Users are responsible for verifying hotel information and understanding booking terms before completing reservations.'
          }
        },
        intellectual: {
          title: 'Intellectual Property',
          content: {
            ownership: 'All platform content, including text, graphics, logos, and software, is owned by Vibe Booking or licensed from third parties.',
            userContent: 'By submitting reviews or content, you grant us a non-exclusive license to use, modify, and display such content.',
            restrictions: 'Users may not copy, modify, distribute, or create derivative works from our platform content without permission.'
          }
        },
        privacy: {
          title: 'Privacy and Data Protection',
          content: {
            policy: 'Our Privacy Policy explains how we collect, use, and protect your personal information.',
            compliance: 'We comply with GDPR, CCPA, and other applicable privacy laws.',
            dataMinimization: 'We only collect data necessary to provide our services.',
            userRights: 'You have comprehensive rights regarding your personal data as outlined in our Privacy Policy.'
          }
        },
        termination: {
          title: 'Termination',
          content: {
            userTermination: 'You may terminate your account at any time through account settings or by contacting support.',
            platformTermination: 'We reserve the right to terminate accounts that violate these terms or engage in prohibited activities.',
            effect: 'Upon termination, your right to use the platform ceases, but existing booking obligations remain in effect.'
          }
        },
        changes: {
          title: 'Changes to Terms',
          content: {
            updates: 'We may update these terms periodically to reflect changes in our services or legal requirements.',
            notification: 'Material changes will be communicated via email or platform notification at least 30 days before taking effect.',
            continued: 'Continued use of the platform after changes constitutes acceptance of updated terms.'
          }
        },
        governing: {
          title: 'Governing Law and Dispute Resolution',
          content: {
            law: 'These terms are governed by California law without regard to conflict of law principles.',
            jurisdiction: 'Disputes shall be resolved in the courts of San Francisco, California.',
            arbitration: 'For disputes under $10,000, binding arbitration may be required as an alternative to court proceedings.'
          }
        },
        contact: {
          title: 'Contact Information',
          content: {
            legal: 'legal@vibebooking.com',
            support: 'support@vibebooking.com',
            phone: '+1 (555) VIBE-BOOK',
            address: '123 Luxury Lane, Suite 456, San Francisco, CA 94102'
          }
        }
      },
      acceptance: {
        required: true,
        method: 'Electronic signature or continued platform use',
        tracking: true
      }
    };

    res.json({
      success: true,
      data: termsOfService,
      meta: {
        timestamp: new Date().toISOString(),
        version: termsOfService.version,
        contentLength: JSON.stringify(termsOfService).length
      }
    });

  } catch (error: any) {
    logger.error('Terms of service API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve terms of service',
      message: 'Internal server error'
    });
  }
});

/**
 * Legal document acceptance tracking
 */
router.post('/accept/:document', async (req: Request, res: Response) => {
  try {
    const { document } = req.params;
    const { userId, version, timestamp } = req.body;

    if (!['privacy-policy', 'terms-of-service'].includes(document)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid document type'
      });
    }

    // In production, store acceptance in database
    const acceptance = {
      userId,
      document,
      version,
      acceptedAt: timestamp || new Date().toISOString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    logger.info('Legal document acceptance recorded', acceptance);

    res.json({
      success: true,
      message: 'Document acceptance recorded',
      data: {
        document,
        version,
        acceptedAt: acceptance.acceptedAt
      }
    });

  } catch (error: any) {
    logger.error('Legal acceptance tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record acceptance',
      message: 'Internal server error'
    });
  }
});

/**
 * Privacy request submission
 */
router.post('/privacy-request', async (req: Request, res: Response) => {
  try {
    const { type, email, description, userId } = req.body;

    const validTypes = [
      'data-access',
      'data-correction',
      'data-deletion',
      'data-portability',
      'opt-out',
      'complaint'
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request type'
      });
    }

    if (!email || !description) {
      return res.status(400).json({
        success: false,
        error: 'Email and description are required'
      });
    }

    const request = {
      id: `PR-${Date.now()}`,
      type,
      email,
      description,
      userId: userId || null,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    // In production, store in database and trigger workflow
    logger.info('Privacy request submitted', request);

    res.json({
      success: true,
      message: 'Privacy request submitted successfully',
      data: {
        requestId: request.id,
        type: request.type,
        status: request.status,
        submittedAt: request.submittedAt,
        responseTime: '30 days maximum'
      }
    });

  } catch (error: any) {
    logger.error('Privacy request submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit privacy request',
      message: 'Internal server error'
    });
  }
});

export default router;