import { logger } from "../logger";
import { resolve } from 'node:path';
import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { ensureDir } from 'fs-extra';
import { createPromptModule } from 'inquirer';
import { Port, Redis, TypeORM, NFS, Admin } from './questions';
import { configs, createDefaultValue } from "../configs";
import { dispose, useComponent } from "@evio/visox";
import { DataBaseServer } from "../server/database";
import { RedisServer } from "../server/redis";
import { UserService } from "../service/user";

export async function Setup() {
  const prompt = createPromptModule();

  configs.value = createDefaultValue();

  logger.info('Booting', '正在启动安装程序...');
  console.log();

  // 数据库
  const TypeORMAnswers = await prompt(TypeORM);
  if (TypeORMAnswers.entityPrefix) {
    if (!TypeORMAnswers.entityPrefix.endsWith('_')) {
      TypeORMAnswers.entityPrefix += '_';
    }
  }
  configs.value.database = TypeORMAnswers;
  const connection = await useComponent(DataBaseServer);
  logger.info('Vaildate', 'DataBase Success!');
  console.log();

  const RedisAnswers = await prompt(Redis);
  if (!RedisAnswers.password) delete RedisAnswers.password;
  if (!RedisAnswers.db) delete RedisAnswers.db;
  configs.value.redis = RedisAnswers;
  await useComponent(RedisServer);
  logger.info('Vaildate', 'Redis Success!');
  console.log();

  const PortAnswer = await prompt(Port);
  configs.value.port = PortAnswer.port;

  const NFSAnswer = await prompt(NFS);
  const directory = resolve(process.cwd(), NFSAnswer.nfs);
  if (!existsSync(directory)) await ensureDir(directory);
  configs.value.nfs = directory;

  console.log();
  logger.warn('Configs', JSON.stringify(configs.value, null, 2));
  console.log();

  const Last = await prompt({
    type: 'confirm',
    name: 'confirm',
    message: '确定以上信息是否正确？',
    default: true,
  })

  if (!Last.confirm) return await dispose();
  const configsPath = resolve(process.cwd(), 'nppm.configs.json');
  writeFileSync(configsPath, JSON.stringify(configs.value, null, 2), 'utf8');

  const indexFile = resolve(__dirname, '../../template/index.js');
  const packageFile = resolve(__dirname, '../../template/package.json');
  const indexContent = readFileSync(indexFile, 'utf8');
  const packageContent = readFileSync(packageFile, 'utf8');

  const targetIndexFile = resolve(process.cwd(), 'index.js');
  const targetPackageFile = resolve(process.cwd(), 'package.json');
  writeFileSync(targetIndexFile, indexContent, 'utf8');
  writeFileSync(targetPackageFile, packageContent, 'utf8');

  // 创建管理员账号
  const User = new UserService(connection);
  const count = await User.getAdminCountByBasic();
  if (!count) {
    const AdminAnswers = await prompt(Admin);
    await User.register(AdminAnswers.name, AdminAnswers.password, AdminAnswers.email, 'basic', true);
    logger.info('Admin', `管理员账号\`${AdminAnswers.name}\`已注册成功！`);
  }

  console.log();
  logger.warn('Waiting', '程序正在安装依赖，请稍候...');
  await new Promise<void>((resolve, reject) => {
    const childprocess = spawn('npm', ['i'], {
      env: process.env,
      cwd: process.cwd(),
      stdio: 'inherit'
    });
    childprocess.on('exit', code => {
      if (code === 0) return resolve();
      return reject(new Error(`npm install error.`));
    })
  })

  logger.info('DONE', '程序安装完毕，您可以通过`nppm boot index.js`命令启动程序');

  await dispose();
}