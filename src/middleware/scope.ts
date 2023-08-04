import { Context, Next } from "koa";
import { ScopeService } from "../service/scope";
import { SCOPE_ROLE_ENUM } from "../entities/scope.user";
import { NPMUserEntity } from "../entities/user";
import { ScopeUserService } from "../service/scope.user";
import { NPMScopeEntity } from "../entities/scope";
import { CheckLogin } from "./login";

/**
 * 确保 scope 的可用性
 * @param key 
 * @returns 
 */
function Useable(key: string) {
  return async (ctx: Context, next: Next) => {
    const profile = CheckLogin(ctx);
    let namespace: string = ctx.params[key];
    namespace = namespace.startsWith('@') ? namespace : '@' + namespace;
    const scopename = namespace.split('/')[0];
    const Scope = new ScopeService(ctx.state.conn);
    const scope = await Scope.getOneByNameNotDeleted(scopename);
    if (!scope) throw new Error('找不到组织');
    if (!scope.confirmed) throw new Error('该组织暂未通过审批');
    ctx.state.scope = scope;
    ctx.state.scope_beyond = scope.uid === profile.id;
    await next();
  }
}

/**
 * 确定当前登录用户是否具备权限
 * @param roles 
 * @returns 
 */
function Roleable(...roles: SCOPE_ROLE_ENUM[]) {
  return async (ctx: Context, next: Next) => {
    const profile = CheckLogin(ctx);
    const [scope, scope_is_mine] = Scope.CheckUsable(ctx);

    if (scope_is_mine) {
      ctx.state.scope_role = SCOPE_ROLE_ENUM.owner;
      return await next();
    }

    const ScopeUser = new ScopeUserService(ctx.state.conn, scope);
    const user = await ScopeUser.getOne(profile.id);
    if (!user) throw new Error('非法用户');
    if (!roles.includes(user.role)) throw new Error('非法操作');

    ctx.state.scope_role = user.role;

    await next();
  }
}

const Scope = {
  Usable: Useable,
  Roleable: Roleable,
  CheckUsable(ctx: Context) {
    if (ctx.state.scope === undefined || ctx.state.scope_beyond === undefined) {
      throw new Error('请优先使用Scope.Usable中间件');
    }
    return [
      ctx.state.scope as NPMScopeEntity,
      ctx.state.scope_beyond as boolean,
    ] as const;
  },
  CheckRoleable(ctx: Context) {
    if (ctx.state.scope_role === undefined) {
      throw new Error('请优先使用Scope.Roleable中间件');
    }
    return ctx.state.scope_role as SCOPE_ROLE_ENUM;
  }
}

export {
  Scope
}