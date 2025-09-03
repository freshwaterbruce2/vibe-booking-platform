import { emailService } from '../services/emailService.js';
import { logger } from '../utils/logger.js';

async function testEmailService() {
  logger.info('Starting email service test...');

  // Test booking confirmation email
  const testBookingDetails = {
    bookingId: 'TEST-BOOKING-001',
    hotelName: 'Luxury Paradise Hotel',
    checkIn: '2025-09-01',
    checkOut: '2025-09-05',
    guestName: 'John Doe',
    roomType: 'Deluxe Ocean View Suite',
    totalAmount: 1299.99
  };

  try {
    const result = await emailService.sendBookingConfirmation(
      'test@example.com',  // Use a test email
      testBookingDetails
    );

    if (result) {
      logger.info('✅ Booking confirmation email test PASSED');
      console.log('✅ Email service is working correctly!');
      console.log('📧 Test booking confirmation sent successfully');
      console.log('📋 Booking Details:', testBookingDetails);
    } else {
      logger.error('❌ Booking confirmation email test FAILED');
      console.log('❌ Email service test failed');
    }
  } catch (error) {
    logger.error('❌ Email test error:', error);
    console.log('❌ Email test error:', error);
  }

  // Test password reset email
  try {
    const resetResult = await emailService.sendPasswordReset(
      'test@example.com',
      'test-reset-token-123',
      'test@example.com'
    );

    if (resetResult) {
      logger.info('✅ Password reset email test PASSED');
      console.log('✅ Password reset email sent successfully!');
    } else {
      logger.error('❌ Password reset email test FAILED');
      console.log('❌ Password reset email test failed');
    }
  } catch (error) {
    logger.error('❌ Password reset email test error:', error);
    console.log('❌ Password reset email test error:', error);
  }

  console.log('📊 Email service test completed');
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testEmailService().catch(console.error);
}

export { testEmailService };