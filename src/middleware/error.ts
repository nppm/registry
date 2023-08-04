import type { Context, Next } from 'koa';
import { configs } from '../configs';
import { logger } from '../logger';
import { Exception } from '@evio/visox-http';

export function NPMError(code: number = 400) {
  return async (ctx: Context, next: Next) => {
    try {
      await next();
      if (configs.value.debug) {
        logger.info('Response', JSON.stringify(ctx.body, null, 2));
      }
    } catch (e) {
      if (configs.value.debug) {
        logger.error('Error', e.stack);
      }
      ctx.status = e instanceof Exception ? e.status : code;
      ctx.body = {
        error: e.message,
        reason: e.message,
      }
    }
  }
}