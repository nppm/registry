import { defineController } from "@evio/visox-http";
import { Login } from "../../middleware/login";
import { NPMError } from "../../middleware/error";

/**
 * @Commander npm whoami
 */
export default defineController('GET', [
  NPMError(),
  Login
], req => {
  const profile = req.getProfile();
  return req.response({
    username: profile.account,
  });
})