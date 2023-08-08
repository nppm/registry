#!/usr/bin/env node

import { program } from 'commander';
import { spawn } from 'node:child_process';
import { AddRegistry } from './add-registry';
import { Registries } from './registries';
import { RemoveRegistry } from './remove-registry';
import { UseRegistry } from './use-registry';
import { ScopeRegistry } from './scope-registry';
import { Registry } from './registry';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { Setup } from './setup';
import { SystemList, SystemSetting } from './sys';
import { Admin } from './admin';
import { logger } from '../logger';
import { GetScopes, ScopeOwner, ScopePrivate, addScope, confirmScope, removeScope } from './scope';

const { version } = require('../../package.json');

program
  .allowUnknownOption(true)
  .option('-v, --version', 'NPC version')
  .version(version);

program
  .command('registry <cmd>')
  .description(`
  Commander Usage:\n
    - nppm registry ls    # 查看所有registries
    - nppm registry add   # 添加新的registry
    - nppm regsitry rm    # 删除一个源
    - nppm registry use   # 使用一个源
    - nppm registry scope # 更新当前 registry 的 scopes
  `)
  .action((cmd: string) => {
    switch (cmd) {
      case 'ls': return Registries();
      case 'add': return AddRegistry();
      case 'rm': return RemoveRegistry();
      case 'use': return UseRegistry();
      case 'scope': return ScopeRegistry();
    }
  })

program
  .command('boot [file]')
  .description('启动服务')
  .action(async (file: string) => {
    const cwd = process.cwd();
    const configsFile = resolve(cwd, file || 'index.js');
    if (!existsSync(configsFile)) {
      throw new Error('缺少配置文件');
    }
    require(configsFile);
  })

program
  .command('setup')
  .description('安装新的程序')
  .action(Setup);

program
  .command('configs [cmd]')
  .description('设置全局配置')
  .action((cmd: 'ls' | 'set') => {
    switch (cmd) {
      case 'ls': return Wrapper(SystemList)(cmd);
      case 'set': return Wrapper(SystemSetting)(cmd);
    }
  })

program
  .command('admin <cmd> <user>')
  .description(`
  nppm admin add :user
  nppm admin rm :user
  `)
  .action(Wrapper(Admin))

program
  .command('scope <cmd> [scope]')
  .description(`
  nppm scope add :scope         # 添加 scope
  nppm scope ls                 # 查看所有 scopes
  nppm scope rm :scope          # 删除 scope
  nppm scope confirm :scope     # scope 审批通过
  nppm scope unconfirm :scope   # scope 审批不通过
  nppm scope private :scope     # scope 私有
  nppm scope public :scope      # scope 公有
  `)
  .option('-p, --priv', '是否是私有的模块', false)
  .option('-f, --force', '是否强制删除', false)
  .action((cmd: 'add' | 'ls' | 'rm' | 'confirm' | 'unconfirm' | 'private' | 'public', scope: string, ops: { priv?: boolean, force?: boolean }) => {
    switch (cmd) {
      case 'ls': return Wrapper(GetScopes)();
      case 'add': return Wrapper(addScope)(scope, !!ops.priv);
      case 'rm': return Wrapper(removeScope)(scope, !!ops.force);
      case 'confirm': return Wrapper(confirmScope)(scope, true);
      case 'unconfirm': return Wrapper(confirmScope)(scope, false);
      case 'private': return Wrapper(ScopePrivate)(scope, true);
      case 'public': return Wrapper(ScopePrivate)(scope, false);
    }
  })

program
  .command('scope.owner <scope> <user>')
  .description('模块所有者转让')
  .action(Wrapper(ScopeOwner))

program.command('*')
  .allowUnknownOption(true)
  .action(() => {
    const registry = new Registry();
    const argvs: string[] = process.argv.slice(2);
    if (registry.current) {
      argvs.push('--registry=' + registry.current);
      argvs.push('--disturl=https://cdn.npmmirror.com/binaries/node');
    }
    return new Promise((resolve, reject) => {
      const childprocess = spawn('npm', argvs, {
        env: process.env,
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      childprocess.on('exit', code => {
        if (code === 0) return resolve();
        return reject(new Error(`\`npm ${argvs.join(' ')}\` exit with code ${code}`));
      })
    })
  });

program.parseAsync(process.argv);

function Wrapper(callback: (...args: any[]) => Promise<any>) {
  return async (...args: any[]) => {
    try {
      await callback(...args);
    } catch (e) {
      logger.error('Error', e.body?.reason || e.body?.error || e.message);
    }
  }
}