import { defineController } from "@evio/visox-http";
import { ScopeService } from "../../../service/scope";
import { NPMError } from "../../../middleware/error";
import { Login } from "../../../middleware/login";
import { configs } from "../../../configs";
import { Transaction } from "../../../middleware/transaction";

interface AddScopeBody {
  name: string,
  priv: boolean,
}

export default [
  /**
   * 获取所有 scope 名称
   * @URL GET: /~/scope
   */
  defineController('GET', [], async req => {
    const Scope = new ScopeService(req.conn);
    const scopes = await Scope.getAllByNotDeleted();
    return req.response(scopes);
  }),

  /**
   * 注册新的 scope
   * @URL POST: /~/scope
   */
  defineController('POST', [
    NPMError(),
    Transaction,
    Login,
  ], async req => {
    const profile = req.getProfile();
    const registerable = configs.settings.scope.registerable;
    const confirmable = configs.settings.scope.confirmable;

    let confirmed: boolean;

    if (!registerable) {
      if (!profile.admin) {
        throw new Error('只有管理员可以操作');
      }
      confirmed = true;
    } else {
      // 开放注册
      if (confirmable) {
        // 如果需要审批
        confirmed = false;
      } else {
        confirmed = true;
      }
    }

    const { name, priv } = req.getBody<AddScopeBody>();
    const Scope = new ScopeService(req.conn);
    const scope = await Scope.getOneByName(name);
    if (scope) throw new Error('该组织已存在');

    return req.response(await Scope.add(name, priv, profile.id, confirmed));
  })
]