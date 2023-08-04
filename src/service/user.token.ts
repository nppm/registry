import { TypeORMConnection } from "@evio/visox-typeorm-ioredis-service";
import { NPMTokenEntity } from "../entities/token";
import { MergedService } from "../model/service";
import { NPMUserEntity } from "../entities/user";
import { configs } from "../configs";

export class UserTokenService extends MergedService {
  private readonly repository = this.getRepository(NPMTokenEntity);

  static createCacheKey(token: string) {
    return configs.toPath('user:token:' + token);
  }

  constructor(
    conn: TypeORMConnection,
    private readonly user: NPMUserEntity
  ) {
    super(conn);
  }

  public save(target: NPMTokenEntity) {
    return this.repository.save(target);
  }

  public add(readonly: boolean, expire?: Date) {
    return this.save(
      this.repository
        .create()
        .add(this.user.id, readonly, expire)
    );
  }

  public async getTokens(page: number, size: number) {
    const sql = this.repository.createQueryBuilder('t')
      .where('uid=:uid', { uid: this.user.id })

    return [
      await sql.clone().getCount(),
      await sql.offset((page - 1) * size).limit(size).getMany()
    ] as const;
  }

  public async getTokensNotDeprecated(page: number, size: number) {
    const sql = this.repository.createQueryBuilder('t')
      .where('uid=:uid', { uid: this.user.id })
      .andWhere('deprecate=:deprecate', { deprecate: false })

    return [
      await sql.clone().getCount(),
      await sql.offset((page - 1) * size).limit(size).getMany()
    ] as const;
  }

  public getOneByCode(key: string) {
    return this.repository.findOneBy({
      uid: this.user.id,
      code: key,
    })
  }

  public getOneByCodeNotDeprecated(key: string) {
    return this.repository.findOneBy({
      uid: this.user.id,
      code: key,
      deprecate: false,
    })
  }

  public getOneByToken(key: string) {
    return this.repository.findOneBy({
      uid: this.user.id,
      token: key,
    })
  }

  public getOneByTokenNotDeprecated(key: string) {
    return this.repository.findOneBy({
      uid: this.user.id,
      token: key,
      deprecate: false,
    })
  }

  public getOneById(id: number) {
    return this.repository.findOneBy({ id })
  }

  public getOneByIdNotDeprecated(id: number) {
    return this.repository.findOneBy({
      id,
      deprecate: false,
    })
  }

  public getUserIdByToken(key: string) {
    return this.repository.findOneBy({
      token: key,
    })
  }

  public getUserIdByTokenNotDeprecated(key: string) {
    return this.repository.findOneBy({
      token: key,
      deprecate: false,
    })
  }

  public updateRedis(token: NPMTokenEntity) {
    const KEY_TOKEN = UserTokenService.createCacheKey(token.token);
    if (token.expire) {
      const time = new Date(token.expire).getTime() - Date.now();
      if (time <= 0) throw new Error('无效的 token 有效期');
      return this.redis.setex(KEY_TOKEN, Math.floor(time / 1000), this.user.account);
    } else {
      return this.redis.set(KEY_TOKEN, this.user.account);
    }
  }

  public async deleteRedis(token: NPMTokenEntity) {
    const KEY_TOKEN = UserTokenService.createCacheKey(token.token);
    if (await this.redis.exists(KEY_TOKEN)) {
      await this.redis.del(KEY_TOKEN);
    }
  }
}