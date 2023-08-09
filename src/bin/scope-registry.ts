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
  const names = scopes.data.map(scope => scope.name);
  if (scopes.data?.length) {
    await registry.execScope(registry.current, ...names);
  }
  registry.use(registry.current, names).save();
  logger.info('+', names.join(', '));
}

function err(e: any) {
  return {
    data: [] as IResponse[]
  }
}