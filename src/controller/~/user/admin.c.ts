import { defineController } from "@evio/visox-http";
import { NPMError } from "../../../middleware/error";
import { Admin, Login } from "../../../middleware/login";
import { UserService } from "../../../service/user";

export default defineController('POST', [
  NPMError(),
  Login,
  Admin,
], async req => {
  const profile = req.getProfile();
  const body = req.getBody<{ name: string, value: boolean }>();
  const account = body.name;
  const value = body.value;
  const User = new UserService(req.conn);
  const user = await User.getOneByAccount(account);
  if (!user) throw new Error('找不到用户');
  if (user.id === profile.id) throw new Error('不能操作自己');
  await User.save(user.updateAdmin(value));
  return req.response({
    ok: true,
  });
})