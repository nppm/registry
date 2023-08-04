import { defineController } from "@evio/visox-http";
import { NPMError } from "../../../../../middleware/error";
import { Login } from "../../../../../middleware/login";
import { ProfileKeys } from "../../../../../entities/user";
import { UserService } from "../../../../../service/user";

export default [
  /**
   * @Commander npm profile get
   */
  defineController('GET', [
    NPMError(),
    Login,
  ], req => {
    const profile = req.getProfile();
    return req.response({
      tfa: false,
      fullname: profile.fullname,
      name: profile.account,
      email: profile.email,
      homepage: profile.homepage,
      freenode: profile.freenode,
      twitter: profile.twitter,
      github: profile.github,
      created: profile.gmtc,
      updated: profile.gmtm,
      basic: profile.basic ? 'Yes' : 'No',
      forbiden: profile.forbiden ? 'Yes' : 'No',
      administrator: profile.admin ? 'Yes' : 'No',
    })
  }),

  /**
   * @Commander npm profile set
   */
  defineController('POST', [
    NPMError(),
    Login,
  ], async req => {
    const profile = req.getProfile();
    const body = req.getBody<Record<ProfileKeys, string>>();
    const keys = Object.keys(body);
    const User = new UserService(req.conn);
    const user = await User.getOneByAccount(profile.account);
    if (!user) throw new Error('找不到用户');
    keys.forEach(key => user.updateProfile(key as ProfileKeys, body[key as ProfileKeys]))
    await User.save(user);
    return req.response({
      ok: true,
      ...body,
    })
  })
]