import { defineController } from "@evio/visox-http";
import { NPMError } from "../../../../../../middleware/error";
import { Login } from "../../../../../../middleware/login";
import { UserService } from "../../../../../../service/user";
import { UserTokenService } from "../../../../../../service/user.token";

/**
 * @Commander npm token revoke 
 */
export default defineController('DELETE', [
  NPMError(),
  Login,
], async req => {
  const profile = req.getProfile();
  const key = req.getParam('key');
  const User = new UserService(req.conn);
  const user = await User.getOneByAccount(profile.account);
  if (!user) throw new Error('找不到用户');
  const Token = new UserTokenService(req.conn, user);
  let token = key.length > 6
    ? await Token.getOneByTokenNotDeprecated(key)
    : await Token.getOneByCodeNotDeprecated(key);
  if (!token) throw new Error('找不到 token');
  token = await Token.save(token.del());
  await Token.deleteRedis(token);
  return req.response({
    ok: true,
  })
})