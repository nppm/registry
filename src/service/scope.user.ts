import { TypeORMConnection } from "@evio/visox-typeorm-ioredis-service";
import { TypeORMService } from "../model/service";
import { NPMScopeEntity } from "../entities/scope";
import { NPMScopeUserEntity, SCOPE_ROLE, SCOPE_ROLE_ENUM } from "../entities/scope.user";
import { NPMUserEntity } from "../entities/user";

export class ScopeUserService extends TypeORMService {
  private readonly repository = this.getRepository(NPMScopeUserEntity);
  constructor(
    conn: TypeORMConnection,
    private readonly scope: NPMScopeEntity,
  ) {
    super(conn);
  }

  public add(uid: number, role: number) {
    return this.save(this.repository.create().add(this.scope.id, uid, role));
  }

  public getAll() {
    return this.repository.findBy({ sid: this.scope.id });
  }

  public getAllJoinUser() {
    return this.repository.createQueryBuilder('s')
      .leftJoin(NPMUserEntity, 'u', 'u.id=s.uid')
      .where('s.sid=:sid', { sid: this.scope.id })
      .select('s.id', 'id')
      .addSelect('s.role', 'role')
      .addSelect('u.account', 'account')
      .getRawMany<{ id: number, role: SCOPE_ROLE_ENUM, account: string }>();
  }

  public getOne(uid: number) {
    return this.repository.findOneBy({
      sid: this.scope.id,
      uid,
    })
  }

  public del(uid: number) {
    return this.repository.delete({ uid });
  }

  public save(target: NPMScopeUserEntity) {
    return this.repository.save(target);
  }
}