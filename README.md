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

> 注意： 安装完毕后，请优先使用`nppm configs set`命令选择`域名`更新域名，这个关系到后续上传包的域名地址是否正确，否则拉包过程可能报错。

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

## NPPM Support

```bash
# 查看全局配置
$ nppm configs ls

# 更新局部配置
$ nppm configs set

# 设置管理员
$ nppm admin add <user>

# 删除管理员
$ nppm admin rm <user>

# 查看所有 scope 目录
$ nppm scope ls

# 添加一个 scope: -p 私有
$ nppm scope add <scope> [-p]

# 删除一个 scope: -f 强制
$ nppm scope rm <scope> <-f>

# 让一个 scope 审批通过，注意操作者必须为管理员
$ nppm scope confirm <scope>

# 让一个 scope 审批不通过，注意操作者必须为管理员
$ nppm scope unconfirm <scope>

# 让一个 scope 变为私有化
$ nppm scope private <scope>

# 让一个 scope 变为公有化
$ nppm scope public <scope>

# 转让某个 scope 的所有者身份给另一个人
$ nppm scope.owner <scope> <user>
```

## Development

程序允许二次开发，首先二次开发需要注意的是

1. 你的`package.json`中的依赖项目必须包含`"@nppm/registry": "latest"`
2. 需要一个入口文件，文件内容如下:

```ts
import createRegistry from '@nppm/registry';
const meta = require('./nppm.configs.json');

createRegistry(Object.assign(meta, {
  // 以下只写定义：

  // 当定义这个函数的时候，NPM 登录系统将进行第三方登录授权
  authorization?: (body: { create?: true, hostname: string }) => Promise<{ doneUrl: string, loginUrl: string }>
  // 自定义 controller 文件夹列表
  controllers?: string | string[],
  // 自定义 SQL entity 列表
  entities?: any[],
  // 自定义启动服务列表
  servers?: Component<any>[],
}))
```

### authorization

一种第三方登录方式，如果定义，表示系统适用第三方登录方式。

在 NPM 的命令航中，默认不开启这个功能，但是我们可以在我们的 NPPM 中适用这种方式。

它可以是一个页面扫码也可以是一个登录页面注册登录。这个方式需要你自己定义。

我们可以提供一些参考代码：

**1. 配置**

*index.js中*
```ts
async authorization(body) {
  const res = await axios.post('http://127.0.0.1:3000/test/a', body);
  return {
    loginUrl: res.data.loginUrl,
    doneUrl: res.data.doneUrl,
  }
}
```

**2. 入口接口**

*/test/a.c.ts*

```ts
import { MD5 } from 'crypto-js';
import { useComponent } from '@evio/visox';
import { defineController } from '@evio/visox-http';
import { RedisServer } from '../../server/redis';
import { configs } from '../../configs';

export default defineController('POST', [], async req => {
  const body = req.getBody<{ create?: true, hostname: string }>();
  const code = MD5(body.create + ':' + body.hostname + ':' + Date.now()).toString();
  const redis = await useComponent(RedisServer);
  await redis.setex(configs.toPath('test:' + code), 5 * 60, JSON.stringify({
    token: code,
    status: 0
  }))
  return req.response({
    loginUrl: 'http://127.0.0.1:' + configs.value.port + '/test/b?token=' + code,
    doneUrl: 'http://127.0.0.1:' + configs.value.port + '/test/d?token=' + code,
  })
})
```

**3. 登录页面**

*/test/b.c.ts*

```ts
import { defineController } from "@evio/visox-http";

export default defineController('GET', [], async req => {
  const token = req.getQuery('token');
  return req.response(`
    <html>
      <head>
        <title>测试</title>
      </head>
      <body>
        <input id="a" placeholder="name..." />
        <br />
        <button id="b">提交</button>
        <script>
          window.onload = function() {
            document.getElementById('b').addEventListener('click', function() {
              var val = document.getElementById('a').value;
              window.location.href = 'http://127.0.0.1:3000/test/c?token=${token}&name=' + val;
            })
          }
        </script>
      </body>
    </html>
  `);
})
```

**4. 操作页面**

*/test/c.c.ts*

```ts
import { useComponent } from '@evio/visox';
import { defineController } from '@evio/visox-http';
import { RedisServer } from '../../server/redis';
import { configs } from '../../configs';

export default defineController('GET', [], async req => {
  const token = req.getQuery('token');
  const name = req.getQuery('name');
  const key = configs.toPath('test:' + token);
  const redis = await useComponent(RedisServer);

  if (!(await redis.exists(key))) {
    return req.response('找不到 key');
  }

  const state = JSON.parse(await redis.get(key)) as {
    token: string,
    status: number,
  }

  // 成功
  await redis.setex(key, 60, JSON.stringify({
    status: 1,
    token: state.token,
    user: {
      account: name,
      email: name + '@qq.com'
    }
  }))

  return req.response('ok');

  // 失败
  // await redis.setex(key, 60, JSON.stringify({
  //   status: -1,
  //   token: state.token,
  //   message: '一些错误'
  // }))
  // ctx.body = '失败'
})
```

**5. 轮询页面**

*/test/d.c.ts*

```ts
import { useComponent } from '@evio/visox';
import { defineController } from '@evio/visox-http';
import { configs } from '../../configs';
import { RedisServer } from "../../server/redis";

export default defineController('GET', [], async req => {
  const token = req.getQuery('token');
  const redis = await useComponent(RedisServer);
  const key = configs.toPath('test:' + token);

  if (!(await redis.exists(key))) {
    return req.response({
      status: 'unknow',
    });
  }

  const state = JSON.parse(await redis.get(key)) as {
    status: 0 | 1 | -1,
    token: string,
    user?: {
      account: string,
      email: string,
    },
    message?: string
  };

  if (state.status === 0) {
    return req.response({
      status: 'pending',
    });
  }

  if (state.status === 1) {
    await redis.del(key);
    return req.response({
      status: 'success',
      user: Object.assign(state.user, { token }),
    });
  }

  if (state.status === -1) {
    await redis.del(key);
    return req.response({
      status: 'error',
      message: state.message,
    });
  }

  await redis.del(key);
  return req.response({
    status: 'unknow',
  });
})
```