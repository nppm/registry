import { configs } from "../configs";
import { NPMTokenEntity } from "../entities/token";
import { NPMUserEntity } from "../entities/user";
import { MergedService } from "../model/service";
import { UserTokenService } from "./user.token";

export class UserService extends MergedService {
  private readonly repository = this.getRepository(NPMUserEntity);

  public createExpire() {
    return configs.settings.user.login.expire > 0
      ? new Date(configs.settings.user.login.expire * 1000 + Date.now())
      : null;
  }

  public getAdminCountByBasic() {
    return this.repository.countBy({
      admin: true,
      basic: true,
    });
  }

  public save(user: NPMUserEntity) {
    return this.repository.save(user);
  }

  public getOneByAccount(account: string) {
    return this.repository.findOneBy({ account });
  }

  public add(username: string, password: string, email: string, basic: boolean, admin?: boolean) {
    return this.save(this.repository.create().add(username, password, email, basic, !!admin));
  }

  public getOneById(id: number) {
    return this.repository.findOneBy({ id });
  }

  public async register(username: string, password: string, email: string, basic?: 'thirdpart' | 'basic', admin?: boolean) {
    if (!configs.settings.registable) throw new Error('无法注册');
    let user = await this.getOneByAccount(username);
    if (user) throw new Error('用户已存在');
    user = await this.add(username, password, email, basic === 'thirdpart' ? false : true, !!admin);
    const Token = new UserTokenService(this.conn, user);
    const token = await Token.add(false, this.createExpire());
    user = await this.save(user.updateTid(token.id));
    await Token.updateRedis(token);
    return {
      user, token,
    }
  }

  public async login(username: string, password: string) {
    let user = await this.getOneByAccount(username);
    if (!user) throw new Error('用户不存在');
    if (!user.basic) throw new Error('当前登录模式不兼容');
    if (!user.checkPassword(password)) throw new Error('密码错误');
    user = await this.save(user.updatePassword(password));
    return await this.signIn(user);
  }

  public async signIn(user: NPMUserEntity) {
    const Token = new UserTokenService(this.conn, user);
    let token: NPMTokenEntity;
    if (!user.tid) {
      token = await Token.add(false, this.createExpire());
      user = await this.save(user.updateTid(token.id));
      await Token.updateRedis(token);
    } else {
      token = await Token.getOneByIdNotDeprecated(user.tid);
      if (!token) {
        token = await Token.add(false, this.createExpire());
        user = await this.save(user.updateTid(token.id));
        await Token.updateRedis(token);
      }
    }
    return {
      user, token,
    }
  }

  public async logout(user: NPMUserEntity, _token?: string) {
    const Token = new UserTokenService(this.conn, user);
    let token = await Token.getOneByIdNotDeprecated(user.tid);
    if (!token) throw new Error('找不到 token');
    if (_token && _token !== token.token) throw new Error('token不匹配');
    user = await this.save(user.updateTid(0));
    token = await Token.save(token.del());
    await Token.deleteRedis(token);
    return {
      user, token,
    }
  }
}