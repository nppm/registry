import { NPMPackageEntity } from '../entities/package';
import { NPMMaintainerEntity } from '../entities/maintainer';
import { NPMUserEntity } from '../entities/user';
import { TypeORMService } from '../model/service';
import { TypeORMConnection } from '@evio/visox-typeorm-ioredis-service';

export class PackageMaintainerService extends TypeORMService {
  private readonly Maintainer = this.getRepository(NPMMaintainerEntity);

  constructor(
    conn: TypeORMConnection,
    private readonly pkg: NPMPackageEntity,
  ) {
    super(conn);
  }

  public add(uid: number) {
    return this.save(this.Maintainer.create().add(this.pkg.namespace, uid));
  }

  public del(id: number) {
    return this.Maintainer.delete({ id });
  }

  public remove() {
    return this.Maintainer.delete({
      namespace: this.pkg.namespace,
    })
  }

  public getOne(uid: number, namespace?: string) {
    return this.Maintainer.findOneBy({
      namespace: namespace || this.pkg.namespace,
      uid
    });
  }

  public getOneByUid(uid: number) {
    return this.Maintainer.findOneBy({
      namespace: this.pkg.namespace,
      uid
    })
  }

  public async getAll() {
    return this.Maintainer.createQueryBuilder('m')
      .leftJoin(NPMUserEntity, 'u', 'u.id=m.uid')
      .select('u.account', 'name')
      .addSelect('u.email', 'email')
      .where('m.namespace=:namespace', { namespace: this.pkg.namespace })
      .getRawMany<{ name: string, email: string }>();
  }

  public save(target: NPMMaintainerEntity) {
    return this.Maintainer.save(target);
  }
}