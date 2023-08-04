import { logger } from "../logger";
import { Registry } from "./registry";

export function Registries() {
  const registry = new Registry();
  const list = registry.list();
  const current = registry.current;
  console.table(list.map(r => {
    return {
      registry: r,
      using: r === current
    }
  }))
  logger.info('Scope', registry.scopes.map(s => '`' + s + '`').join(','));
}