import { NPMPackageEntity } from '../entities/package';
import { NPMVersionEntity } from '../entities/version';
import { TypeORMService } from '../model/service';
import { TypeORMConnection } from '@evio/visox-typeorm-ioredis-service';
import { PackageManifest } from '../types';

export class PackageVersionService extends TypeORMService {
  private readonly Version = this.getRepository(NPMVersionEntity);

  constructor(
    conn: TypeORMConnection,
    private readonly pkg: NPMPackageEntity,
  ) {
    super(conn);
  }

  public getVersionsByNameSpace() {
    return this.Version.findBy({ namespace: this.pkg.namespace });
  }

  public getOneByVersion(version: string) {
    return this.Version.findOneBy({ namespace: this.pkg.namespace, version });
  }

  public getOneByMd5(md5: string) {
    return this.Version.findOneBy({
      pid: this.pkg.id,
      md5,
    })
  }

  public add(uid: number, manifest: PackageManifest, md5: string) {
    return this.save(this.Version.create().add(
      this.pkg.sid,
      uid,
      this.pkg.id,
      manifest.name,
      manifest.version,
      manifest.description,
      manifest,
      md5
    ))
  }

  public getAllVersions() {
    return this.Version.findBy({ pid: this.pkg.id });
  }

  public save(target: NPMVersionEntity) {
    return this.Version.save(target);
  }

  public del(id: number) {
    return this.Version.delete({ id })
  }

  public remove() {
    return this.Version.delete({
      pid: this.pkg.id
    })
  }

  public async deprecate(version: string, message: string) {
    const one = await this.getOneByVersion(version);
    if (one.deprecate) return;
    return await this.save(one.deprecated(message));
  }
}