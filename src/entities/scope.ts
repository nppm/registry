import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: 'npm_scope' })
@Index(['name'], { unique: true })
@Index(['deleted'])
export class NPMScopeEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'scope名称'
  })
  public name: string;

  @Column({
    type: 'bool',
    comment: '私有scope',
    default: false
  })
  public privatable: boolean;

  @Column({
    type: 'bool',
    comment: '是否已审批',
    default: false
  })
  public confirmed: boolean;

  @Column({
    type: 'bool',
    comment: '软删除',
    default: false
  })
  public deleted: boolean;

  @Column({
    type: 'integer',
    comment: '创建者',
  })
  public uid: number;

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

  public add(name: string, priv: boolean, uid: number, confirmed: boolean) {
    this.name = name;
    this.privatable = priv;
    this.confirmed = confirmed;
    this.uid = uid;
    this.gmtc = new Date();
    this.gmtm = new Date();
    this.deleted = false;
    return this;
  }

  public del() {
    this.deleted = true;
    this.gmtm = new Date();
    return this;
  }

  public updateComfirmStatus(confirmed: boolean) {
    this.confirmed = confirmed;
    this.gmtm = new Date();
    return this;
  }

  public updateOwner(uid: number) {
    this.uid = uid;
    this.gmtm = new Date();
    return this;
  }

  public updatePrivate(value: boolean) {
    this.privatable = value;
    this.gmtm = new Date();
    return this;
  }
}