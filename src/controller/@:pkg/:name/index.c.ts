import { defineController } from "@evio/visox-http";
import { NPMError } from "../../../middleware/error";
import { Login } from "../../../middleware/login";
import { PackageService } from "../../../service/package";

/**
 * @Commander npm view
 * @Commander npm info
 */
export default defineController<'pkg' | 'name'>('GET', [
  NPMError(404),
  Login,
], async req => {
  const name = req.getParam('name');
  const Package = new PackageService(req.conn);
  return req.response(
    /^\d+\.\d+\.\d+(\-(.+))?$/.test(name)
      ? await Package.get('@' + req.getParam('pkg'), name)
      : await Package.get('@' + req.getParam('pkg') + '/' + name)
  );
})