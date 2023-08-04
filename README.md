# NPPM

JavaScript Private Package Manager, Registry &amp; Website

## Support

- `npm ping`
- `npm adduser`
- `npm login`
- `npm whoami`
- `npm logout`
- `npm publish`
- `npm unpublish`
- `npm deprecate`
- `npm install`
- `npm dist-tag`
- `npm owner`
- `npm search`
- `npm star`
- `npm unstar`
- `npm profile`
- `npm token`
- `npm org`
- `npm access`    # 待开发

## Setup & Bootstrap & Usage

你可以通过以下命令来安装整套服务程序

```bash
$ cd <directory> # 进入一个空的文件夹用于程序的目录
$ npm i -g @nppm/registry # 安装命令行工具
$ nppm -v # 查看当前版本号 确保安装成功
$ nppm setup # 根据提示进行即可

# 当安装完毕
$ nppm boot index.js # 启动服务
$ pm2 start nppm --name=nppm -- boot index.js # 当然你也可以通过 PM2 的进城守护启动

# 当启动完毕后
# 你可以进行登录操作
$ npm login --registry=http://127.0.0.1:3000 # 输入管理员账号和密码即可 registry是你服务启动的端口域名地址
$ npm profile get --registry=http://127.0.0.1:3000 # 查看你的个人信息

# NPPM同时也接管了 registry 地址的设定
$ nppm registry add   # 新增一个 registry 地址
$ nppm registry ls    # 查看所有registries
$ nppm regsitry rm    # 删除一个源
$ nppm registry use   # 使用一个源

# 我们采用`Scoped Install`的模块安装方式
# 所以以下命令使用过后
# 你可以通过`npm install`命令进行安装模块
# 当命中了 NPPM 站点设定的 scope 的时候
# 系统自动会去 NPPM 站点拉包
# 否则其他包则通过 NPM 官方站点拉包
$ nppm registry scope # 更新当前 registry 的 scopes 

# 当你需要所有包都通过 NPPM 安装的时候
# 请选择以下方式
# NPPM 对 NPM 进行了代理
# 条件是你定义了 NPPM 当前全局的 `registry` 地址
$ nppm install [<package-spec> ...]
```

> 注意： 安装完毕后，请优先前往后台系统，在设置栏中修改正确的本站的域名，这个关系到后续上传包的域名地址是否正确，否则拉包过程可能报错。

## Thirdpart Login Mode

在你的 `index.js` 文件中，你能看到这样的代码

```js
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
```

当此文件扩展了 `authorization` 函数的时候，系统自动进行第三方登录认证。具体如何实现可以自由发挥，适用企业级内部账号登录。

```ts
type authorization = (data: { create?: boolean, hostname: string }) => Promise<{
  loginUrl: string,
  doneUrl: string
}>
```