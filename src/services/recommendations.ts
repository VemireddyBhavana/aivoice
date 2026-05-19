import { prisma } from '../db';

/**
 * Computes customer historical favorites and time-of-day popular menu items.
 * @param merchantId The unique ID of the restaurant.
 * @param customerPhone The phone number of the customer.
 */
export async function getRecommendations(
  merchantId: string,
  customerPhone: string
): Promise<{ favorites: string[]; popularTimeOfDay: string[] }> {
  try {
    // 1. Query past paid orders from this specific customer to compute favorites
    const customerOrders = await prisma.order.findMany({
      where: {
        merchantId,
        customerPhone,
        paymentStatus: 'PAID',
      },
      select: {
        items: true,
      },
    });

    const itemFrequency: Record<string, number> = {};

    for (const order of customerOrders) {
      const items = (order.items as any) || [];
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item && item.name) {
            itemFrequency[item.name] = (itemFrequency[item.name] || 0) + 1;
          }
        }
      }
    }

    // Favorites are items ordered >= 2 times
    const favorites = Object.entries(itemFrequency)
      .filter(([_, count]) => count >= 2)
      .map(([name]) => name);

    // 2. Query all paid orders in the last 30 days to extract time-of-day popular suggestions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const allOrders = await prisma.order.findMany({
      where: {
        merchantId,
        paymentStatus: 'PAID',
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        items: true,
        createdAt: true,
      },
    });

    const currentHour = new Date().getHours();
    const popularFrequency: Record<string, number> = {};

    for (const order of allOrders) {
      const orderHour = new Date(order.createdAt).getHours();
      
      // Check if order hour is within ±2 hours (including wraparound)
      const diff = Math.abs(orderHour - currentHour);
      const isWithinWindow = diff <= 2 || diff >= 22;

      if (isWithinWindow) {
        const items = (order.items as any) || [];
        if (Array.isArray(items)) {
          for (const item of items) {
            if (item && item.name) {
              popularFrequency[item.name] = (popularFrequency[item.name] || 0) + 1;
            }
          }
        }
      }
    }

    const popularTimeOfDay = Object.entries(popularFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    return {
      favorites: favorites.slice(0, 3),
      popularTimeOfDay,
    };
  } catch (err) {
    console.error('[Recommendations] Error generating recommendations:', err);
    return { favorites: [], popularTimeOfDay: [] };
  }
}
