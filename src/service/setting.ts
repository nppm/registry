import { IORedisService } from "../model/service";
import { RegistrySettings, configs } from "../configs";

export class SettingService extends IORedisService {
  public async save(data?: RegistrySettings) {
    if (data) {
      configs.settings = data;
    }
    const KEY_SETTING = configs.toPath('settings');
    await this.redis.set(KEY_SETTING, JSON.stringify(configs.settings));
  }
}