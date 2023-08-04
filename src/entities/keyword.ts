import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: 'npm_keyword' })
@Index(['pid', 'keyword'], { unique: true })
export class NPMKeyWordEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Index('pid-idx')
  @Column({
    type: 'integer',
    comment: 'package id'
  })
  public pid: number;

  @Index('keyword-idx')
  @Column({
    type: 'varchar',
    length: 255,
    comment: '名称'
  })
  public keyword: string;

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

  public add(pid: number, keyword: string) {
    this.pid = pid;
    this.keyword = keyword;
    this.gmtc = this.gmtm = new Date();
    return this;
  }
}