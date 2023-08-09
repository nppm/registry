import Table from 'cli-table';
import { logger } from "../logger";
import { Registry } from "./registry";

export function Registries() {
  const registry = new Registry();
  const list = registry.list();
  const current = registry.current;
  const table = new Table({
    head: [
      'Registry',
      'Using',
    ]
  })

  list.forEach(r => table.push([r, r === current ? 'yes' : 'no']));
  console.log(table.toString());
  console.log();
  logger.info('Scope', registry.scopes.map(s => '`' + s + '`').join(','));
  console.log();
}