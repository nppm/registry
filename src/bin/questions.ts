import type { QuestionCollection } from 'inquirer';
import type { RegistryConfigs } from '../configs';
export const TypeORM: QuestionCollection<RegistryConfigs['database']> = [
  {
    type: 'list',
    name: 'type',
    message: '数据库类型',
    default: 'mysql',
    choices: [
      { name: 'MySQL', value: 'mysql' },
      { name: 'MsSQL', value: 'mssql' },
      { name: 'Oracle', value: 'oracle' },
      { name: 'PostGres', value: 'postgres' }
    ]
  },
  {
    type: 'input',
    name: 'host',
    message: '数据库地址',
    default: '127.0.0.1',
  },
  {
    type: 'input',
    name: 'port',
    message: '数据库端口:',
    default: 3306,
    transformer(val: string) {
      return val ? Number(val) : 3306;
    }
  },
  {
    type: 'input',
    name: 'database',
    message: '数据库名称',
    default: 'npm'
  },
  {
    type: 'input',
    name: 'username',
    message: '数据库用户名',
  },
  {
    type: 'input',
    name: 'password',
    message: '数据库密码',
  },
  {
    type: 'input',
    name: 'entityPrefix',
    message: '数据库表前缀',
    default: 'example_'
  },
]

export const Admin: QuestionCollection<{ name: string, password: string, email: string }> = [
  {
    type: 'input',
    name: 'name',
    message: '管理员账号',
    default: 'admin',
  },
  {
    type: 'password',
    name: 'password',
    message: '管理员密码',
  },
  {
    type: 'input',
    name: 'email',
    message: '管理员邮箱',
    default: 'admin@example.com',
  },
]

export const Redis: QuestionCollection<RegistryConfigs['redis']> = [
  {
    type: 'input',
    name: 'host',
    message: 'Redis Host',
    default: '127.0.0.1',
  },
  {
    type: 'input',
    name: 'port',
    message: 'Redis Port',
    default: 6379,
    transformer(val: string) {
      return val ? Number(val) : 6379
    }
  },
  {
    type: 'input',
    name: 'password',
    message: 'Redis Password',
  },
  {
    type: 'input',
    name: 'db',
    message: 'Redis DB channel:',
    default: 0,
    transformer(val: string) {
      return val ? Number(val) : 0;
    }
  }
]

export const Port: QuestionCollection<{ port: number }> = {
  type: 'input',
  name: 'port',
  message: '服务启动端口',
  default: 3000,
}

export const NFS: QuestionCollection<{ nfs: string }> = {
  type: 'input',
  name: 'nfs',
  message: '模块存放路径文件夹（基于当前目录）',
  default: 'tgz',
}
