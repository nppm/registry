import logger from '../lib/logger';
import axios from 'axios';
import { Registry } from './registry';
import { createPromptModule } from 'inquirer';

export async function AddRegistry() {
  const Prompt = createPromptModule();
  const Factory = new Registry();
  const { registry, checked } = await Prompt([
    {
      type: 'input',
      name: 'registry',
      default: 'eg: https://registry.npmmirror.com/',
      message: 'NPPM源地址(Registry)'
    },
    {
      type: 'confirm',
      name: 'checked',
      message: '是否使用这个源？',
      default: true,
    }
  ])
  const obj = Factory.add(registry, checked);
  obj.pathname = '/-/ping';
  await axios.get(obj.toString());
  obj.pathname = '/~/scope';
  const scopes = await axios.get(obj.toString()).catch(err);
  if (scopes.data?.length) {
    await Factory.execScope(registry, ...scopes.data);
  }
  Factory.use(registry, scopes.data).save();
  logger.info('Registry', '添加源成功！');
}

function err(e: any) {
  return {
    data: [] as string[]
  }
}