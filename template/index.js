const Registry = require('@nppm/registry');
const meta = require('./nppm.configs.json');

Registry.default(Object.assign(meta, {
  // 当定义这个函数的时候
  // NPM 登录系统将进行第三方登录授权
  // async authorization({ create, hostname }) {
  //   return {
  //     loginUrl: null,
  //     doneUrl: null
  //   }
  // }
}))