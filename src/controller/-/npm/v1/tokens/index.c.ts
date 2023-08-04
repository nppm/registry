import { defineController } from "@evio/visox-http";
import { NPMError } from "../../../../../middleware/error";
import { Login } from "../../../../../middleware/login";
import { UserService } from "../../../../../service/user";
import { UserTokenService } from "../../../../../service/user.token";

interface IBody {
  password: string,
  readonly: boolean,
  cidr_whitelist: string[],
}

export default [
  /**
   * @Commander npm token create
   */
  defineController('POST', [
    NPMError(),
    Login,
  ], async req => {
    const profile = req.getProfile();
    const { password, readonly } = req.getBody<IBody>();
    const User = new UserService(req.conn);
    const user = await User.getOneByAccount(profile.account);
    if (!user) throw new Error('找不到用户');
    if (user.basic && !user.checkPassword(password)) {
      throw new Error('密码不正确');
    }
    const Token = new UserTokenService(req.conn, user);
    const token = await Token.add(readonly);
    await Token.updateRedis(token);
    return req.response({
      id: token.code,
      token: token.token,
      readonly: token.readonly ? 'Yes' : 'No',
    })
  }),

  /**
   * @Commander npm token list
   */
  defineController('GET', [
    NPMError(),
    Login,
  ], async req => {
    const profile = req.getProfile();
    const User = new UserService(req.conn);
    const page = Number(req.getQuery('page', '1'));
    const user = await User.getOneByAccount(profile.account);
    if (!user) throw new Error('找不到用户');
    const Token = new UserTokenService(req.conn, user);
    const size = 5;
    const [total, tokens] = await Token.getTokensNotDeprecated(page, size);
    const urls: { next?: string, prev?: string } = {}
    if (page === 1 && page * size < total) {
      urls.next = '/-/npm/v1/tokens?page=' + (page + 1)
    }
    return req.response({
      objects: tokens.map(token => {
        return {
          "cidr_whitelist": null,
          "readonly": token.readonly,
          "automation": false,
          "created": token.gmtc,
          "updated": token.gmtm,
          "key": token.code,
          "token": token.token,
        }
      }),
      total,
      urls,
      userHasOldFormatToken: true,
    })
  })
]