import { defineController } from "@evio/visox-http";
import { NPMError } from "../../../../middleware/error";
import { Login } from "../../../../middleware/login";
import { Transaction } from "../../../../middleware/transaction";
import { UserService } from "../../../../service/user";

/**
 * @Commander npm logout
 */
export default defineController('DELETE', [
  NPMError(403),
  Transaction,
  Login,
], async req => {
  const profile = req.getProfile();
  const token = req.getParam('token');
  const user = new UserService(req.conn);
  await user.logout(profile, token);

  return req.response({
    ok: true,
  })
})