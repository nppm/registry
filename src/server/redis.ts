import { createIoRedisServer } from '@evio/visox-ioredis';
import { configs } from '../configs';

export const RedisServer = createIoRedisServer(() => configs.value.redis);