import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RedisCacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get(key: string): Promise<any> {
    return await this.cacheManager.get(key);
  }

  async set(key: string, value: any, option?: any) {
    await this.cacheManager.set(key, value, option);
  }

  async reset() {
    await this.cacheManager.reset();
  }

  async del(key: string) {
    await this.cacheManager.del(key);
  }
}
