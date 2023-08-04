import { Exception, defineController } from "@evio/visox-http";
import { NPMError } from "../../../middleware/error";
import { Transaction } from "../../../middleware/transaction";
import { configs } from "../../../configs";
import { UserService } from "../../../service/user";
import { Login } from "../../../middleware/login";

interface IBody {
  _id: string,
  name: string,
  password: string,
  email?: string,
  type: string,
  roles: any[],
  date: string
}

export default [
  /**
   * @Comander npm adduser
   * @Comander npm login
   */
  defineController<'account'>('PUT', [
    NPMError(),
    Transaction,
  ], async req => {
    if (!configs.settings.registable) {
      throw new Error('不允许注册');
    }

    const body = req.getBody<IBody>();
    const service = new UserService(req.conn);
    const isRegister = !!body.email;

    const { token } = isRegister
      ? await service.register(body.name, body.password, body.email)
      : await service.login(body.name, body.password);

    return req.response({
      ok: true,
      id: body._id,
      token: token.token,
    });
  }),

  defineController('GET', [
    NPMError(),
    Login
  ], async req => {
    const account = req.getParam('account').substring(1);
    const service = new UserService(req.conn);
    const user = await service.getOneByAccount(account);
    if (!user) throw new Exception(404, '找不到用户');
    return req.response({
      name: user.account,
      email: user.email,
    });
  })
]