import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: 'npm_maintainer' })
@Index(['namespace', 'uid'], { unique: true })
export class NPMMaintainerEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Index('uid-idx')
  @Column({
    type: 'integer',
    comment: '名称'
  })
  public uid: number;

  @Index('namespace-idx')
  @Column({
    type: 'varchar',
    length: 255,
    comment: '包名'
  })
  public namespace: string;

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

  public add(namespace: string, uid: number) {
    this.namespace = namespace;
    this.uid = uid;
    this.gmtc = this.gmtm = new Date();
    return this;
  }
}