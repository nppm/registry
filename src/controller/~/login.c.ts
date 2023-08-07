import { defineController } from "@evio/visox-http";
import { NPMError } from "../../middleware/error";
import { Login } from "../../middleware/login";
import { UserService } from "../../service/user";
import { Transaction } from "../../middleware/transaction";
import { configs } from "../../configs";

export default [
  defineController('GET', [
    NPMError(),
    Login,
  ], req => {
    const profile = req.getProfile();
    return req.response({
      account: profile.account,
      nickname: profile.fullname,
      email: profile.email,
      basic: profile.basic,
      admin: profile.admin,
      homepage: profile.homepage,
      freenode: profile.freenode,
      twitter: profile.twitter,
      github: profile.github,
    })
  }),

  defineController('POST', [
    NPMError(),
    Transaction,
  ], async req => {
    const body = req.getBody<{ account: string, password: string }>();
    const service = new UserService(req.conn);
    const { user, token } = await service.login(body.account, body.password);

    return req.response({
      account: user.account,
      nickname: user.fullname,
      email: user.email,
      basic: user.basic,
      admin: user.admin,
      homepage: user.homepage,
      freenode: user.freenode,
      twitter: user.twitter,
      github: user.github,
    }).cookie('authorization', `Bearer ${token.token}`, {
      path: '/',
      httpOnly: true,
      sameSite: true,
      signed: true,
      expires: configs.settings.user.login.expire
        ? new Date(Date.now() + configs.settings.user.login.expire * 1000)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });
  })
]