import { NPMScopeEntity } from "../entities/scope";
import { SCOPE_ROLE } from "../entities/scope.user";
import { TypeORMService } from "../model/service";
import { ScopeUserService } from "./scope.user";

export class ScopeService extends TypeORMService {
  private readonly repository = this.getRepository(NPMScopeEntity);

  public async add(name: string, priv: boolean, uid: number, confirmed: boolean) {
    const scope = await this.save(this.repository.create().add(name, priv, uid, confirmed));
    const ScopeUser = new ScopeUserService(this.conn, scope);
    await ScopeUser.add(uid, SCOPE_ROLE.owner);
    return scope;
  }

  public getOneByNameNotDeleted(name: string) {
    return this.repository.findOneBy({
      name,
      deleted: false,
    });
  }

  public getOneByName(name: string) {
    return this.repository.findOneBy({ name });
  }

  public getOneByIdNotDeleted(id: number) {
    return this.repository.findOneBy({
      id,
      deleted: false,
    });
  }

  public getOneById(id: number) {
    return this.repository.findOneBy({ id });
  }

  public getAll() {
    return this.repository.find();
  }

  public getAllByNotDeleted() {
    return this.repository.findBy({ deleted: false });
  }

  public save(scope: NPMScopeEntity) {
    return this.repository.save(scope);
  }
}