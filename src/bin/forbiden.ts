import { Registry } from "./registry";
import { json } from 'npm-registry-fetch';

export async function Forbiden(cmd: 'forbiden' | 'allow', user: string) {
  const registry = await Registry.npm('configs');

  if (!['forbiden', 'allow'].includes(cmd)) {
    throw new Error('未知操作');
  }

  await json('/~/user/forbiden', {
    ...registry.flatOptions,
    method: 'POST',
    body: JSON.stringify({
      name: user,
      value: cmd === 'forbiden' ? true : false
    }),
    headers: {
      'content-type': 'application/json',
    },
  })
  console.log(`${cmd === 'forbiden' ? '- Forbiden' : '+ Allow'} <${user}>`);
}