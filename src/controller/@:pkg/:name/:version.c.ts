import { defineController } from "@evio/visox-http";
import { NPMError } from "../../../middleware/error";
import { Login } from "../../../middleware/login";
import { PackageService } from "../../../service/package";

/**
 * @Commander npm view
 * @Commander npm info
 */
export default defineController('GET', [
  NPMError(404),
  Login,
], async req => {
  const namespace = '@' + req.getParam('pkg') + '/' + req.getParam('name');
  const version = req.getParam('version');
  const Package = new PackageService(req.conn);
  return req.response(await Package.get(namespace, version));
})