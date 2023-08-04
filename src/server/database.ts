import entities from "../entities";
import { createTypeORMServer } from "@evio/visox-typeorm";
import { configs } from "../configs";

export const DataBaseServer = createTypeORMServer(() => {
  return {
    ...configs.value.database,
    entities,
    synchronize: true,
    logging: !!configs.value.debug,
  }
});