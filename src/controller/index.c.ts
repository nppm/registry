import { defineController } from "@evio/visox-http";
import { configs } from "../configs";
import { NPMDownloadEntity } from "../entities/download";
import { NPMUserEntity } from "../entities/user";
import { ScopeService } from "../service/scope";
import { NPMPackageEntity } from "../entities/package";
import { NPMVersionEntity } from "../entities/version";
import { NPMStarEntity } from "../entities/star";

export default defineController('GET', [], async req => {
  const database = req.conn;
  const downloads = await database.manager.getRepository(NPMDownloadEntity).count();
  const users = await database.manager.getRepository(NPMUserEntity).count();
  const Scope = new ScopeService(database);
  const scopes = (await Scope.getAllByNotDeleted()).map(scope => scope.name);
  const packages = await database.manager.getRepository(NPMPackageEntity).count();
  const versions_using = await database.manager.getRepository(NPMVersionEntity).countBy({ deprecate: false });
  const versions_deprecated = await database.manager.getRepository(NPMVersionEntity).countBy({ deprecate: true });
  const stars = await database.manager.getRepository(NPMStarEntity).count();
  return req.response({
    db_name: 'registry',
    engine: configs.value.database.type,
    downloads, users, scopes, packages, stars,
    version: {
      total: versions_using + versions_deprecated,
      actives: versions_using,
      deprecates: versions_deprecated,
    }
  });
})