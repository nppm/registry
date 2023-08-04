import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: 'npm_download' })
export class NPMDownloadEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Index('pid-idx')
  @Column({
    type: 'integer',
    comment: 'package id'
  })
  public pid: number;

  @Index('vid-idx')
  @Column({
    type: 'integer',
    comment: 'package version id'
  })
  public vid: number;

  @Index('uid-idx')
  @Column({
    type: 'integer',
    comment: 'user id'
  })
  public uid: number;

  @Column({
    type: 'timestamp',
    comment: '创建时间'
  })
  public gmtc: Date;

  public add(pid: number, vid: number, uid: number) {
    this.pid = pid;
    this.vid = vid;
    this.uid = uid;
    this.gmtc = new Date();
    return this;
  }
}