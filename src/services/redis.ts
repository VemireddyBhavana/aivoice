import Redis from 'ioredis';

class RedisService {
  private client: Redis | null = null;
  private memoryCache: Map<string, { value: string; expiresAt: number }> = new Map();
  private memoryBufferCache: Map<string, { value: Buffer; expiresAt: number }> = new Map();
  private isConnected: boolean = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        this.client = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: 2000,
        });

        this.client.on('connect', () => {
          console.log('[Redis] Connected to Redis instance');
          this.isConnected = true;
        });

        this.client.on('error', (err) => {
          console.warn('[Redis] Connection failed or error:', err.message);
          this.isConnected = false;
        });
      } catch (err: any) {
        console.error('[Redis] Failed to initialize Redis client:', err.message);
        this.client = null;
      }
    } else {
      console.log('[Redis] REDIS_URL not configured. Using in-memory fallback cache.');
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.client && this.isConnected) {
      try {
        return await this.client.get(key);
      } catch (err) {
        console.warn(`[Redis] Error getting key "${key}":`, err);
      }
    }

    // In-memory fallback
    const item = this.memoryCache.get(key);
    if (!item) return null;
    if (item.expiresAt < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (err) {
        console.warn(`[Redis] Error setting key "${key}":`, err);
      }
    }

    // In-memory fallback
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
    this.memoryCache.set(key, { value, expiresAt });
  }

  async getBuffer(key: string): Promise<Buffer | null> {
    if (this.client && this.isConnected) {
      try {
        return await this.client.getBuffer(key);
      } catch (err) {
        console.warn(`[Redis] Error getting buffer key "${key}":`, err);
      }
    }

    // In-memory fallback
    const item = this.memoryBufferCache.get(key);
    if (!item) return null;
    if (item.expiresAt < Date.now()) {
      this.memoryBufferCache.delete(key);
      return null;
    }
    return item.value;
  }

  async setBuffer(key: string, value: Buffer, ttlSeconds?: number): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (err) {
        console.warn(`[Redis] Error setting buffer key "${key}":`, err);
      }
    }

    // In-memory fallback
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
    this.memoryBufferCache.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.del(key);
        return;
      } catch (err) {
        console.warn(`[Redis] Error deleting key "${key}":`, err);
      }
    }
    this.memoryCache.delete(key);
    this.memoryBufferCache.delete(key);
  }
}

export const redis = new RedisService();
