export interface RegistryConfigs {
  port: number,
  debug?: boolean,
  nfs: string,
  requestBodyJSONLimit: string,
  database: {
    type: 'mssql' | 'mysql' | 'oracle' | 'postgres',
    host: string,
    port: number,
    username: string,
    password: string,
    database: string,
    entityPrefix?: string,
  },
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  },
  authorization?: (body: { create?: true, hostname: string }) => Promise<{ doneUrl: string, loginUrl: string }>
}

export interface RegistrySettings {
  registable: boolean, // 是否允许用户注册
  domain: string, // 网站域名 127.0.0.1 或者 www.qq.com
  user: {
    login: {
      expire: number, // 登录有效期 单位：秒 如果是 0 永不过期
      thirdpart: {
        retryAfter: number, // 第三方登录重试间隔时间：秒
      }
    }
  },
  scope: {
    registerable: boolean, // 是否开放注册，如果开放，那么用户可以直接注册，否则需要管理员注册
    confirmable: boolean, // 开放注册情况下，是否需要管理员审批
  }
}

export const configs = {
  value: null as RegistryConfigs,
  settings: null as RegistrySettings,
  toPath(path: string) {
    const prefix = configs.value.database.entityPrefix || 'npm';
    return prefix + ':' + path;
  }
};

export function createDefaultSettings(): RegistrySettings {
  return {
    registable: true,
    domain: 'http://127.0.0.1:3000',
    user: {
      login: {
        expire: 0,
        thirdpart: {
          retryAfter: 1
        }
      }
    },
    scope: {
      registerable: false,
      confirmable: true,
    }
  }
}

export function createDefaultValue(): RegistryConfigs {
  return {
    port: 3000,
    debug: false,
    nfs: null,
    requestBodyJSONLimit: '10mb',
    database: null,
    redis: null,
  }
}