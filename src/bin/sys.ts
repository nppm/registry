import Table from 'cli-table';
import { RegistrySettings } from "../configs";
import { Registry } from "./registry";
import { json } from 'npm-registry-fetch';
import { createPromptModule } from 'inquirer';
import { logger } from '../logger';

interface Field<T extends string | boolean | number> {
  type: 'boolean' | 'string' | 'number',
  description: string,
  display: (v: T) => string,
  get: (r: RegistrySettings) => T,
  set: (res: RegistrySettings, v: T) => unknown
}

interface Fields {
  'registable': Field<boolean>,
  'domain': Field<string>,
  'user.login.expire': Field<number>,
  'user.login.thirdpart.retryAfter': Field<number>,
  'scope.registerable': Field<boolean>,
  'scope.confirmable': Field<boolean>,
}


const fields: Fields = {
  'registable': {
    type: 'boolean',
    description: '全局用户注册',
    display: (v: boolean) => v ? 'yes' : 'no',
    get: (res: RegistrySettings) => res.registable,
    set: (res: RegistrySettings, value: boolean) => res.registable = value,
  },
  'domain': {
    type: 'string',
    description: '域名',
    display: (v: string) => v,
    get: (res: RegistrySettings) => res.domain,
    set: (res: RegistrySettings, value: string) => res.domain = value,
  },
  'user.login.expire': {
    type: 'number',
    description: '用户登录有效期(秒)',
    display: (v: number) => v === 0 ? '+Infinity' : v + 's',
    get: (res: RegistrySettings) => res.user.login.expire,
    set: (res: RegistrySettings, value: number) => res.user.login.expire = value,
  },
  'user.login.thirdpart.retryAfter': {
    type: 'number',
    description: '第三方登录校验间隔时间(秒)',
    display: (v: number) => v + 's',
    get: (res: RegistrySettings) => res.user.login.thirdpart.retryAfter,
    set: (res: RegistrySettings, value: number) => res.user.login.thirdpart.retryAfter = value,
  },
  'scope.registerable': {
    type: 'boolean',
    description: '开放 Scope 注册',
    display: (v: boolean) => v ? 'yes' : 'no',
    get: (res: RegistrySettings) => res.scope.registerable,
    set: (res: RegistrySettings, value: boolean) => res.scope.registerable = value,
  },
  'scope.confirmable': {
    type: 'boolean',
    description: 'Scope 注册审批',
    display: (v: boolean) => v ? 'yes' : 'no',
    get: (res: RegistrySettings) => res.scope.confirmable,
    set: (res: RegistrySettings, value: boolean) => res.scope.confirmable = value,
  }
}

export async function SystemList() {
  const registry = await Registry.npm('configs');

  // @ts-ignore
  const res: RegistrySettings = await json('/~/settings', { ...registry.flatOptions })
  var table = new Table({
    head: [
      'Key',
      'Value',
    ]
  });

  for (const key in fields) {
    const chunk = fields[key as keyof Fields];
    // @ts-ignore
    table.push([key, chunk.display(chunk.get(res))]);
  }

  console.log(table.toString());
}

export async function SystemSetting() {
  const registry = await Registry.npm('configs');

  // @ts-ignore
  const res: RegistrySettings = await json('/~/settings', { ...registry.flatOptions })
  const Prompt = createPromptModule();

  const { key } = await Prompt<{ key: keyof Fields }>({
    type: 'list',
    name: 'key',
    message: '设置的值',
    default: 'mysql',
    choices: Object.keys(fields).map(key => {
      return {
        // @ts-ignore
        name: fields[key].description,
        value: key
      }
    })
  })

  const chunk = fields[key];
  const type = chunk.type;
  let promise: Promise<{ value: boolean | string | number }>;

  switch (type) {
    case 'boolean':
      promise = Prompt<{ value: boolean }>({
        type: 'confirm',
        name: 'value',
        message: chunk.description,
        default: chunk.get(res),
      })
      break;
    case 'string':
      promise = Prompt<{ value: string }>({
        type: 'input',
        name: 'value',
        message: chunk.description,
        default: chunk.get(res),
      })
      break;
    case 'number':
      promise = Prompt<{ value: number }>({
        type: 'input',
        name: 'value',
        message: chunk.description,
        default: chunk.get(res),
        // @ts-ignore
        transformer(val: string) {
          return val ? Number(val) : 0;
        }
      })
  }

  const { value } = await promise;
  // @ts-ignore
  chunk.set(res, value);

  await json('/~/settings', {
    ...registry.flatOptions,
    method: 'POST',
    body: JSON.stringify(res),
    headers: {
      'content-type': 'application/json',
    },
  })

  logger.info('+', `configs.${key} = ${value}`);
}