import axios from 'axios';
import { URL } from 'node:url';
import { Registry } from './registry';
import { createPromptModule } from 'inquirer';
import { logger } from '../logger';

export async function UseRegistry() {
  const registry = new Registry();
  const current = registry.current;
  const Prompt = createPromptModule();
  const { uri } = await Prompt({
    type: 'list',
    name: 'uri',
    message: '选择您使用的源',
    default: current,
    choices: registry.list().map(r => {
      return {
        value: r,
        disabled: r === current,
      }
    })
  })
  const obj = new URL(uri);
  obj.pathname = '/~/scope';
  const scopes = await axios.get(obj.toString()).catch(err);
  if (scopes.data?.length) {
    await registry.execScope(uri, ...scopes.data);
  }
  registry.use(uri, scopes.data).save();
  logger.info('#', uri);
}

function err(e: any) {
  return {
    data: [] as string[]
  }
}