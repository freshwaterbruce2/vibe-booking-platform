import { db } from '../database';
import { commissions, revenueReports, payoutBatches } from '../database/schema/commissions';
import { bookings, payments } from '../database/schema';
import { eq, and, gte, lte, desc, sum, count, avg } from 'drizzle-orm';
import { logger } from '../utils/logger';

export class CommissionService {
  /**
   * Calculate and create commission record for a booking
   */
  static async createCommission(
    bookingId: string,
    paymentId: string,
    baseAmount: number,
    currency: string = 'USD',
    commissionRate: number = 0.05
  ) {
    try {
      const commissionAmount = Math.round(baseAmount * commissionRate * 100) / 100;
      const platformFee = commissionAmount;
      const hotelEarnings = baseAmount - commissionAmount;

      const commission = await db.insert(commissions).values({
        bookingId,
        paymentId,
        baseAmount: baseAmount.toString(),
        commissionRate: commissionRate.toString(),
        commissionAmount: commissionAmount.toString(),
        currency: currency.toUpperCase(),
        platformFee: platformFee.toString(),
        hotelEarnings: hotelEarnings.toString(),
        status: 'pending',
      }).returning();

      logger.info('Commission created', {
        commissionId: commission[0].id,
        bookingId,
        paymentId,
        baseAmount,
        commissionAmount,
        platformFee,
      });

      return commission[0];
    } catch (error) {
      logger.error('Failed to create commission', {
        error: error instanceof Error ? error.message : 'Unknown error',
        bookingId,
        paymentId,
        baseAmount,
      });
      throw error;
    }
  }

  /**
   * Update commission status when payment is completed
   */
  static async markCommissionEarned(paymentId: string) {
    try {
      const result = await db.update(commissions)
        .set({
          status: 'earned',
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(commissions.paymentId, paymentId))
        .returning();

      if (result.length > 0) {
        logger.info('Commission marked as earned', {
          commissionId: result[0].id,
          paymentId,
          commissionAmount: result[0].commissionAmount,
        });
      }

      return result;
    } catch (error) {
      logger.error('Failed to mark commission as earned', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentId,
      });
      throw error;
    }
  }

  /**
   * Reverse commission for refunded bookings
   */
  static async reverseCommission(paymentId: string, refundAmount?: number) {
    try {
      const commission = await db.select()
        .from(commissions)
        .where(eq(commissions.paymentId, paymentId))
        .limit(1);

      if (!commission.length) {
        throw new Error('Commission not found for payment');
      }

      const originalCommission = commission[0];
      const originalAmount = parseFloat(originalCommission.baseAmount);
      
      // Calculate partial reversal if refund amount is specified
      let reversalAmount = parseFloat(originalCommission.commissionAmount);
      if (refundAmount && refundAmount < originalAmount) {
        const reversalRate = refundAmount / originalAmount;
        reversalAmount = Math.round(reversalAmount * reversalRate * 100) / 100;
      }

      // Update commission record
      const result = await db.update(commissions)
        .set({
          status: 'reversed',
          commissionAmount: (parseFloat(originalCommission.commissionAmount) - reversalAmount).toString(),
          processedAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            ...originalCommission.metadata as object,
            reversed: true,
            reversalAmount: reversalAmount.toString(),
            reversalDate: new Date().toISOString(),
          },
        })
        .where(eq(commissions.id, originalCommission.id))
        .returning();

      logger.info('Commission reversed', {
        commissionId: originalCommission.id,
        paymentId,
        originalAmount: originalCommission.commissionAmount,
        reversalAmount,
        refundAmount,
      });

      return result[0];
    } catch (error) {
      logger.error('Failed to reverse commission', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentId,
        refundAmount,
      });
      throw error;
    }
  }

  /**
   * Generate revenue report for a specific period
   */
  static async generateRevenueReport(
    startDate: Date,
    endDate: Date,
    reportType: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily',
    currency: string = 'USD'
  ) {
    try {
      logger.info('Generating revenue report', {
        startDate,
        endDate,
        reportType,
        currency,
      });

      // Get booking metrics
      const bookingStats = await db.select({
        totalBookings: count(bookings.id),
        totalRevenue: sum(bookings.totalAmount),
        avgOrderValue: avg(bookings.totalAmount),
      })
      .from(bookings)
      .where(
        and(
          gte(bookings.createdAt, startDate),
          lte(bookings.createdAt, endDate),
          eq(bookings.currency, currency)
        )
      );

      // Get successful bookings
      const successfulBookings = await db.select({
        count: count(bookings.id),
      })
      .from(bookings)
      .where(
        and(
          gte(bookings.createdAt, startDate),
          lte(bookings.createdAt, endDate),
          eq(bookings.currency, currency),
          eq(bookings.status, 'confirmed')
        )
      );

      // Get cancelled bookings
      const cancelledBookings = await db.select({
        count: count(bookings.id),
      })
      .from(bookings)
      .where(
        and(
          gte(bookings.createdAt, startDate),
          lte(bookings.createdAt, endDate),
          eq(bookings.currency, currency),
          eq(bookings.status, 'cancelled')
        )
      );

      // Get commission metrics
      const commissionStats = await db.select({
        totalCommissions: sum(commissions.commissionAmount),
        earnedCommissions: sum(commissions.commissionAmount),
        pendingCommissions: sum(commissions.commissionAmount),
      })
      .from(commissions)
      .where(
        and(
          gte(commissions.createdAt, startDate),
          lte(commissions.createdAt, endDate),
          eq(commissions.currency, currency)
        )
      );

      // Get payment metrics
      const paymentStats = await db.select({
        totalPayments: count(payments.id),
        successfulPayments: count(payments.id),
        failedPayments: count(payments.id),
      })
      .from(payments)
      .where(
        and(
          gte(payments.createdAt, startDate),
          lte(payments.createdAt, endDate),
          eq(payments.currency, currency)
        )
      );

      // Calculate metrics
      const totalBookings = parseInt(bookingStats[0]?.totalBookings?.toString() || '0');
      const totalRevenue = parseFloat(bookingStats[0]?.totalRevenue?.toString() || '0');
      const totalCommissions = parseFloat(commissionStats[0]?.totalCommissions?.toString() || '0');
      const netRevenue = totalRevenue - totalCommissions;
      const averageOrderValue = parseFloat(bookingStats[0]?.avgOrderValue?.toString() || '0');
      const successfulBookingCount = parseInt(successfulBookings[0]?.count?.toString() || '0');
      const cancelledBookingCount = parseInt(cancelledBookings[0]?.count?.toString() || '0');
      const totalPayments = parseInt(paymentStats[0]?.totalPayments?.toString() || '0');
      const successfulPaymentCount = parseInt(paymentStats[0]?.successfulPayments?.toString() || '0');
      const paymentSuccessRate = totalPayments > 0 ? (successfulPaymentCount / totalPayments) * 100 : 0;

      // Create revenue report record
      const report = await db.insert(revenueReports).values({
        reportType,
        reportDate: new Date(),
        startDate,
        endDate,
        totalBookings: totalBookings.toString(),
        totalRevenue: totalRevenue.toString(),
        totalCommissions: totalCommissions.toString(),
        netRevenue: netRevenue.toString(),
        successfulBookings: successfulBookingCount.toString(),
        cancelledBookings: cancelledBookingCount.toString(),
        averageOrderValue: averageOrderValue.toString(),
        totalPayments: totalPayments.toString(),
        successfulPayments: successfulPaymentCount.toString(),
        paymentSuccessRate: paymentSuccessRate.toString(),
        currency,
        status: 'completed',
      }).returning();

      logger.info('Revenue report generated', {
        reportId: report[0].id,
        reportType,
        totalBookings,
        totalRevenue,
        totalCommissions,
        netRevenue,
      });

      return report[0];
    } catch (error) {
      logger.error('Failed to generate revenue report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        startDate,
        endDate,
        reportType,
        currency,
      });
      throw error;
    }
  }

  /**
   * Get dashboard metrics for admin panel
   */
  static async getDashboardMetrics(
    startDate?: Date,
    endDate?: Date,
    currency: string = 'USD'
  ) {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const end = endDate || new Date();

      // Get current period metrics
      const currentMetrics = await this.generateRevenueReport(start, end, 'monthly', currency);

      // Get previous period metrics for comparison
      const previousStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
      const previousEnd = start;
      const previousMetrics = await this.generateRevenueReport(previousStart, previousEnd, 'monthly', currency);

      // Calculate growth rates
      const revenueGrowth = this.calculateGrowthRate(
        parseFloat(currentMetrics.totalRevenue),
        parseFloat(previousMetrics.totalRevenue)
      );

      const bookingGrowth = this.calculateGrowthRate(
        parseInt(currentMetrics.totalBookings),
        parseInt(previousMetrics.totalBookings)
      );

      const commissionGrowth = this.calculateGrowthRate(
        parseFloat(currentMetrics.totalCommissions),
        parseFloat(previousMetrics.totalCommissions)
      );

      // Get top performers (this would need more complex queries in real implementation)
      const topMetrics = {
        topPaymentMethods: [
          { method: 'card', percentage: 95, amount: parseFloat(currentMetrics.totalRevenue) * 0.95 },
          { method: 'bank_transfer', percentage: 5, amount: parseFloat(currentMetrics.totalRevenue) * 0.05 },
        ],
        topCountries: [
          { country: 'US', bookings: Math.floor(parseInt(currentMetrics.totalBookings) * 0.6) },
          { country: 'CA', bookings: Math.floor(parseInt(currentMetrics.totalBookings) * 0.2) },
          { country: 'UK', bookings: Math.floor(parseInt(currentMetrics.totalBookings) * 0.1) },
          { country: 'DE', bookings: Math.floor(parseInt(currentMetrics.totalBookings) * 0.1) },
        ],
      };

      return {
        current: currentMetrics,
        previous: previousMetrics,
        growth: {
          revenue: revenueGrowth,
          bookings: bookingGrowth,
          commissions: commissionGrowth,
        },
        topMetrics,
        period: {
          start,
          end,
          currency,
        },
      };
    } catch (error) {
      logger.error('Failed to get dashboard metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        startDate,
        endDate,
        currency,
      });
      throw error;
    }
  }

  /**
   * Get commission details for a specific period
   */
  static async getCommissionDetails(
    startDate: Date,
    endDate: Date,
    status?: string,
    currency: string = 'USD'
  ) {
    try {
      let conditions = and(
        gte(commissions.createdAt, startDate),
        lte(commissions.createdAt, endDate),
        eq(commissions.currency, currency)
      );

      if (status) {
        conditions = and(conditions, eq(commissions.status, status))!;
      }

      const commissionList = await db.select()
        .from(commissions)
        .where(conditions)
        .orderBy(desc(commissions.createdAt))
        .limit(100);

      const summary = await db.select({
        totalAmount: sum(commissions.commissionAmount),
        count: count(commissions.id),
        avgAmount: avg(commissions.commissionAmount),
      })
      .from(commissions)
      .where(conditions);

      return {
        commissions: commissionList,
        summary: {
          totalAmount: parseFloat(summary[0]?.totalAmount?.toString() || '0'),
          count: parseInt(summary[0]?.count?.toString() || '0'),
          averageAmount: parseFloat(summary[0]?.avgAmount?.toString() || '0'),
        },
        period: {
          startDate,
          endDate,
          status,
          currency,
        },
      };
    } catch (error) {
      logger.error('Failed to get commission details', {
        error: error instanceof Error ? error.message : 'Unknown error',
        startDate,
        endDate,
        status,
        currency,
      });
      throw error;
    }
  }

  /**
   * Calculate growth rate percentage
   */
  private static calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Create payout batch for earned commissions
   */
  static async createPayoutBatch(
    commissionIds: string[],
    processedBy: string
  ) {
    try {
      // Get commission details
      const commissionList = await db.select()
        .from(commissions)
        .where(
          and(
            eq(commissions.status, 'earned'),
            // TODO: Add proper IN clause for commissionIds
          )
        );

      if (!commissionList.length) {
        throw new Error('No eligible commissions found for payout');
      }

      const totalAmount = commissionList.reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);
      const currency = commissionList[0].currency;
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create payout batch
      const batch = await db.insert(payoutBatches).values({
        batchId,
        totalAmount: totalAmount.toString(),
        commissionCount: commissionList.length.toString(),
        currency,
        status: 'pending',
        processedBy,
      }).returning();

      // Update commission records
      await db.update(commissions)
        .set({
          status: 'paid',
          payoutId: batchId,
          payoutDate: new Date(),
          payoutAmount: commissions.commissionAmount, // Individual commission amount
          processedBy,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(commissions.status, 'earned'),
            // TODO: Add proper IN clause for commissionIds
          )
        );

      logger.info('Payout batch created', {
        batchId,
        totalAmount,
        commissionCount: commissionList.length,
        currency,
      });

      return batch[0];
    } catch (error) {
      logger.error('Failed to create payout batch', {
        error: error instanceof Error ? error.message : 'Unknown error',
        commissionIds,
        processedBy,
      });
      throw error;
    }
  }
}

export default CommissionService;