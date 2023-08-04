import { defineController } from "@evio/visox-http";
import { NPMError } from "../../../middleware/error";
import { Transaction } from "../../../middleware/transaction";
import { Login } from "../../../middleware/login";
import { Scope } from "../../../middleware/scope";
import { Package } from "../../../middleware/package";
import { PackageInComingProps } from "../../../types";
import { PackageVersionService } from "../../../service/package.version";
import { PackageService } from "../../../service/package";
import { PackageMaintainerService } from "../../../service/package.maintainer";
import { UserService } from "../../../service/user";

export default [
  /**
   * @Commander npm unpublish
   * @Commander npm owner
   */
  defineController<'pkg' | 'rev'>('PUT', [
    NPMError(422),
    Transaction,
    Login,
    Scope.Usable('pkg'),
    Package.Allow('pkg'),
  ], async req => {
    const pkg = req.getPackage();
    const body = req.getBody<PackageInComingProps>();

    if (!pkg) throw new Error('非法操作');

    // unpublish
    if (body.versions) {
      const Package = new PackageService(req.conn);
      const PackageVersion = new PackageVersionService(req.conn, pkg);
      const versions = await PackageVersion.getAllVersions();
      const { removes } = diff(
        versions.map(ver => ver.version),
        Object.keys(body.versions)
      )
      for (let i = 0; i < removes.length; i++) {
        const ver = removes[i];
        const version = versions.find(v => v.version === ver);
        if (version) {
          await Package.unPublish(pkg, version);
        }
      }
    }

    // owner
    if (body.maintainers?.length) {
      const PackageMaintainer = new PackageMaintainerService(req.conn, pkg);
      const maintainers = await PackageMaintainer.getAll();
      const { adds, removes } = diff(
        maintainers.map(m => m.name),
        body.maintainers.map(m => m.name)
      )

      const User = new UserService(req.conn);
      for (let i = 0; i < adds.length; i++) {
        const account = adds[i];
        const _user = await User.getOneByAccount(account);
        if (!_user) throw new Error('找不到用户');
        const _maintainer = await PackageMaintainer.getOneByUid(_user.id);
        if (!_maintainer) {
          await PackageMaintainer.add(_user.id);
        }
      }
      for (let i = 0; i < removes.length; i++) {
        const account = removes[i];
        const _user = await User.getOneByAccount(account);
        if (!_user) throw new Error('找不到用户');
        const _maintainer = await PackageMaintainer.getOneByUid(_user.id);
        if (_maintainer) {
          await PackageMaintainer.del(_maintainer.id);
        }
      }
    }

    return req.response({
      ok: true,
    });
  })
];

function diff<T>(a: T[], b: T[]) {
  const removes = [];
  const commons = [];

  a = a.slice().sort();
  b = b.slice().sort();

  for (let i = 0; i < a.length; i++) {
    const value = a[i];
    const index = b.indexOf(value);
    if (index === -1) {
      removes.push(value);
    } else {
      commons.push(value);
      b.splice(index, 1);
    }
  }
  return {
    removes, commons,
    adds: b
  }
}