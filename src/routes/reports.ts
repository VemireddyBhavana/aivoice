import { Router } from 'express';
import { prisma } from '../db';

export const reportsRouter = Router();

/**
 * GET /api/reports/dashboard
 * Computes live merchant analytics dashboard statistics.
 */
reportsRouter.get('/dashboard', async (req, res) => {
  const merchantId = (req.query.merchantId as string) || 'merchant-1234';

  try {
    // 1. Fetch all PAID orders for this merchant
    const paidOrders = await prisma.order.findMany({
      where: {
        merchantId,
        paymentStatus: 'PAID',
      },
    });

    // 2. Aggregate sales statistics
    const totalOrders = paidOrders.length;
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Filter today's paid orders for daily revenue calculation
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const dailyRevenue = paidOrders
      .filter((o) => new Date(o.createdAt) >= startOfToday)
      .reduce((sum, o) => sum + o.total, 0);

    // 3. Count missed/abandoned voice calls
    // A missed voice call is defined as a VOICE session that did not successfully reach the COMPLETED status.
    const abandonedCallsCount = await prisma.customerSession.count({
      where: {
        merchantId,
        channel: 'VOICE',
        currentState: {
          not: 'COMPLETED',
        },
      },
    });

    // 4. Extract and rank the top ordered menu items from final order JSON arrays
    const itemQuantities: Record<string, { count: number; totalQuantity: number; revenue: number }> = {};

    for (const order of paidOrders) {
      const items = (order.items as any) || [];
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item && item.name) {
            const qty = item.quantity || 1;
            const price = item.price || 0;
            if (!itemQuantities[item.name]) {
              itemQuantities[item.name] = { count: 0, totalQuantity: 0, revenue: 0 };
            }
            itemQuantities[item.name].count += 1;
            itemQuantities[item.name].totalQuantity += qty;
            itemQuantities[item.name].revenue += price * qty;
          }
        }
      }
    }

    const topItems = Object.entries(itemQuantities)
      .map(([name, stats]) => ({
        name,
        ordersCount: stats.count,
        quantitySold: stats.totalQuantity,
        revenueGenerated: Math.round(stats.revenue * 100) / 100,
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5); // Return top 5 items

    console.log(`[Reports API] Successfully calculated analytics for merchant: ${merchantId}`);

    res.status(200).json({
      success: true,
      metrics: {
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        dailyRevenue: Math.round(dailyRevenue * 100) / 100,
        abandonedCallsCount,
      },
      topItems,
    });
  } catch (err: any) {
    console.error('[Reports API] Dashboard reports computation failed:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve reporting analytics metrics.',
      details: err.message,
    });
  }
});
