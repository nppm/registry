import axios from 'axios';
import { Registry } from "./registry";
import { URL } from 'node:url';
import { logger } from '../logger';

interface IResponse {
  name: string
}

export async function ScopeRegistry() {
  const registry = new Registry();
  if (!registry.current) {
    throw new Error('Empty current registy!');
  }
  const obj = new URL(registry.current);
  obj.pathname = '/~/scope';
  const scopes = await axios.get<IResponse[]>(obj.toString()).catch(err);
  if (scopes.data?.length) {
    await registry.execScope(registry.current, ...scopes.data.map(scope => scope.name));
  }
  registry.use(registry.current, scopes.data.map(scope => scope.name)).save();
  logger.info('Scope', '更新成功');
}

function err(e: any) {
  return {
    data: [] as IResponse[]
  }
}