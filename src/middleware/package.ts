import { Context, Next } from "koa"
import { Scope } from "./scope";
import { CheckLogin } from "./login";
import { PackageService } from "../service/package";
import { PackageMaintainerService } from "../service/package.maintainer";
import { ScopeUserService } from "../service/scope.user";
import { NPMPackageEntity } from "../entities/package";

const Package = {
  Allow,
  CheckAllow(ctx: Context) {
    if (ctx.state.package === undefined) {
      throw new Error('请优先使用Package.Allowed中间件');
    }
    return ctx.state.package as NPMPackageEntity;
  }
}

export {
  Package,
}

function Allow(key: string, name?: string) {
  return async (ctx: Context, next: Next) => {
    const profile = CheckLogin(ctx);
    const [scope] = Scope.CheckUsable(ctx);
    let namespace: string = name ? ctx.params[key] + '/' + ctx.params['name'] : ctx.params[key];
    namespace = namespace.startsWith('@') ? namespace : '@' + namespace;

    const error = new Error('非法操作');
    const ScopeUser = new ScopeUserService(ctx.state.conn, scope);
    const Package = new PackageService(ctx.state.conn);
    const pkg = await Package.getOneByNameSpace(namespace);
    const Maintainer = new PackageMaintainerService(ctx.state.conn, pkg);
    const isMaintainer = !!(await Maintainer.getOne(profile.id, namespace));
    const user = await ScopeUser.getOne(profile.id);

    if (!scope.privatable && pkg && (pkg.uid !== profile.id && !isMaintainer)) throw error;
    if (scope.privatable && !pkg && !user) throw error;
    if (scope.privatable && pkg && !user && (pkg.uid !== profile.id && !isMaintainer)) throw error;

    ctx.state.package = pkg;
    await next();

    // if (!scope.privatable) {
    //   // 公开 scope
    //   if (!pkg) {
    //     // 如果包不存在
    //     // 那么允许具备权限
    //     return await next();
    //   } else {
    //     // 包已存在
    //     if (pkg.uid === profile.id || isMaintainer) {
    //       // 包是自己发布的
    //       // 或者是维护者
    //       // 那么允许具备权限
    //       return await next();
    //     } else {
    //       throw error;
    //     }
    //   }
    // } else {
    //   // 私有 scope
    //   if (!pkg) {
    //     // 包不存在
    //     if (user) {
    //       // 如果 具备 scope 权限
    //       return await next();
    //     } else {
    //       throw error;
    //     }
    //   } else {
    //     // 保存在
    //     if (user) {
    //       // 如果 具备 scope 权限
    //       return await next();
    //     } else {
    //       // 如果不具备 scope 权限
    //       // 需要验证包自身的权限
    //       if (pkg.uid === profile.id || isMaintainer) {
    //         // 包是自己发布的
    //         // 或者是维护者
    //         // 那么允许具备权限
    //         return await next();
    //       } else {
    //         throw error;
    //       }
    //     }
    //   }
    // }
  }
}