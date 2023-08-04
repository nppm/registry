import { NPMPackageEntity } from "../entities/package";
import { NPMScopeEntity } from "../entities/scope";
import { PackageMaintainerService } from "./package.maintainer";
import { PackageVersionService } from './package.version';
import { PackageKeyWordService } from './package.keyword';
import { NPMVersionEntity } from '../entities/version';
import { PackageTagService } from './package.tag';
import { TypeORMService } from '../model/service';
import { PackageManifest } from '../types';
import { configs } from '../configs';

export class PackageService extends TypeORMService {
  private readonly Package = this.getRepository(NPMPackageEntity);
  private readonly Version = this.getRepository(NPMVersionEntity);

  public getOneByNameSpace(namespace: string) {
    return this.Package.findOneBy({ namespace });
  }

  public getOneById(id: number) {
    return this.Package.findOneBy({ id });
  }

  public getVersionsByNameSpace(namespace: string) {
    return this.Version.findBy({ namespace: namespace });
  }

  public save(target: NPMPackageEntity) {
    return this.Package.save(target);
  }

  public async publish(
    uid: number,
    manifest: PackageManifest,
    scope: NPMScopeEntity,
    md5: string,
    tag: string
  ) {
    let EPackage = await this.getOneByNameSpace(manifest.name);
    if (!EPackage) {
      EPackage = await this.save(this.Package.create().add(scope.id, uid, manifest.name));
    }

    // Tag
    let addingKeywords = false;
    const TagService = new PackageTagService(this.conn, EPackage);
    if (tag !== 'latest') {
      const count = await TagService.latestCount();
      if (!count) {
        await TagService.add('latest', manifest.version);
        addingKeywords = true;
      }
    }
    await TagService.add(tag, manifest.version);

    // Version
    const VersionService = new PackageVersionService(this.conn, EPackage);
    const EVersion = await VersionService.add(uid, manifest, md5);

    // Maintainer
    const Maintainer = new PackageMaintainerService(this.conn, EPackage);
    let user = await Maintainer.getOne(uid);
    if (!user) {
      user = await Maintainer.add(uid);
    }

    // keywords
    if (tag === 'latest' || addingKeywords) {
      const KeyWord = new PackageKeyWordService(this.conn, EPackage);
      await KeyWord.del();
      const keywords = manifest.keywords || [];
      for (let i = 0; i < keywords.length; i++) {
        await KeyWord.add(keywords[i])
      }
      await this.save(EPackage.updateRev(md5));
    }

    return EVersion;
  }

  public async get(namespace: string, version?: string) {
    const pcg = await this.getOneByNameSpace(namespace);
    if (!pcg) throw new Error('Not Found');
    const Version = new PackageVersionService(this.conn, pcg);

    if (version) {
      const _version = await Version.getOneByVersion(version);
      if (!_version) {
        throw new Error('version not found: ' + version)
      }
      return _version.manifest;
    }

    const TagService = new PackageTagService(this.conn, pcg);
    const distTags = await TagService.getDistTags();

    if (!distTags['latest']) {
      throw new Error('Not Found');
    }

    const _version = await Version.getOneByVersion(distTags['latest']);
    if (!_version) throw new Error('Not Found');

    const all = await Version.getAllVersions();
    const Maintainer = new PackageMaintainerService(this.conn, pcg);
    const maintainers = await Maintainer.getAll();

    const json = _version.manifest;
    const times: Record<string, string> = {};
    const versions: Record<string, PackageManifest> = {};
    const users: Record<string, true> = {};
    const readmes: { value: string, file: string } = {
      value: null,
      file: null,
    }
    const keys = Object.keys(json);
    const privateKeys = keys.filter(key => key.startsWith('_'));
    privateKeys.forEach(key => {
      if (key !== '_id') {
        delete json[key];
      }
    })

    all.forEach(ver => {
      ver.manifest.dist.tarball = `${configs.settings.domain}/${ver.namespace}/-/${ver.namespace.split('/')[1]}-${ver.version}.tgz`;
      times[ver.version] = new Date(ver.gmtc).toISOString();

      if (ver.version === distTags['latest']) {
        readmes.value = ver.manifest.readme;
        readmes.file = ver.manifest.readmeFilename;
      }
      if (ver.manifest.readme) delete ver.manifest.readme;
      if (ver.manifest.readmeFilename) delete ver.manifest.readmeFilename;
      versions[ver.manifest.version] = ver.manifest;
    })

    times.created = new Date(pcg.gmtc).toISOString();
    times.modified = new Date(pcg.gmtm).toISOString();
    delete json.dist;
    json['dist-tags'] = distTags;
    maintainers.forEach(m => users[m.name] = true);

    json.versions = versions;
    json.time = times;
    json.maintainers = maintainers;
    json.users = users;
    json.readme = readmes.value;
    json.readmeFilename = readmes.file;
    json._rev = all.length + '-' + pcg.rev;
    json._id = json.name;

    return json;
  }

  public async unPublish(pcg: NPMPackageEntity, version: NPMVersionEntity) {
    const PackageTag = new PackageTagService(this.conn, pcg);
    const PackageVersion = new PackageVersionService(this.conn, pcg);
    await PackageVersion.del(version.id);

    const tags = await PackageTag.getByVersion(version.version);
    const tagnames = tags.map(tag => tag.name);

    await Promise.all(tags.map(tag => PackageTag.delOne(tag.id)));

    if (tagnames.includes('latest')) {
      // 处理 keywords
      const PackageKeyword = new PackageKeyWordService(this.conn, pcg);
      await PackageKeyword.del();

      const latest = await PackageTag.getOneByTagRecently('latest');
      if (latest) {
        const _version = await PackageVersion.getOneByVersion(latest.version);
        if (_version) {
          if (_version.manifest?.keywords?.length) {
            for (let i = 0; i < _version.manifest.keywords.length; i++) {
              const keyword = _version.manifest.keywords[i];
              await PackageKeyword.add(keyword);
            }
          }
          await this.save(pcg.updateRev(_version.md5));
        }
      }
    }
  }

  public async rmPackage(pcg: NPMPackageEntity) {
    const PackageTag = new PackageTagService(this.conn, pcg);
    const PackageKeyword = new PackageKeyWordService(this.conn, pcg);
    const PackageMaintainer = new PackageMaintainerService(this.conn, pcg);
    const PackageVersion = new PackageVersionService(this.conn, pcg);
    await Promise.all([
      PackageTag.del(),
      PackageKeyword.del(),
      PackageMaintainer.remove(),
      PackageVersion.remove(),
      this.Package.delete(pcg.id),
    ])
  }
}