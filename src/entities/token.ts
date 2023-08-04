import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";
import { unsigned } from 'buffer-crc32';
import { generate } from 'randomstring';
import { nanoid } from 'nanoid';

@Entity({ name: 'npm_token' })
export class NPMTokenEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Index('uid-idx')
  @Column({
    type: 'integer',
    comment: 'user id'
  })
  public uid: number;

  @Index('code-idx', { unique: true })
  @Column({
    type: 'varchar',
    length: 6,
    comment: '唯一索引'
  })
  public code: string;

  @Index('token-idx', { unique: true })
  @Column({
    type: 'varchar',
    length: 36,
    comment: 'token值'
  })
  public token: string;

  @Column({
    type: 'boolean',
    comment: '是否只读',
    default: false,
  })
  public readonly: boolean;

  @Column({
    type: 'timestamp',
    comment: '过期时间',
    nullable: true,
  })
  public expire: Date;

  @Index('deprecate-idx')
  @Column({
    type: 'bool',
    comment: '是否废弃',
    default: false,
  })
  public deprecate: boolean;

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

  public add(uid: number, readonly: boolean, expire: Date = null) {
    this.uid = uid;
    this.readonly = readonly;
    this.expire = expire;
    this.code = calculateCRC32(Date.now() + generate(16));
    this.token = nanoid(36);
    this.gmtc = this.gmtm = new Date();
    return this;
  }

  public del() {
    this.deprecate = true;
    this.gmtm = new Date();
    return this;
  }
}

function calculateCRC32(input: string | Buffer) {
  const crc32Value = unsigned(input);
  return crc32Value.toString(16).slice(0, 6);
}