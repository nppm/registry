import { NPMPackageEntity } from '../entities/package';
import { NPMTagEntity } from '../entities/tag';
import { TypeORMService } from '../model/service';
import { TypeORMConnection } from '@evio/visox-typeorm-ioredis-service';
import { PackageDistTags } from '../types';

export class PackageTagService extends TypeORMService {
  private readonly Tag = this.getRepository(NPMTagEntity);

  constructor(
    conn: TypeORMConnection,
    private readonly pkg: NPMPackageEntity,
  ) {
    super(conn);
  }

  public latestCount() {
    return this.Tag.countBy({ pid: this.pkg.id });
  }

  public add(name: string, version: string) {
    return this.save(this.Tag.create().add(this.pkg.id, name, version));
  }

  public del() {
    return this.Tag.delete({ pid: this.pkg.id });
  }

  public save(target: NPMTagEntity) {
    return this.Tag.save(target);
  }

  public async getDistTags(pid?: number) {
    const tags = await this.Tag.createQueryBuilder('t')
      .innerJoin(qb => qb.from(NPMTagEntity, 'u')
        .select('u.name', 'name')
        .addSelect('MAX(u.gmtc)', 'time')
        .where('u.pid=:pid', { pid: pid || this.pkg.id })
        .groupBy('name'), 's', 's.time=t.gmtc AND s.name=t.name'
      )
      .select('t.name', 'name')
      .addSelect('t.version', 'version')
      .getRawMany<{ name: string, version: string }>();

    const object: PackageDistTags = {};
    tags.forEach(({ name, version }) => object[name] = version);
    return object;
  }

  public getByVersion(version: string) {
    return this.Tag.findBy({
      pid: this.pkg.id,
      version,
    })
  }

  public delOne(id: number) {
    return this.Tag.delete({ id });
  }

  public getOneByTagRecently(tag: string) {
    return this.Tag.findOne({
      where: {
        pid: this.pkg.id,
        name: tag,
      },
      order: {
        gmtc: 'DESC'
      }
    })
  }

  public delByTag(name: string) {
    return this.Tag.delete({
      pid: this.pkg.id,
      name,
    })
  }

  public delByTagAndVersion(name: string, version: string) {
    return this.Tag.delete({
      pid: this.pkg.id,
      name,
      version,
    })
  }
}