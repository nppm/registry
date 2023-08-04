import { logger } from '../logger';
import { Registry } from './registry';
import { createPromptModule } from 'inquirer';
export async function RemoveRegistry() {
  const registry = new Registry();
  const current = registry.current;
  const Prompt = createPromptModule();
  const { uri } = await Prompt({
    type: 'list',
    name: 'uri',
    message: '选择您需要删除的源',
    default: current,
    choices: registry.list().map(r => {
      return {
        value: r,
        disabled: r === current,
      }
    })
  })
  registry.remove(uri).save();
  logger.info('Del', uri);
}