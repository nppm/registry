import { defineController } from "@evio/visox-http";
import { NPMError } from "../../../middleware/error";
import { configs } from "../../../configs";

export default defineController('POST', [
  NPMError(404)
], async req => {
  if (!configs.value.authorization) throw new Error('系统使用默认登录方式');
  const body = req.getBody<{ create?: true, hostname: string }>();
  const { loginUrl, doneUrl } = await configs.value.authorization(body);
  const base64 = Buffer.from(doneUrl).toString('base64');

  return req.response({
    loginUrl,
    doneUrl: configs.settings.domain + '/~/user/org.web.login/' + base64,
  })
})