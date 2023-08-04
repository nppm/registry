import { NPMStarEntity } from '../entities/star';
import { NPMPackageEntity } from '../entities/package';
import { TypeORMService } from '../model/service';
import { TypeORMConnection } from '@evio/visox-typeorm-ioredis-service';

export class PackageStarService extends TypeORMService {
  private readonly Star = this.getRepository(NPMStarEntity);

  constructor(
    conn: TypeORMConnection,
    private readonly pkg: NPMPackageEntity,
  ) {
    super(conn);
  }

  public save(target: NPMStarEntity) {
    return this.Star.save(target);
  }

  public add(uid: number) {
    return this.save(this.Star.create().add(this.pkg.id, uid));
  }

  public delById(id: number) {
    return this.Star.delete({ id });
  }

  public getOne(uid: number) {
    return this.Star.findOneBy({
      pid: this.pkg.id,
      uid,
    })
  }
}