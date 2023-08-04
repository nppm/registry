import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: 'npm_star' })
@Index(['pid', 'uid'], { unique: true })
export class NPMStarEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Index('pid-idx')
  @Column({
    type: 'integer',
    comment: 'package id'
  })
  public pid: number;

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

  public add(pid: number, uid: number) {
    this.pid = pid;
    this.uid = uid;
    this.gmtc = new Date();
    return this;
  }
}