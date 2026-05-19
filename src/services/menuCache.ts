import { prisma } from '../db';
import { redis } from './redis';

export async function getCachedMenu(merchantId: string) {
  const cacheKey = `menu:${merchantId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[MenuCache] Cache hit for merchant: ${merchantId}`);
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('[MenuCache] Failed to read from cache:', err);
  }

  console.log(`[MenuCache] Cache miss for merchant: ${merchantId}. Querying Database...`);
  const menu = await prisma.menuItem.findMany({
    where: { merchantId, isAvailable: true },
  });

  try {
    await redis.set(cacheKey, JSON.stringify(menu), 300); // 5-minute TTL (300 seconds)
  } catch (err) {
    console.warn('[MenuCache] Failed to populate cache:', err);
  }

  return menu;
}
