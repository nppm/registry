import { createHttpServer } from "@evio/visox-http";
import { configs } from "../configs";
import { resolve } from 'node:path';
import { koaBody } from 'koa-body';
import { Context, Next } from "koa";
import { logger } from "../logger";
import { useComponent } from "@evio/visox";
import { DataBaseServer } from "./database";
import { HttpRequest } from "../model/request";

export const HTTPServer = createHttpServer(() => {
  const controllers = [resolve(__dirname, '../controller')];
  if (configs.value.controllers) {
    if (!Array.isArray(configs.value.controllers)) {
      configs.value.controllers = [configs.value.controllers];
    }
    controllers.push(...configs.value.controllers);
  }
  return {
    port: configs.value.port,
    createRequest: ctx => new HttpRequest(ctx),
    middlewares: [
      koaBody({
        jsonStrict: false,
        jsonLimit: configs.value.requestBodyJSONLimit,
      }),
      debug,
      async (ctx, next) => {
        ctx.state.conn = await useComponent(DataBaseServer);
        await next();
      }
    ],
    controllers: {
      directory: controllers,
      suffix: 'c',
    },
  }
})

async function debug(ctx: Context, next: Next) {
  if (configs.value.debug) {
    console.log('\n');
    logger.http('######', '------------------------');
    logger.info('Router', ctx.method, ctx.url);
    logger.info('Header', JSON.stringify(ctx.headers, null, 2));
    logger.info('Querys', Object.keys(ctx.query).length ? JSON.stringify(ctx.query, null, 2) : '-');
    logger.info('Params', !!ctx.params ? JSON.stringify(ctx.params, null, 2) : '-');
    logger.info('Body  ', JSON.stringify(ctx.request.body, null, 2));
  }
  await next();
}