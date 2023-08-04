import { defineController } from "@evio/visox-http";
import { NPMError } from "../../../../middleware/error";
import { Login } from "../../../../middleware/login";
import { ScopeService } from "../../../../service/scope";

interface IProps {
  value: boolean,
}

/**
 * 改变组织私有状态
 * @URL POST: /~/scope/:id/private
 */
export default defineController<'id'>('POST', [
  NPMError(),
  Login,
], async req => {
  const id = Number(req.getParam('id'));
  const profile = req.getProfile();
  const body = req.getBody<IProps>();
  const Scope = new ScopeService(req.conn);

  const scope = await Scope.getOneByIdNotDeleted(id);
  if (!scope) throw new Error('组织不存在');

  if (!profile.admin) {
    if (profile.id !== scope.uid) {
      throw new Error('非法操作');
    }
  }

  return req.response(await Scope.save(scope.updatePrivate(body.value)));
})