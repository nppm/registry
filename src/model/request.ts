import compose from 'koa-compose';
import { Request } from '@evio/visox-http';
import { TypeORMConnection } from '@evio/visox-typeorm-ioredis-service';
import { Context, Middleware, Next } from 'koa';
import { NPMUserEntity } from '../entities/user';
import { NPMScopeEntity } from '../entities/scope';
import { SCOPE_ROLE_ENUM } from '../entities/scope.user';
import { NPMPackageEntity } from '../entities/package';

export class HttpRequest<P extends string = any> extends Request<P> {
  public readonly UserAgent: string;
  public readonly NpmAuthType: string;
  public readonly NpmCommand: string;
  public readonly NpmVersion: string;
  public readonly NodeVersion: string;
  public readonly Authorization: string;
  public readonly AuthType: string;
  public readonly AuthCode: string;
  public readonly conn: TypeORMConnection;
  public readonly roll: (roll: () => unknown) => number;
  constructor(ctx: Context) {
    super(ctx);
    this.UserAgent = ctx.headers['user-agent'];
    this.NpmAuthType = ctx.headers['npm-auth-type'] as string;
    this.NpmCommand = ctx.headers['npm-command'] as string;
    this.Authorization = ctx.headers['authorization'];
    if (this.UserAgent) {
      const exec = /npm\/(\d+\.\d+\.\d+)\snode\/v(\d+\.\d+\.\d+)/.exec(this.UserAgent);
      if (exec) {
        this.NpmVersion = exec[1];
        this.NodeVersion = exec[2];
      }
    }
    if (this.Authorization) {
      this.AuthType = this.Authorization.split(' ')[0];
      this.AuthCode = this.Authorization.split(' ')[1];
    }
    this.conn = ctx.state.conn;
    this.roll = ctx.state.roll;
  }

  public getState<T>(key: string) {
    return this.ctx.state[key] as T;
  }

  public getScope() {
    return this.getState<NPMScopeEntity>('scope');
  }

  public getMyScopeRole() {
    return this.getState<SCOPE_ROLE_ENUM>('scope_role')
  }

  public checkScopeIsMineOwner() {
    return this.getState<boolean>('scope_beyond');
  }

  public getBody<T = any>() {
    return this.ctx.request.body as T;
  }

  public getProfile(): NPMUserEntity {
    return this.ctx.state.profile;
  }

  public getPackage() {
    return this.ctx.state.package as NPMPackageEntity;
  }

  public async useCompose<T = any>(middlewares: Middleware[], callback?: (ctx?: Context) => Promise<T>) {
    let result: T;
    const _middlewares = callback ? middlewares.concat([async (ctx: Context, next: Next) => {
      result = await callback(ctx);
      await next();
    }]) : middlewares;
    const composed = compose(_middlewares);
    await composed(this.ctx);
    return result;
  }
}