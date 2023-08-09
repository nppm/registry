import entities from "../entities";
import { createTypeORMServer } from "@evio/visox-typeorm";
import { configs } from "../configs";

export const DataBaseServer = createTypeORMServer(() => {
  const _entities = entities.slice(0);
  if (configs.value.entities) {
    _entities.push(...configs.value.entities);
  }
  return {
    ...configs.value.database,
    entities: _entities,
    synchronize: true,
    logging: !!configs.value.debug,
  }
});