import { defineController } from "@evio/visox-http";
import { NPMError } from "../../../../middleware/error";
import { Login } from "../../../../middleware/login";
import { ScopeService } from "../../../../service/scope";

/**
 * 删除 scope
 * @URL DELETE: /~/scope/:id
 */
export default defineController<'id'>('DELETE', [
  NPMError(),
  Login,
], async req => {
  const profile = req.getProfile();
  const id = Number(req.getParam('id'));
  const Scope = new ScopeService(req.conn);

  const scope = await Scope.getOneByIdNotDeleted(id);
  if (!scope) throw new Error('组织不存在');

  if (!profile.admin) {
    if (profile.id !== scope.uid) {
      throw new Error('非法操作');
    }
  }

  return req.response(await Scope.save(scope.del()));
})