import { resolve } from 'node:path';
import { existsSync, createReadStream } from 'node:fs';
import { defineController } from "@evio/visox-http";
import { NPMError } from "../../../../../middleware/error";
import { Login } from "../../../../../middleware/login";
import { Scope } from "../../../../../middleware/scope";
import { Package } from "../../../../../middleware/package";
import { PackageVersionService } from "../../../../../service/package.version";
import { PackageDownloadService } from "../../../../../service/package.download";
import { configs } from '../../../../../configs';

/**
 * @Commander npm install
 */
export default defineController<'pkg' | 'name' | 'version'>('GET', [
  NPMError(404),
  Login,
  Scope.Usable('pkg'),
  Package.Allow('pkg', 'name'),
], async req => {
  const pkg = req.getPackage();
  if (!pkg) throw new Error('非法操作');

  const PackageVersion = new PackageVersionService(req.conn, pkg);
  const version = await PackageVersion.getOneByVersion(req.getParam('version'));
  if (!version) throw new Error('非法操作');

  const Download = new PackageDownloadService(req.conn, version);
  await Download.increase(req.getProfile().id);

  const file = resolve(
    configs.value.nfs,
    '@' + req.getParam('pkg'),
    req.getParam('name'),
    req.getParam('version') + '.tgz'
  );

  if (!existsSync(file)) throw new Error('非法操作');

  return req.response(createReadStream(file));
})