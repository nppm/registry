import Table from 'cli-table';
import { Registry } from "./registry";
import { json } from 'npm-registry-fetch';

export async function GetScopes() {
  const registry = await Registry.npm('scope');

  // @ts-ignore
  const res: { name: string, privatable: boolean, confirmed: boolean, deleted: boolean }[] = await json('/~/scope', {
    ...registry.flatOptions
  });
  const table = new Table({
    head: [
      'Scope',
      'deleted',
      'private',
      'confirm',
    ]
  })

  for (let i = 0; i < res.length; i++) {
    const chunk = res[i];
    table.push([
      chunk.name,
      chunk.deleted ? 'yes' : 'no',
      chunk.privatable ? 'yes' : 'no',
      chunk.confirmed ? 'yes' : 'no',
    ])
  }

  console.log(table.toString());
}

export async function addScope(scope: string, priv: boolean) {
  if (!scope.startsWith('@')) throw new Error('Scope必须以`@`开头');
  const registry = await Registry.npm('scope');
  await json('/~/scope', {
    ...registry.flatOptions,
    method: 'POST',
    body: JSON.stringify({
      "name": scope,
      "priv": priv
    }),
    headers: {
      'content-type': 'application/json',
    },
  });
  console.log(`+ Scope <${scope}>: ${priv ? 'private' : 'public'}`);
}

export async function removeScope(scope: string, force: boolean) {
  if (!scope.startsWith('@')) throw new Error('Scope必须以`@`开头');
  if (!force) throw new Error('危险操作，如需要删除，请适用`--force`或者`-f`');

  const registry = await Registry.npm('scope');
  await json('/~/scope/' + scope, {
    ...registry.flatOptions,
    method: 'DELETE',
  });

  console.log(`- Scope <${scope}>`);
}

export async function confirmScope(scope: string, value: boolean) {
  if (!scope.startsWith('@')) throw new Error('Scope必须以`@`开头');
  const registry = await Registry.npm('scope');
  await json('/~/scope/' + scope + '/confirm', {
    ...registry.flatOptions,
    method: 'POST',
    body: JSON.stringify({
      value,
    }),
    headers: {
      'content-type': 'application/json',
    },
  });
  console.log(`- Scope <${scope}>: ${value ? 'confirmed' : 'unconfirmed'}`);
}

export async function ScopePrivate(scope: string, value: boolean) {
  if (!scope.startsWith('@')) throw new Error('Scope必须以`@`开头');
  const registry = await Registry.npm('scope');
  await json('/~/scope/' + scope + '/private', {
    ...registry.flatOptions,
    method: 'POST',
    body: JSON.stringify({
      value,
    }),
    headers: {
      'content-type': 'application/json',
    },
  });
  console.log(`- Scope <${scope}>: ${value ? 'private' : 'public'}`);
}

export async function ScopeOwner(scope: string, user: string) {
  if (!scope.startsWith('@')) throw new Error('Scope必须以`@`开头');
  const registry = await Registry.npm('scope');
  await json('/~/scope/' + scope + '/owner', {
    ...registry.flatOptions,
    method: 'POST',
    body: JSON.stringify({
      value: user,
    }),
    headers: {
      'content-type': 'application/json',
    },
  });
  console.log(`+ Scope <${scope}>: ${user} owned`);
}