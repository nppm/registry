import { defineController } from "@evio/visox-http";
import { NPMError } from "../../../../../middleware/error";
import { Login } from "../../../../../middleware/login";
import { Transaction } from "../../../../../middleware/transaction";
import { SCOPE_ROLE_ENUM } from "../../../../../entities/scope.user";
import { UserService } from "../../../../../service/user";
import { ScopeUserService } from "../../../../../service/scope.user";
import { Scope } from "../../../../../middleware/scope";
/**
 * @Commander npm org rm :orgname :username
 */
export default defineController<'scope' | 'account'>('DELETE', [
  NPMError(),
  Transaction,
  Login,
  Scope.Usable('scope'),
  Scope.Roleable(SCOPE_ROLE_ENUM.owner, SCOPE_ROLE_ENUM.admin),
], async req => {
  const profile = req.getProfile();
  const scope = req.getScope();
  const current_role = req.getMyScopeRole();
  const beyond = req.checkScopeIsMineOwner();
  const User = new UserService(req.conn);
  const user = await User.getOneByAccount(req.getParam('account'));
  if (!user) throw new Error('找不到用户');
  if (user.id === profile.id) throw new Error('不能操作自己');
  const ScopeUser = new ScopeUserService(req.conn, scope);
  const _user = await ScopeUser.getOne(user.id);
  if (!_user) throw new Error('非法用户');
  if (!beyond) {
    switch (current_role) {
      case SCOPE_ROLE_ENUM.owner:
        // 当操作这是 owner
        if (_user.role === SCOPE_ROLE_ENUM.owner) {
          // owner 不能删除 owner
          throw new Error('不能删除 owner');
        }
        break;
      case SCOPE_ROLE_ENUM.admin:
        // 当操作者是 admin
        if (_user.role >= SCOPE_ROLE_ENUM.admin) {
          throw new Error('不能越级删除');
        }
        break;
      default: throw new Error('非法操作');
    }
  }

  await ScopeUser.del(user.id);

  return req.response({
    ok: true,
  });
})