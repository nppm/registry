import { defineController } from "@evio/visox-http";
import { NPMError } from "../../../../middleware/error";
import { Login } from "../../../../middleware/login";
import { ScopeService } from "../../../../service/scope";
import { UserService } from "../../../../service/user";
import { ScopeUserService } from "../../../../service/scope.user";

interface IProps {
  value: string,
}

/**
 * 切换创建者
 * @URL POST: /~/scope/:id/owner
 */
export default defineController<'id'>('POST', [
  NPMError(),
  Login,
], async req => {
  const id = req.getParam('id');
  const profile = req.getProfile();
  const body = req.getBody<IProps>();
  const Scope = new ScopeService(req.conn);

  let scope = await Scope.getOneByNameNotDeleted(id);
  if (!scope) throw new Error('组织不存在');

  if (!profile.admin) {
    if (profile.id !== scope.uid) {
      throw new Error('非法操作');
    }
  }

  const User = new UserService(req.conn);
  const user = await User.getOneByAccount(body.value);
  if (!user) throw new Error('用户不存在');

  const ScopeUser = new ScopeUserService(req.conn, scope);
  const scope_user = await ScopeUser.getOne(user.id);
  if (!scope_user) throw new Error('该组织所有者必须为该组织的成员');

  return req.response(await Scope.save(scope.updateOwner(user.id)));
})