import * as ssri from 'ssri';
import { resolve } from 'node:path';
import { gte, valid } from "semver";
import { ensureDir, writeFile } from 'fs-extra';
import { PackageInComingProps, PackageManifest, PackageVersionsCompareProps } from "../types";
import { NPMVersionEntity } from '../entities/version';
import { configs } from '../configs';

export class PackageResolve {
  constructor(
    private readonly data: PackageInComingProps,
  ) { }

  private checkHashAllowed(tarballBytes: Buffer, dist: PackageManifest['dist']) {
    const integrity = dist?.integrity;
    if (integrity) {
      const algorithm = ssri.checkData(tarballBytes, integrity);
      if (!algorithm) return false;
    } else {
      const integrityObj = ssri.fromData(tarballBytes, { algorithms: ['sha1'] });
      // @ts-ignore
      const shasum: string = integrityObj.sha1[0].hexDigest();
      if (dist?.shasum && dist.shasum !== shasum) return false;
    }
    return true;
  }

  public async vaildateAttachment(versions: NPMVersionEntity[]) {
    const body = this.data;
    const distTagKeys = Object.keys(body['dist-tags'] || {});
    const versionKeys = Object.keys(body.versions || {});
    const attachmentKeys = Object.keys(body._attachments || {});
    const PACKAGE_ATTACH_DATA_RE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

    if (!distTagKeys.length) throw new Error('确实dist-tags标记');
    if (!versionKeys.length) throw new Error('确实版本元信息');
    if (!attachmentKeys.length) throw new Error('确实文件内容');
    if (valid(versionKeys[0]) === null) throw new Error('无效的版本号');
    if (body['dist-tags'][distTagKeys[0]] !== versionKeys[0]) throw new Error('版本匹配失败');

    const attachment = body._attachments[attachmentKeys[0]];
    if (!attachment.data || typeof attachment.data !== 'string' || !PACKAGE_ATTACH_DATA_RE.test(attachment.data)) {
      throw new Error('附件内容非法');
    }

    const tarballBuffer = Buffer.from(attachment.data, 'base64');
    if (tarballBuffer.length !== attachment.length) {
      throw new Error(`附件内容长度不一致`);
    }

    const version = body.versions[versionKeys[0]];
    if (!this.checkHashAllowed(tarballBuffer, version.dist)) {
      throw new Error('文件合法性校验失败');
    }

    if (versions.length) {
      const [allowed, ver] = this.checkVersions(version.version, versions.map(ver => ver.version).sort());
      if (!allowed) {
        throw new Error(`版本号不合法，请选择大于\`${ver}\`的版本号`);
      }
    }

    const md5Hex = await import('md5-hex');

    return {
      tarball: tarballBuffer,
      version,
      tag: distTagKeys[0],
      md5: md5Hex.default(tarballBuffer),
    }
  }

  private checkVersions(version: string, versions: string[]): [boolean, string?] {
    const root: PackageVersionsCompareProps = { major: new Map(), max: 0 }
    versions.forEach(ver => {
      const { major, minor, patch, prerelease } = this.format(ver);
      if (!root.major.has(major)) {
        root.major.set(major, {
          minor: new Map(),
          max: 0
        })
      }
      if (major > root.max) root.max = major;
      const majors = root.major.get(major);
      if (!majors.minor.has(minor)) {
        majors.minor.set(minor, {
          patch: new Map(),
          max: 0
        })
      }
      if (minor > majors.max) majors.max = minor;
      const minors = majors.minor.get(minor);
      if (!minors.patch.has(patch)) {
        minors.patch.set(patch, new Set());
      }
      if (patch > minors.max) minors.max = patch;
      const patchs = minors.patch.get(patch);
      if (!patchs.has(prerelease)) {
        patchs.add(prerelease);
      }
    })
    const { major, minor, patch } = this.format(version);
    if (root.major.has(major)) {
      const majors = root.major.get(major);
      if (majors.minor.has(minor)) {
        const minors = majors.minor.get(minor);
        if (minors.patch.has(patch)) {
          const patchs = minors.patch.get(patch);
          for (const v of patchs) {
            const p = `${major}.${minor}.${patch}${v}`;
            const s = gte(p, version);
            if (s) return [false, p];
          }
          return [true];
        } else {
          return [minors.max < patch, minors.max >= patch ? `${major}.${minor}.${minors.max}` : undefined];
        }
      } else {
        return [majors.max < minor, majors.max >= minor ? `${major}.${majors.max}.*` : undefined];
      }
    } else {
      return [root.max < major, root.max >= major ? `${root.max}.*.*` : undefined];
    }
  }

  private format(version: string) {
    const a = version.indexOf('.');
    const major = Number(version.substring(0, a));
    const b = version.substring(a + 1);
    const c = b.indexOf('.');
    const minor = Number(b.substring(0, c));
    const d = b.substring(c + 1);
    const reg = /^(\d+)(.*?)$/.exec(d);
    const patch = Number(reg[1]);
    const prerelease = reg[2];
    return { major, minor, patch, prerelease }
  }

  public async saveTarBall(namespace: string, version: string, tarball: Buffer) {
    const directory = resolve(configs.value.nfs, namespace);
    const file = resolve(directory, version + '.tgz');
    await ensureDir(directory);
    await writeFile(file, tarball);
    return file;
  }
}