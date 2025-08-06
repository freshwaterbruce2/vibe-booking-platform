import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest';
import { logger } from '../utils/logger';
import { getDb } from '../database';
import { reviews, bookings, users, NewReview } from '../database/schema';
import { eq, and, desc, avg, count, gte, lte } from 'drizzle-orm';

export const reviewsRouter = Router();

// Validation schemas
const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  hotelId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(200),
  content: z.string().min(10).max(2000),
  aspects: z.object({
    cleanliness: z.number().min(1).max(5).optional(),
    service: z.number().min(1).max(5).optional(),
    location: z.number().min(1).max(5).optional(),
    value: z.number().min(1).max(5).optional(),
    amenities: z.number().min(1).max(5).optional(),
  }).optional(),
  wouldRecommend: z.boolean().optional(),
  stayType: z.enum(['business', 'leisure', 'family', 'couple', 'solo']).optional(),
  photos: z.array(z.string().url()).max(10).optional(),
});

const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(10).max(2000).optional(),
  aspects: z.object({
    cleanliness: z.number().min(1).max(5).optional(),
    service: z.number().min(1).max(5).optional(),
    location: z.number().min(1).max(5).optional(),
    value: z.number().min(1).max(5).optional(),
    amenities: z.number().min(1).max(5).optional(),
  }).optional(),
  wouldRecommend: z.boolean().optional(),
});

const getReviewsSchema = z.object({
  hotelId: z.string().uuid().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  stayType: z.enum(['business', 'leisure', 'family', 'couple', 'solo']).optional(),
  sortBy: z.enum(['rating', 'date', 'helpful']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// POST /api/reviews - Create a new review
reviewsRouter.post('/', validateRequest(createReviewSchema), async (req, res) => {
  try {
    const userId = req.user?.id;
    const reviewData = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'User must be authenticated to create reviews',
      });
    }

    const db = getDb();

    // Verify booking exists and belongs to user
    const [booking] = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.id, reviewData.bookingId),
          eq(bookings.userId, userId),
          eq(bookings.hotelId, reviewData.hotelId)
        )
      )
      .limit(1);

    if (!booking) {
      return res.status(404).json({
        error: 'Booking Error',
        message: 'Booking not found or does not belong to you',
      });
    }

    // Check if user has already reviewed this booking
    const [existingReview] = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.bookingId, reviewData.bookingId),
          eq(reviews.userId, userId)
        )
      )
      .limit(1);

    if (existingReview) {
      return res.status(400).json({
        error: 'Review Error',
        message: 'You have already reviewed this booking',
      });
    }

    // Check if booking is completed (check-out date passed)
    if (booking.status !== 'checked_out' && new Date() < booking.checkOut) {
      return res.status(400).json({
        error: 'Review Error',
        message: 'You can only review completed stays',
      });
    }

    // Create review
    const newReview: NewReview = {
      userId,
      bookingId: reviewData.bookingId,
      hotelId: reviewData.hotelId,
      rating: reviewData.rating,
      title: reviewData.title,
      content: reviewData.content,
      aspects: reviewData.aspects || {},
      wouldRecommend: reviewData.wouldRecommend,
      stayType: reviewData.stayType,
      photos: reviewData.photos,
      isVerified: true, // Reviews from actual bookings are verified
      status: 'published',
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        stayDates: {
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
        },
      },
    };

    const [createdReview] = await db
      .insert(reviews)
      .values(newReview)
      .returning();

    // Get user info for response
    const [user] = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const reviewResponse = {
      ...createdReview,
      user: user ? {
        firstName: user.firstName,
        lastName: user.lastName,
      } : null,
    };

    logger.info('Review created', {
      reviewId: createdReview.id,
      userId,
      bookingId: reviewData.bookingId,
      hotelId: reviewData.hotelId,
      rating: reviewData.rating,
    });

    res.status(201).json({
      success: true,
      data: {
        review: reviewResponse,
      },
    });

  } catch (error) {
    logger.error('Failed to create review', { error, body: req.body });
    res.status(500).json({
      error: 'Review Error',
      message: 'Failed to create review. Please try again.',
    });
  }
});

// GET /api/reviews - Get reviews with filters
reviewsRouter.get('/', validateRequest(getReviewsSchema, 'query'), async (req, res) => {
  try {
    const { hotelId, rating, stayType, sortBy, sortOrder, limit, offset } = req.query;

    const db = getDb();

    // Build query conditions
    const conditions = [eq(reviews.status, 'published')];

    if (hotelId) {
      conditions.push(eq(reviews.hotelId, hotelId));
    }

    if (rating) {
      conditions.push(eq(reviews.rating, rating));
    }

    if (stayType) {
      conditions.push(eq(reviews.stayType, stayType));
    }

    // Build sort
    let orderBy;
    switch (sortBy) {
      case 'rating':
        orderBy = sortOrder === 'asc' ? reviews.rating : desc(reviews.rating);
        break;
      case 'helpful':
        orderBy = sortOrder === 'asc' ? reviews.helpfulVotes : desc(reviews.helpfulVotes);
        break;
      case 'date':
      default:
        orderBy = sortOrder === 'asc' ? reviews.createdAt : desc(reviews.createdAt);
        break;
    }

    // Get reviews with user info
    const reviewsList = await db
      .select({
        review: reviews,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(reviews)
      .where(and(...conditions));

    // Get review statistics if filtering by hotel
    let stats = null;
    if (hotelId) {
      const statsQuery = await db
        .select({
          averageRating: avg(reviews.rating),
          totalReviews: count(),
          ratingDistribution: reviews.rating,
        })
        .from(reviews)
        .where(
          and(
            eq(reviews.hotelId, hotelId),
            eq(reviews.status, 'published')
          )
        )
        .groupBy(reviews.rating);

      const ratingDistribution = Array.from({ length: 5 }, (_, i) => {
        const rating = i + 1;
        const found = statsQuery.find(s => s.ratingDistribution === rating);
        return {
          rating,
          count: found?.totalReviews || 0,
        };
      });

      stats = {
        averageRating: parseFloat(statsQuery[0]?.averageRating || '0'),
        totalReviews: statsQuery.reduce((sum, s) => sum + s.totalReviews, 0),
        ratingDistribution,
      };
    }

    res.json({
      success: true,
      data: {
        reviews: reviewsList.map(item => ({
          ...item.review,
          user: item.user,
        })),
        pagination: {
          total,
          offset,
          limit,
          hasMore: total > offset + limit,
        },
        stats,
      },
    });

  } catch (error) {
    logger.error('Failed to get reviews', { error, query: req.query });
    res.status(500).json({
      error: 'Fetch Error',
      message: 'Failed to retrieve reviews',
    });
  }
});

// GET /api/reviews/:reviewId - Get specific review
reviewsRouter.get('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;

    const db = getDb();

    const [reviewData] = await db
      .select({
        review: reviews,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!reviewData) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Review not found',
      });
    }

    res.json({
      success: true,
      data: {
        review: {
          ...reviewData.review,
          user: reviewData.user,
        },
      },
    });

  } catch (error) {
    logger.error('Failed to get review', { error, reviewId: req.params.reviewId });
    res.status(500).json({
      error: 'Fetch Error',
      message: 'Failed to get review',
    });
  }
});

// PUT /api/reviews/:reviewId - Update review
reviewsRouter.put('/:reviewId', validateRequest(updateReviewSchema), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.id;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'User must be authenticated to update reviews',
      });
    }

    const db = getDb();

    // Get existing review
    const [existingReview] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!existingReview) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Review not found',
      });
    }

    // Check ownership
    if (existingReview.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own reviews',
      });
    }

    // Check if review can be updated (within time limit, e.g., 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (existingReview.createdAt < thirtyDaysAgo) {
      return res.status(400).json({
        error: 'Update Error',
        message: 'Reviews can only be updated within 30 days of creation',
      });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.rating !== undefined) {
      updateData.rating = updates.rating;
    }

    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }

    if (updates.content !== undefined) {
      updateData.content = updates.content;
    }

    if (updates.aspects !== undefined) {
      updateData.aspects = {
        ...existingReview.aspects,
        ...updates.aspects,
      };
    }

    if (updates.wouldRecommend !== undefined) {
      updateData.wouldRecommend = updates.wouldRecommend;
    }

    // Update review
    const [updatedReview] = await db
      .update(reviews)
      .set(updateData)
      .where(eq(reviews.id, reviewId))
      .returning();

    logger.info('Review updated', {
      reviewId,
      userId,
      updates: Object.keys(updates),
    });

    res.json({
      success: true,
      data: {
        review: updatedReview,
      },
    });

  } catch (error) {
    logger.error('Failed to update review', { error, reviewId: req.params.reviewId });
    res.status(500).json({
      error: 'Update Error',
      message: 'Failed to update review',
    });
  }
});

// DELETE /api/reviews/:reviewId - Delete review
reviewsRouter.delete('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'User must be authenticated to delete reviews',
      });
    }

    const db = getDb();

    // Get existing review
    const [existingReview] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!existingReview) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Review not found',
      });
    }

    // Check ownership or admin role
    if (existingReview.userId !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own reviews',
      });
    }

    // Soft delete (change status instead of hard delete)
    await db
      .update(reviews)
      .set({
        status: 'deleted',
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, reviewId));

    logger.info('Review deleted', {
      reviewId,
      userId,
      deletedBy: req.user?.isAdmin ? 'admin' : 'user',
    });

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });

  } catch (error) {
    logger.error('Failed to delete review', { error, reviewId: req.params.reviewId });
    res.status(500).json({
      error: 'Delete Error',
      message: 'Failed to delete review',
    });
  }
});

// POST /api/reviews/:reviewId/helpful - Mark review as helpful
reviewsRouter.post('/:reviewId/helpful', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.id;

    const db = getDb();

    // Get existing review
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!review) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Review not found',
      });
    }

    // Increment helpful votes
    const [updatedReview] = await db
      .update(reviews)
      .set({
        helpfulVotes: review.helpfulVotes + 1,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, reviewId))
      .returning();

    // TODO: Track user votes to prevent multiple votes from same user
    // This would require a separate table: review_votes

    logger.info('Review marked as helpful', {
      reviewId,
      userId,
      newHelpfulCount: updatedReview.helpfulVotes,
    });

    res.json({
      success: true,
      data: {
        helpfulVotes: updatedReview.helpfulVotes,
      },
    });

  } catch (error) {
    logger.error('Failed to mark review as helpful', { error, reviewId: req.params.reviewId });
    res.status(500).json({
      error: 'Vote Error',
      message: 'Failed to mark review as helpful',
    });
  }
});

// GET /api/reviews/hotel/:hotelId/summary - Get hotel review summary
reviewsRouter.get('/hotel/:hotelId/summary', async (req, res) => {
  try {
    const { hotelId } = req.params;

    const db = getDb();

    // Get overall statistics
    const [overallStats] = await db
      .select({
        averageRating: avg(reviews.rating),
        totalReviews: count(),
      })
      .from(reviews)
      .where(
        and(
          eq(reviews.hotelId, hotelId),
          eq(reviews.status, 'published')
        )
      );

    // Get rating distribution
    const ratingDistribution = await db
      .select({
        rating: reviews.rating,
        count: count(),
      })
      .from(reviews)
      .where(
        and(
          eq(reviews.hotelId, hotelId),
          eq(reviews.status, 'published')
        )
      )
      .groupBy(reviews.rating);

    // Get aspect ratings
    const aspectStats = await db
      .select({
        aspects: reviews.aspects,
      })
      .from(reviews)
      .where(
        and(
          eq(reviews.hotelId, hotelId),
          eq(reviews.status, 'published'),
          isNotNull(reviews.aspects)
        )
      );

    // Calculate average aspect ratings
    const aspectAverages = {
      cleanliness: 0,
      service: 0,
      location: 0,
      value: 0,
      amenities: 0,
    };

    const aspectCounts = {
      cleanliness: 0,
      service: 0,
      location: 0,
      value: 0,
      amenities: 0,
    };

    aspectStats.forEach(({ aspects }) => {
      if (aspects) {
        Object.keys(aspectAverages).forEach(aspect => {
          if (aspects[aspect]) {
            aspectAverages[aspect] += aspects[aspect];
            aspectCounts[aspect]++;
          }
        });
      }
    });

    Object.keys(aspectAverages).forEach(aspect => {
      if (aspectCounts[aspect] > 0) {
        aspectAverages[aspect] = aspectAverages[aspect] / aspectCounts[aspect];
      }
    });

    // Get recent reviews
    const recentReviews = await db
      .select({
        review: reviews,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(
        and(
          eq(reviews.hotelId, hotelId),
          eq(reviews.status, 'published')
        )
      )
      .orderBy(desc(reviews.createdAt))
      .limit(5);

    res.json({
      success: true,
      data: {
        summary: {
          averageRating: parseFloat(overallStats?.averageRating || '0'),
          totalReviews: overallStats?.totalReviews || 0,
          ratingDistribution: Array.from({ length: 5 }, (_, i) => {
            const rating = i + 1;
            const found = ratingDistribution.find(r => r.rating === rating);
            return {
              rating,
              count: found?.count || 0,
              percentage: overallStats?.totalReviews 
                ? Math.round((found?.count || 0) / overallStats.totalReviews * 100)
                : 0,
            };
          }),
          aspectAverages,
        },
        recentReviews: recentReviews.map(item => ({
          ...item.review,
          user: item.user,
        })),
      },
    });

  } catch (error) {
    logger.error('Failed to get hotel review summary', { error, hotelId: req.params.hotelId });
    res.status(500).json({
      error: 'Summary Error',
      message: 'Failed to get review summary',
    });
  }
});