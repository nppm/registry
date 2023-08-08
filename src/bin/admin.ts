import { Registry } from "./registry";
import { json } from 'npm-registry-fetch';

export async function Admin(cmd: 'add' | 'rm', user: string) {
  const registry = await Registry.npm('configs');

  if (!['add', 'rm'].includes(cmd)) {
    throw new Error('未知操作');
  }

  await json('/~/user/admin', {
    ...registry.flatOptions,
    method: 'POST',
    body: {
      name: user,
      value: cmd === 'add' ? true : false
    }
  })
  console.log(`${cmd === 'add' ? '+' : '-'} Admin <${user}>`);
}