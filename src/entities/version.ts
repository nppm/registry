import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";
import { PackageManifest } from '../types';

@Entity({ name: 'npm_version' })
@Index(['namespace', 'version'], { unique: true })
export class NPMVersionEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Index('sid-idx')
  @Column({
    type: 'integer',
    comment: 'scopeid'
  })
  public sid: number;

  @Index('uid-idx')
  @Column({
    type: 'integer',
    comment: '发布者'
  })
  public uid: number;

  @Index('pid-idx')
  @Column({
    type: 'integer',
    comment: '包 id'
  })
  public pid: number;

  @Index('namespace-idx')
  @Column({
    type: 'varchar',
    length: 255,
    comment: '名称'
  })
  public namespace: string;

  @Index('version-idx')
  @Column({
    type: 'varchar',
    length: 20,
    comment: '版本'
  })
  public version: string;

  @Column({
    type: 'text',
    comment: '描述'
  })
  public description: string;

  @Column({
    type: 'json',
    comment: '包信息'
  })
  manifest: PackageManifest;

  @Index('deprecate-idx')
  @Column({
    type: 'bool',
    comment: '是否废弃'
  })
  public deprecate: boolean;

  @Index('md5-idx')
  @Column({
    type: 'varchar',
    length: 32,
    comment: 'hash md5'
  })
  public md5: string;

  @Index('size-idx')
  @Column({
    type: 'integer',
    comment: '包大小',
    default: 0,
  })
  public size: number;

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

  public add(
    sid: number,
    uid: number,
    pid: number,
    namespace: string,
    version: string,
    description: string,
    manifest: PackageManifest,
    md5: string,
    size: number,
  ) {
    this.sid = sid;
    this.uid = uid;
    this.pid = pid;
    this.namespace = namespace;
    this.version = version;
    this.description = description;
    this.manifest = manifest;
    this.md5 = md5;
    this.deprecate = false;
    this.size = size;
    this.gmtc = this.gmtm = new Date();
    return this;
  }

  public deprecated(message: string) {
    this.deprecate = true;
    this.manifest.deprecated = message;
    this.gmtm = new Date();
    return this;
  }
}