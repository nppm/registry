import { defineController } from "@evio/visox-http";
import { NPMError } from "../../../../../middleware/error";
import { Login } from "../../../../../middleware/login";
import { SCOPE_ROLE, SCOPE_ROLE_ENUM } from "../../../../../entities/scope.user";
import { UserService } from "../../../../../service/user";
import { ScopeService } from "../../../../../service/scope";
import { ScopeUserService } from "../../../../../service/scope.user";
import { Transaction } from "../../../../../middleware/transaction";
import { Scope } from "../../../../../middleware/scope";

interface IBody {
  user: string,
  role: keyof typeof SCOPE_ROLE
}

export default [
  /**
   * @Commander npm org set :scope :username :role
   */
  defineController<'scope'>('PUT', [
    NPMError(),
    Transaction,
    Login,
    Scope.Usable('scope'),
    Scope.Roleable(SCOPE_ROLE_ENUM.owner, SCOPE_ROLE_ENUM.admin),
  ], async req => {
    const body = req.getBody<IBody>();
    const profile = req.getProfile();
    const scope = req.getScope();
    const current_role = req.getMyScopeRole();
    const beyond = req.checkScopeIsMineOwner();
    const User = new UserService(req.conn);
    const user = await User.getOneByAccount(body.user);
    if (!user) throw new Error('找不到用户');
    if (user.id === profile.id) throw new Error('不能操作自己');

    const ScopeUser = new ScopeUserService(req.conn, scope);
    const _user = await ScopeUser.getOne(user.id);

    if (_user) {
      // 更新
      if (!beyond) {
        switch (current_role) {
          case SCOPE_ROLE_ENUM.owner:
            // 当操作这是 owner
            if (_user.role === SCOPE_ROLE_ENUM.owner && SCOPE_ROLE[body.role] < SCOPE_ROLE_ENUM.owner) {
              // 当被操作者是 pwner 同时 操作级别小于 owner
              throw new Error('不能降级');
            }
            break;
          case SCOPE_ROLE_ENUM.admin:
            // 当操作者是 admin
            if (_user.role >= SCOPE_ROLE_ENUM.admin) {
              // 当被操作者级别 大于等于 admin
              throw new Error('不能越级操作');
            }
            if ([SCOPE_ROLE_ENUM.admin, SCOPE_ROLE_ENUM.owner].includes(SCOPE_ROLE[body.role])) {
              // 只能操作 developer
              throw new Error('非法操作');
            }
            break;
          default: throw new Error('非法操作');
        }
      }
      await ScopeUser.save(_user.updateRole(SCOPE_ROLE[body.role]));
    } else {
      // 添加
      if (!beyond) {
        switch (current_role) {
          case SCOPE_ROLE_ENUM.owner:
            // 当操作这是 owner
            if (SCOPE_ROLE[body.role] === SCOPE_ROLE_ENUM.owner) {
              // owner 不能添加 owner
              throw new Error('不能添加 owner');
            }
            break;
          case SCOPE_ROLE_ENUM.admin:
            // 当操作者是 admin
            if ([SCOPE_ROLE_ENUM.admin, SCOPE_ROLE_ENUM.owner].includes(SCOPE_ROLE[body.role])) {
              // 只能操作 developer
              throw new Error('非法操作');
            }
            break;
          default: throw new Error('非法操作');
        }
      }
      await ScopeUser.add(user.id, SCOPE_ROLE[body.role]);
    }

    return req.response({
      ok: true,
      user: user.account,
      role: SCOPE_ROLE_ENUM[_user.role],
      org: {
        name: scope.name,
        size: (await ScopeUser.getAll()).length,
      }
    });
  }),

  /**
   * @Commander npm org ls :scope
   */
  defineController<'scope'>('GET', [
    NPMError(),
    Login,
  ], async req => {
    let scopename = req.getParam('scope');
    scopename = scopename.startsWith('@') ? scopename : '@' + scopename;
    const Scope = new ScopeService(req.conn);
    const scope = await Scope.getOneByNameNotDeleted(scopename);
    if (!scope) throw new Error('找不到组织');
    const ScopeUser = new ScopeUserService(req.conn, scope);
    const users = await ScopeUser.getAllJoinUser();
    const obj: Record<string, string> = {};
    users.forEach(user => obj[user.account] = SCOPE_ROLE_ENUM[user.role]);
    return req.response(obj);
  }),

  /**
   * @Commander npm org rm orgname username
   * TODO: 待修正
   */
  defineController<'scope'>('DELETE', [
    NPMError(404),
    Transaction,
    Login,
    Scope.Usable('scope'),
    Scope.Roleable(SCOPE_ROLE_ENUM.owner, SCOPE_ROLE_ENUM.admin),
  ], async req => {
    return req.response();
  })
]