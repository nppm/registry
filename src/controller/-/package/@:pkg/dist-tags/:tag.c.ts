import { defineController } from "@evio/visox-http";
import { NPMError } from "../../../../../middleware/error";
import { Login } from "../../../../../middleware/login";
import { Transaction } from "../../../../../middleware/transaction";
import { Scope } from "../../../../../middleware/scope";
import { Package } from "../../../../../middleware/package";
import { PackageVersionService } from "../../../../../service/package.version";
import { PackageTagService } from "../../../../../service/package.tag";

export default [
  defineController<'pkg' | 'tag'>('PUT', [
    NPMError(),
    Transaction,
    Login,
    Scope.Usable('pkg'),
    Package.Allow('pkg'),
  ], async req => {
    const ver = req.getBody<string>();
    const tag = req.getParam('tag');
    const pkg = req.getPackage();
    if (!pkg) throw new Error('找不到模块');
    const PackageVersion = new PackageVersionService(req.conn, pkg);
    const version = await PackageVersion.getOneByVersion(ver);
    if (!version) throw new Error('找不到版本');
    const Tag = new PackageTagService(req.conn, pkg);
    const _tag = await Tag.getOneByTagRecently(tag);
    if (!_tag || _tag.version !== version.version) {
      await Tag.add(tag, version.version);
    }
    return req.response({
      ok: true,
    });
  }),

  defineController<'pkg' | 'tag'>('DELETE', [
    NPMError(),
    Transaction,
    Login,
    Scope.Usable('pkg'),
    Package.Allow('pkg'),
  ], async req => {
    const tag = req.getParam('tag');
    if (tag === 'latest') {
      throw new Error('不能删除`latest`标签');
    }
    const pkg = req.getPackage();
    if (!pkg) throw new Error('找不到模块');
    const Tag = new PackageTagService(req.conn, pkg);
    await Tag.delByTag(tag);
    return req.response({
      ok: true,
    });
  })
]