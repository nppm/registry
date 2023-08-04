#!/usr/bin/env node

import { program } from 'commander';
import { spawn } from 'node:child_process';
import { AddRegistry } from './add-registry';
import { Registries } from './registries';
import { RemoveRegistry } from './remove-registry';
import { UseRegistry } from './use-registry';
import { ScopeRegistry } from './scope-registry';
import { Registry } from './registry';
import Bootstrap from '../index';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { importDynamic } from '@evio/visox-http';

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
  .command('bootstrap [file]')
  .description('启动服务')
  .action(async (file: string) => {
    const cwd = process.cwd();
    const configsFile = resolve(cwd, file || 'index.js');
    if (!existsSync(configsFile)) {
      throw new Error('缺少配置文件');
    }
    return await Bootstrap(await importDynamic(configsFile));
  })

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