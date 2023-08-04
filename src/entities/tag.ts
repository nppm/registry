import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: 'npm_tag' })
export class NPMTagEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Index('pid-idx')
  @Column({
    type: 'integer',
    comment: 'package id'
  })
  public pid: number;

  @Index('name-idx')
  @Column({
    type: 'varchar',
    length: 255,
    comment: '名称'
  })
  public name: string;

  @Index('version-idx')
  @Column({
    type: 'varchar',
    length: 20,
    comment: '版本'
  })
  public version: string;

  @Index('gmtc-idx')
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

  public add(pid: number, name: string, version: string) {
    this.pid = pid;
    this.name = name;
    this.version = version;
    this.gmtc = this.gmtm = new Date();
    return this;
  }
}