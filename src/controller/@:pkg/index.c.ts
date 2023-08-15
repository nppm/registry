import { defineController } from "@evio/visox-http/dist/files";
import { NPMError } from "../../middleware/error";
import { Login } from "../../middleware/login";
import { Transaction } from "../../middleware/transaction";
import { PackageInComingProps } from "../../types";
import { PackageResolve } from "../../service/package.resolve";
import { Scope } from "../../middleware/scope";
import { Package } from "../../middleware/package";
import { PackageService } from "../../service/package";
import { unlink } from "fs-extra";
import { PackageVersionService } from "../../service/package.version";
import { PackageStarService } from "../../service/package.star";

export default [
  /**
   * @Commander npm publish
   * @Commander npm deprecate
   * @Commander npm star
   * @Commander npm unstar
   */
  defineController<'pkg'>('PUT', [
    NPMError(),
    Transaction,
    Login,
    Scope.Usable('pkg'),
  ], async req => {
    const body = req.getBody<PackageInComingProps>();
    const profile = req.getProfile();

    let command: 'publish' | 'deprecate' | 'star' | 'unstar';

    switch (req.NpmCommand) {
      case 'publish':
      case 'deprecate':
      case 'star':
      case 'unstar':
        command = req.NpmCommand;
        break;
    }

    if (!command && Object.keys(body?._attachments || {}).length) {
      command = 'publish';
    }

    const Publish = async () => {
      const pkg = new PackageResolve(body);
      const scope = req.getScope();
      const Package = new PackageService(req.conn);
      const versions = await Package.getVersionsByNameSpace(body.name);
      const { version: versionManifest, md5, tag, tarball } = await pkg.vaildateAttachment(versions);
      const version = await Package.publish(profile.id, versionManifest, scope, md5, tag, tarball.length);
      const file = await pkg.saveTarBall(version.namespace, version.version, tarball);
      req.roll(() => unlink(file));
      return req.response({
        ok: true,
        rev: (versions.length + 1) + '-' + md5,
      });
    }

    const Deprecate = async () => {
      const Package = new PackageService(req.conn);
      const pcg = await Package.getOneByNameSpace(body.name);
      const PackageVersion = new PackageVersionService(req.conn, pcg);
      for (const ver in body.versions) {
        const version = body.versions[ver];
        if (version.deprecated) {
          await PackageVersion.deprecate(version.version, version.deprecated);
        }
      }
      return req.response({ ok: true });
    }

    const Star = async () => {
      const Package = new PackageService(req.conn);
      const pcg = await Package.getOneByNameSpace(body._id);
      if (!pcg) throw new Error('找不到模块');

      const Star = new PackageStarService(req.conn, pcg);
      const star = await Star.getOne(profile.id);
      if (!star) {
        await Star.add(profile.id);
      }
      return req.response({ ok: true });
    }

    const UnStar = async () => {
      const Package = new PackageService(req.conn);
      const pcg = await Package.getOneByNameSpace(body._id);
      if (!pcg) throw new Error('找不到模块');

      const Star = new PackageStarService(req.conn, pcg);
      const star = await Star.getOne(profile.id);
      if (star) {
        await Star.delById(star.id);
      }
      return req.response({ ok: true });
    }

    switch (command) {
      case 'publish': return req.useCompose([Package.Allow('pkg')], Publish);
      case 'deprecate': return req.useCompose([Package.Allow('pkg')], Deprecate);
      case 'star': return Star();
      case 'unstar': return UnStar();
      default: throw new Error('未知命令');
    }
  }),

  /**
   * @Commander npm view
   * @Commnader npm info
   */
  defineController('GET', [
    NPMError(404),
    Login,
  ], async req => {
    const namespace = '@' + req.getParam('pkg');
    const write = req.getQuery('write');
    const Package = new PackageService(req.conn);
    if (write === 'true') {
      await req.useCompose([Scope.Usable('pkg')]);
    }
    return req.response(await Package.get(namespace));
  })
]