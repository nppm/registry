import { defineController } from "@evio/visox-http";
import { NPMError } from "../../middleware/error";
import { Admin, Login } from "../../middleware/login";
import { RegistrySettings, configs } from "../../configs";
import { SettingService } from "../../service/setting";

export default [
  defineController('GET', [
    NPMError(),
    Login,
  ], req => req.response(configs.settings)),

  defineController('POST', [
    NPMError(),
    Login,
    Admin,
  ], async req => {
    const data = req.getBody<RegistrySettings>();
    const Settings = new SettingService();
    await Settings.save(data);
    return req.response({
      ok: true,
    })
  })
]