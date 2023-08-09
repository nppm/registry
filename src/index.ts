import exitHook from 'async-exit-hook';
import { logger } from "./logger";
import { dispose, useComponent } from "@evio/visox";
import { RegistryConfigs, configs, createDefaultSettings } from "./configs";
import { RedisServer } from "./server/redis";
import { SettingService } from "./service/setting";
import { DataBaseServer } from "./server/database";
import { HTTPServer } from "./server/http";
import { NPMDownloadEntity } from './entities/download';
import { NPMKeyWordEntity } from './entities/keyword';
import { NPMMaintainerEntity } from './entities/maintainer';
import { NPMPackageEntity } from './entities/package';
import { NPMScopeEntity } from './entities/scope';
import { NPMScopeUserEntity } from './entities/scope.user';
import { NPMStarEntity } from './entities/star';
import { NPMTagEntity } from './entities/tag';
import { NPMTokenEntity } from './entities/token';
import { NPMUserEntity } from './entities/user';
import { NPMVersionEntity } from './entities/version';
import { NPMError } from './middleware/error';
import { Admin, CheckLogin, Login } from './middleware/login';
import { Package } from './middleware/package';
import { Scope } from './middleware/scope';
import { Transaction } from './middleware/transaction';
import { HttpRequest } from './model/request';
import { IORedisService, MergedService, TypeORMService } from './model/service';
import { PackageDownloadService } from './service/package.download';
import { PackageKeyWordService } from './service/package.keyword';
import { PackageMaintainerService } from './service/package.maintainer';
import { PackageResolve } from './service/package.resolve';
import { PackageStarService } from './service/package.star';
import { PackageTagService } from './service/package.tag';
import { PackageService } from './service/package';
import { PackageVersionService } from './service/package.version';
import { ScopeService } from './service/scope';
import { ScopeUserService } from './service/scope.user';
import { UserTokenService } from './service/user.token';
import { UserService } from './service/user';

const Server = {
  HTTPServer,
  DataBaseServer,
  RedisServer,
}

const Repository = {
  NPMDownloadEntity,
  NPMKeyWordEntity,
  NPMMaintainerEntity,
  NPMPackageEntity,
  NPMScopeEntity,
  NPMScopeUserEntity,
  NPMStarEntity,
  NPMTagEntity,
  NPMTokenEntity,
  NPMUserEntity,
  NPMVersionEntity,
}

const Middleware = {
  NPMError,
  Login,
  Admin,
  CheckLogin,
  Package,
  Scope,
  Transaction,
}

const Model = {
  HttpRequest,
  MergedService,
  TypeORMService,
  IORedisService,
}

const Service = {
  PackageDownloadService,
  PackageKeyWordService,
  PackageMaintainerService,
  PackageResolve,
  PackageStarService,
  PackageTagService,
  PackageService,
  PackageVersionService,
  ScopeService,
  ScopeUserService,
  SettingService,
  UserTokenService,
  UserService,
}

export {
  Server,
  Repository,
  Middleware,
  Model,
  Service,
  logger,
  configs,
}

function main(_configs: RegistryConfigs) {
  configs.value = _configs;
  return async () => {
    const KEY_SETTING = configs.toPath('settings');
    const redis = await useComponent(RedisServer).then(redis => {
      logger.info('Server', 'Redis running ...');
      return redis;
    });

    if (configs.value.debug) {
      configs.settings = createDefaultSettings();
    } else if (await redis.exists(KEY_SETTING)) {
      const text = await redis.get(KEY_SETTING);
      configs.settings = JSON.parse(text);
    } else {
      configs.settings = createDefaultSettings();
      await new SettingService().save();
    }

    await useComponent(DataBaseServer)
      .then(() => logger.info('Server', `DataBase<${configs.value.database.type}> running ...`));

    await useComponent(HTTPServer)
      .then(({ app }) => {
        logger.info('Server', 'Http running ...');
        if (configs.value.debug) {
          logger.info('Routes', app.prettyPrint());
        }
        logger.http('->', 'http://127.0.0.1:' + configs.value.port);
      })

    logger.warn('Done', 'All servers started!');

    if (configs.value.servers) {
      for (let i = 0; i < configs.value.servers.length; i++) {
        const server = configs.value.servers[i];
        await useComponent(server);
      }
    }
  }
}

export default (configs: RegistryConfigs) => useComponent(main(configs))
  .then(() => exitHook(callback => dispose(callback)))
  .catch(e => dispose(() => {
    console.error(e);
    process.exit(1);
  }));