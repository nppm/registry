import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

export const SCOPE_ROLE = {
  developer: 0,
  admin: 1,
  owner: 2,
}

export enum SCOPE_ROLE_ENUM {
  developer,
  admin,
  owner,
}

@Entity({ name: 'npm_scope_user' })
@Index(['sid', 'uid'], { unique: true })
export class NPMScopeUserEntity {
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
    comment: 'userid'
  })
  public uid: number;

  @Column({
    type: 'integer',
    comment: '角色 SCOPE_ROLE',
  })
  public role: number;

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

  public add(sid: number, uid: number, role: number) {
    this.sid = sid;
    this.uid = uid;
    this.role = role;
    this.gmtm = this.gmtc = new Date();
    return this;
  }

  public updateRole(role: number) {
    this.role = role;
    this.gmtm = new Date();
    return this;
  }
}