import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: 'npm_package' })
export class NPMPackageEntity {
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
    comment: '所有者'
  })
  public uid: number;

  @Index('namespace-idx', { unique: true })
  @Column({
    type: 'varchar',
    length: 255,
    comment: '名称'
  })
  public namespace: string;

  @Index('rev-idx')
  @Column({
    type: 'varchar',
    length: 32,
    comment: 'md5指向',
    nullable: true
  })
  public rev: string;

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

  public add(sid: number, uid: number, namespace: string) {
    this.sid = sid;
    this.uid = uid;
    this.namespace = namespace;
    this.gmtc = this.gmtm = new Date();
    return this;
  }

  public updateRev(md5: string) {
    this.rev = md5;
    this.gmtm = new Date();
    return this;
  }
}