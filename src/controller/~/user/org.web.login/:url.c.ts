import axios from 'axios';
import { Exception, defineController } from "@evio/visox-http";
import { NPMError } from '../../../../middleware/error';
import { configs } from '../../../../configs';
import { UserService } from '../../../../service/user';
import { NPMTokenEntity } from '../../../../entities/token';

interface IResponse {
  status: 'pending' | 'success' | 'error' | 'unknow',
  message: string, // 错误信息
  user: {
    account: string,
    email: string,
    token: string,
  }
}

export default defineController<'url'>('GET', [
  NPMError(404),
], async req => {
  const base64 = req.getParam('url');
  const url = Buffer.from(base64, 'base64').toString();
  const res = await axios.get(url);
  const data = res.data as IResponse;

  if (data.status === 'error') throw new Exception(400, data.message);

  if (data.status === 'pending') return req.response({ ok: true }).status(202).headers({
    'retry-after': configs.settings.user.login.thirdpart.retryAfter + '',
  });

  const service = new UserService(req.conn);
  let token: NPMTokenEntity;

  if (data.status === 'success') {
    let user = await service.getOneByAccount(data.user.account);

    if (user) {
      if (user.basic) throw new Exception(422, '非法操作');
      user = await service.save(user.updatePassword(data.user.token));
      const result = await service.signIn(user);
      user = result.user;
      token = result.token;
    } else {
      const result = await service.register(data.user.account, data.user.token, data.user.email, 'thirdpart');
      user = result.user;
      token = result.token;
    }

    return req.response({
      ok: true,
      id: 'org.couchdb.user:' + user.account,
      token: token.token,
    }).status(200);
  }

  throw new Error('Not Found');
})