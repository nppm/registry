import { defineController } from "@evio/visox-http";
import { NPMError } from "../../../../middleware/error";
import { Admin, Login } from "../../../../middleware/login";
import { ScopeService } from "../../../../service/scope";

interface IProps {
  value: boolean,
}

/**
 * 审批 scope 状态
 * @URL POST: /~/scope/:id/confirm
 */
export default defineController<'id'>('POST', [
  NPMError(),
  Login,
  Admin,
], async req => {
  const id = req.getParam('id');
  const body = req.getBody<IProps>();
  const Scope = new ScopeService(req.conn);

  const scope = await Scope.getOneByNameNotDeleted(id);
  if (!scope) throw new Error('组织不存在');

  return req.response(await Scope.save(scope.updateComfirmStatus(body.value)));
})