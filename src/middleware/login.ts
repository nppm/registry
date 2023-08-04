import { Exception } from "@evio/visox-http";
import { Context, Next } from "koa";
import { NPMUserEntity } from "../entities/user";
import { NPMTokenEntity } from "../entities/token";
import { useComponent } from "@evio/visox";
import { RedisServer } from "../server/redis";
import { UserTokenService } from "../service/user.token";
import { UserService } from "../service/user";

export async function Admin(ctx: Context, next: Next) {
  if (!ctx.state.profile) return NotLogin();
  if (!ctx.state.profile.admin) return notAllowed();
  await next();
}

export async function Login(ctx: Context, next: Next) {
  const authorization = ctx.headers['authorization'];
  if (!authorization) return NotLogin();

  let user: NPMUserEntity, updateRedisToken: NPMTokenEntity;
  const token = authorization.split(' ')[1];
  const redis = await useComponent(RedisServer);
  const KEY_TOKEN = UserTokenService.createCacheKey(token);
  const User = new UserService(ctx.state.conn);
  if (!(await redis.exists(KEY_TOKEN))) {
    const Token = new UserTokenService(ctx.state.conn, user);
    const tokenEntity = await Token.getUserIdByTokenNotDeprecated(token);
    if (!tokenEntity) return NotLogin();
    user = await User.getOneById(tokenEntity.uid);
    updateRedisToken = tokenEntity;
  } else {
    const account = await redis.get(KEY_TOKEN);
    user = await User.getOneByAccount(account);
  }

  if (!user) return NotLogin();
  if (user.forbiden) return forbiden();

  if (updateRedisToken) {
    const Token = new UserTokenService(ctx.state.conn, user);
    await Token.updateRedis(updateRedisToken);
  }

  ctx.state.profile = user;

  await next();
}

function NotLogin() {
  throw new Exception(401, '非法登录');
}

function forbiden() {
  throw new Exception(403, '您被限制登录');
}

function notAllowed() {
  throw new Exception(405, '您不是管理员');
}

export function CheckLogin(ctx: Context) {
  if (ctx.state.profile === undefined) {
    throw new Error('请优先使用Login中间件');
  }
  return ctx.state.profile as NPMUserEntity;
}