import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";
import { MD5 } from 'crypto-js';
import { generate } from 'randomstring';

export type ProfileKeys = 'fullname' | 'homepage' | 'freenode' | 'twitter' | 'github' | 'email' | 'password' | 'tfa';

@Entity({ name: 'npm_user' })
@Index(['account'], { unique: true })
export class NPMUserEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'varchar',
    length: 50,
    comment: '账号'
  })
  public account: string;

  @Column({
    type: 'varchar',
    length: 250,
    comment: '邮箱'
  })
  public email: string;

  @Column({
    type: 'varchar',
    length: 8,
    comment: '盐'
  })
  public salt: string;

  @Column({
    type: 'varchar',
    length: 32,
    comment: '密码串'
  })
  public token: string;

  @Column({
    type: 'integer',
    comment: 'token id',
    default: 0,
  })
  public tid: number;

  @Column({
    type: 'bool',
    comment: '是否是普通账密登录',
    default: true
  })
  public basic: boolean;

  @Column({
    type: 'bool',
    comment: '是否禁止登录',
    default: false
  })
  public forbiden: boolean;

  @Column({
    type: 'bool',
    comment: '是否管理员',
    default: false
  })
  public admin: boolean;

  @Column({
    type: 'varchar',
    length: 250,
    comment: '全名',
    nullable: true,
  })
  public fullname: string;

  @Column({
    type: 'text',
    comment: '主页',
    nullable: true,
  })
  public homepage: string;

  @Column({
    type: 'text',
    comment: 'freenode',
    nullable: true,
  })
  public freenode: string;

  @Column({
    type: 'text',
    comment: 'twitter',
    nullable: true,
  })
  public twitter: string;

  @Column({
    type: 'text',
    comment: 'github',
    nullable: true,
  })
  public github: string;

  @Column({
    type: 'timestamp',
    comment: '创建时间'
  })
  public gmtc: Date;

  @Column({
    type: 'timestamp',
    comment: '修改时间'
  })
  public gmtm: Date;

  public add(username: string, password: string, email: string, basic: boolean, admin: boolean = false) {
    this.account = username;
    this.basic = basic;
    this.email = email;
    this.gmtc = this.gmtm = new Date();
    this.salt = generate(8).toLowerCase();
    this.forbiden = false;
    this.admin = admin;
    this.token = MD5(this.salt + ':' + password).toString();
    return this;
  }

  public checkPassword(password: string) {
    const token = MD5(this.salt + ':' + password).toString();
    return token === this.token;
  }

  public updatePassword(password: string) {
    this.gmtm = new Date();
    this.salt = generate(8).toLowerCase();
    this.token = MD5(this.salt + ':' + password).toString();
    return this;
  }

  public updateProfile<T extends ProfileKeys>(key: T, value: T extends 'password' ? { old: string, new: string } : string) {
    if (key === 'tfa') {
      throw new Error('不支持 tfa');
    } else if (key === 'password') {
      if (!this.basic) throw new Error('当前登录模式不支持密码登录');
      const val = value as { old: string, new: string }
      if (!this.checkPassword(val.old)) throw new Error('密码不正确');
      this.updatePassword(val.new);
    } else {
      // @ts-ignore
      this[key] = value;
    }
    this.gmtm = new Date();
    return this;
  }

  public updateTid(tid: number) {
    this.tid = tid;
    this.gmtm = new Date();
    return this;
  }
}