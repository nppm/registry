import { NPMKeyWordEntity } from '../entities/keyword';
import { NPMPackageEntity } from '../entities/package';
import { NPMUserEntity } from '../entities/user';
import { NPMTagEntity } from '../entities/tag';
import { NPMVersionEntity } from '../entities/version';
import { NPMMaintainerEntity } from '../entities/maintainer';
import { TypeORMService } from '../model/service';
import { TypeORMConnection } from '@evio/visox-typeorm-ioredis-service';

export class PackageKeyWordService extends TypeORMService {
  private readonly KeyWord = this.getRepository(NPMKeyWordEntity);
  private readonly Maintainer = this.getRepository(NPMMaintainerEntity);
  private readonly Version = this.getRepository(NPMVersionEntity);

  constructor(
    conn: TypeORMConnection,
    private readonly pkg?: NPMPackageEntity,
  ) {
    super(conn);
  }

  public add(keyword: string) {
    return this.save(this.KeyWord.create().add(this.pkg.id, keyword));
  }

  public del() {
    return this.KeyWord.delete({ pid: this.pkg.id });
  }

  public save(target: NPMKeyWordEntity) {
    return this.KeyWord.save(target);
  }

  public async search(from: number, size: number, ...keywords: string[]) {
    const sql = this.KeyWord.createQueryBuilder('k')
      .leftJoin(NPMPackageEntity, 'p', 'p.id=k.pid')
      .select('p.id', 'pid')
      .addSelect('p.gmtm', 'date')
      .orderBy('p.gmtm', 'DESC');

    keywords.forEach((keyword, i) => {
      if (i === 0) {
        sql.where('k.keyword LIKE :keyword_' + i + ' OR p.namespace LIKE :keyword_' + i, { ['keyword_' + i]: '%' + keyword + '%' });
      } else {
        sql.orWhere('k.keyword LIKE :keyword_' + i + ' OR p.namespace LIKE :keyword_' + i, { ['keyword_' + i]: '%' + keyword + '%' });
      }
    })

    const result = await sql
      .distinct(true)
      .groupBy('pid')
      .offset(from)
      .limit(size)
      .getRawMany<{ pid: number, date: Date }>();
    const pids = result.map(res => res.pid);

    const maintainers = await this.Maintainer.createQueryBuilder('m')
      .leftJoin(NPMUserEntity, 'u', 'u.id=m.uid')
      .leftJoin(NPMPackageEntity, 'p', 'p.namespace=m.namespace')
      .select('u.account', 'name')
      .addSelect('u.email', 'email')
      .addSelect('p.id', 'id')
      .where('p.id IN (:...pids)', { pids })
      .getRawMany<{ id: number, name: string, email: string }>();

    const UserMaps = new Map<number, { username: string, email: string }[]>();
    maintainers.forEach(m => {
      if (!UserMaps.has(m.id)) {
        UserMaps.set(m.id, []);
      }
      const map = UserMaps.get(m.id);
      map.push({
        username: m.name,
        email: m.email,
      })
    })

    const values = await this.Version.createQueryBuilder('v')
      .leftJoin(NPMUserEntity, 'x', 'x.id=v.uid')
      .innerJoin(qb => {
        return qb.from(NPMTagEntity, 't')
          .innerJoin(qb => qb.from(NPMTagEntity, 'u')
            .select('u.name', 'name')
            .addSelect('MAX(u.gmtc)', 'time')
            .where('u.pid IN (:...pids) AND u.name=:name', { pids, name: 'latest' })
            , 's', 's.time=t.gmtc AND s.name=t.name'
          )
          .select('t.pid', 'pid')
          .addSelect('t.version', 'version')
      }, 's', 's.pid=v.pid AND s.version=v.version')
      .select('v.namespace', 'name')
      .addSelect('v.description', 'description')
      .addSelect('v.version', 'version')
      .addSelect('v.gmtc', 'date')
      .addSelect('v.manifest', 'manifest')
      .addSelect('x.account', 'username')
      .addSelect('x.email', 'email')
      .addSelect('v.pid', 'id')
      .getRawMany();

    return values.map(res => {
      return {
        package: {
          name: res.name,
          description: res.description,
          version: res.version,
          date: res.date,
          keywords: res.manifest.keywords,
          links: {
            bugs: res.manifest.bugs,
            homepage: res.manifest.homepage,
            repository: res.manifest.repository?.url,
          },
          maintainers: UserMaps.get(res.id) || [],
          publisher: {
            username: res.username,
            email: res.email
          }
        },
        score: {
          detail: {
            maintenance: 0,
            popularity: 0,
            quality: 0,
          },
          final: 0
        },
        searchScore: 0,
      }
    })
  }
}