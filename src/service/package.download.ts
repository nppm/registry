import { NPMVersionEntity } from '../entities/version';
import { NPMDownloadEntity } from '../entities/download';
import { TypeORMService } from '../model/service';
import { TypeORMConnection } from '@evio/visox-typeorm-ioredis-service';

export class PackageDownloadService extends TypeORMService {
  private readonly Download = this.getRepository(NPMDownloadEntity);

  constructor(
    conn: TypeORMConnection,
    private readonly version: NPMVersionEntity,
  ) {
    super(conn);
  }

  public save(target: NPMDownloadEntity) {
    return this.Download.save(target);
  }

  public increase(uid: number) {
    return this.save(this.Download.create().add(this.version.pid, this.version.id, uid));
  }
}