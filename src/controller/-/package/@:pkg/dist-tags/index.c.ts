import { defineController } from "@evio/visox-http";
import { NPMError } from "../../../../../middleware/error";
import { Login } from "../../../../../middleware/login";
import { Scope } from "../../../../../middleware/scope";
import { PackageService } from "../../../../../service/package";
import { PackageTagService } from "../../../../../service/package.tag";

export default defineController<'pkg'>('GET', [
  NPMError(),
  Login,
  Scope.Usable('pkg'),
], async req => {
  const namespace = '@' + req.getParam('pkg');
  const Package = new PackageService(req.conn);
  const pkg = await Package.getOneByNameSpace(namespace);
  if (!pkg) throw new Error('找不到模块');
  const Tag = new PackageTagService(req.conn, pkg);
  return req.response(await Tag.getDistTags());
})