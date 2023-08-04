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

## Configs

```ts
import Bootstrap from '@nppm/registry';
import { resolve } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import axios from 'axios';

const nfs = resolve(process.cwd(), 'tgz');
if (!existsSync(nfs)) mkdirSync(nfs);

Bootstrap({
  port: 3000, // http端口
  debug: true, // 如果设置为 true 表示开发模式
  nfs,
  requestBodyJSONLimit: '10mb', // 请求体大小
  database: {
    "type": "mysql",
    "host": "127.0.0.1",
    "port": 3306,
    "username": "root",
    "password": "xxxx",
    "database": "npm",
    "entityPrefix": "npm_test_"
  },
  redis: {
    host: '127.0.0.1',
    port: 6379,
    // password: 'xxx',
    // db: 2
  },
  // 此函数必须返回两个参数 { loginUrl, doneUrl }
  // 如果不使用此函数，系统默认使用账号密码登录注册
  // async authable(body) {
  //   const res = await axios.post('http://127.0.0.1:3000/test/a', body);
  //   return {
  //     loginUrl: res.data.loginUrl,
  //     doneUrl: res.data.doneUrl,
  //   }
  // }
});
```