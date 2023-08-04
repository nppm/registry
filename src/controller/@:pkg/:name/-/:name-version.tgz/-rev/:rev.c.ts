import { resolve } from 'node:path';
import { existsSync, unlinkSync } from 'node:fs';
import { defineController } from "@evio/visox-http";
import { NPMError } from "../../../../../../middleware/error";
import { Login } from "../../../../../../middleware/login";
import { Scope } from "../../../../../../middleware/scope";
import { Package } from "../../../../../../middleware/package";
import { configs } from '../../../../../../configs';

export default defineController<'pkg' | 'name' | 'version' | 'rev'>('DELETE', [
  NPMError(404),
  Login,
  Scope.Usable('pkg'),
  Package.Allow('pkg', 'name'),
], async req => {
  const file = resolve(
    configs.value.nfs,
    '@' + req.getParam('pkg'),
    req.getParam('name'),
    req.getParam('version') + '.tgz'
  );
  if (existsSync(file)) unlinkSync(file);
  return req.response({
    ok: true,
  });
})