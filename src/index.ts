import exitHook from 'async-exit-hook';
import { logger } from "./logger";
import { dispose, useComponent } from "@evio/visox";
import { RegistryConfigs, configs, createDefaultSettings } from "./configs";
import { RedisServer } from "./server/redis";
import { SettingService } from "./service/setting";
import { DataBaseServer } from "./server/database";
import { HTTPServer } from "./server/http";

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
  }
}

export default (configs: RegistryConfigs) => useComponent(main(configs))
  .then(() => exitHook(callback => dispose(callback)))
  .catch(e => dispose(() => {
    console.error(e);
    process.exit(1);
  }));